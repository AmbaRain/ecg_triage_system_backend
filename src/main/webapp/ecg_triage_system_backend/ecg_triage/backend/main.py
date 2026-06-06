"""
Wearable Triage — FastAPI backend
Run: uvicorn main:app --reload
"""

import os, io, json, tempfile, struct
import numpy as np
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from model import (
    WearableTriageModel, UniversalSeverityEngine, UniversalInputAdapter,
    load_engine, ECG_LEN, PPG_LEN, ECG_FS, PPG_FS, WINDOW_SEC,
    DEVICE_PROFILES, ECGPreprocessor,
)

# ── Startup ───────────────────────────────────────────────────────────────────

engine: Optional[UniversalSeverityEngine] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    checkpoint = os.getenv("MODEL_CHECKPOINT")
    engine = load_engine(checkpoint_path=checkpoint, device="cpu")
    print("Engine ready ✓")
    yield

app = FastAPI(title="HelixMind Wearable Triage API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────

class TriageRequest(BaseModel):
    ecg:    Optional[List[float]] = None
    ppg:    Optional[List[float]] = None
    device: str = "generic_wearable"
    gps:    Optional[List[float]] = None

class DemoRequest(BaseModel):
    scenario: str = "Normal"
    device:   str = "generic_wearable"

# ── Synthetic signal generators ───────────────────────────────────────────────

def _gen_ecg(rhythm: str = "Normal") -> np.ndarray:
    t   = np.linspace(0, WINDOW_SEC, ECG_LEN)
    ecg = np.zeros_like(t)
    hr_map = {"Normal": 75, "AFib": 90, "Bradycardia": 38, "Tachycardia": 140, "Anomaly": 80}
    hr     = hr_map.get(rhythm, 75)

    if rhythm == "AFib":
        rr_base = 60.0 / hr
        pos = 0.0
        while pos < WINDOW_SEC:
            rr  = rr_base + np.random.uniform(-0.18, 0.18)
            idx = int(pos * (ECG_LEN / WINDOW_SEC))
            if idx < ECG_LEN:
                w = np.arange(-20, 20)
                ecg[max(0, idx-20):min(ECG_LEN, idx+20)] += np.exp(-w**2 / 8)
            pos += max(rr, 0.3)
    else:
        rr  = 60.0 / hr
        pos = 0.2
        while pos < WINDOW_SEC:
            idx = int(pos * (ECG_LEN / WINDOW_SEC))
            if idx < ECG_LEN:
                w = np.arange(-30, 30)
                ecg[max(0, idx-30):min(ECG_LEN, idx+30)] += 1.2 * np.exp(-w**2 / 18)
                tw = idx + int(0.25 * rr * (ECG_LEN / WINDOW_SEC))
                if tw < ECG_LEN:
                    wt = np.arange(-20, 20)
                    ecg[max(0, tw-20):min(ECG_LEN, tw+20)] += 0.3 * np.exp(-wt**2 / 50)
            pos += rr

    ecg += np.random.randn(ECG_LEN) * 0.04
    return ecg.astype(np.float32)


def _gen_ppg(hr=75, spo2=97.0, stress="Low") -> np.ndarray:
    t     = np.linspace(0, WINDOW_SEC, PPG_LEN)
    freq  = hr / 60.0
    sigma = {"Low": 0.02, "Medium": 0.05, "High": 0.09}.get(stress, 0.02)
    ppg   = 0.5 * np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t)
    ppg  += np.random.randn(PPG_LEN) * sigma
    target_r = (110.0 - spo2) / 25.0
    dc_scale  = ppg.std() / (target_r + 1e-8)
    ppg = ppg / (np.abs(ppg.mean()) + dc_scale + 1e-8)
    return ppg.astype(np.float32)


# ── WFDB parser (no wfdb library needed for .dat + .hea) ─────────────────────

def _parse_wfdb(dat_bytes: bytes, hea_bytes: bytes, lead_name: str = "II") -> tuple:
    """
    Parse PTB-XL WFDB format (.dat + .hea) without the wfdb library.
    Returns (signal_array, sample_rate, lead_names)
    """
    # Parse header
    lines = hea_bytes.decode("utf-8", errors="ignore").strip().splitlines()
    header = lines[0].split()
    n_leads   = int(header[1])
    fs        = int(header[2])
    n_samples = int(header[3])

    lead_names = []
    gains      = []
    baselines  = []

    for line in lines[1:n_leads+1]:
        parts = line.split()
        if len(parts) < 9:
            continue
        # gain field like "1000.0(0)/mV" → extract number before (
        gain_str = parts[2].split("(")[0]
        try:
            gain = float(gain_str)
        except ValueError:
            gain = 1000.0
        baseline = int(parts[4]) if len(parts) > 4 else 0
        lead_names.append(parts[-1])
        gains.append(gain)
        baselines.append(baseline)

    # Parse 16-bit little-endian .dat
    n_vals = n_samples * n_leads
    raw    = struct.unpack(f"<{n_vals}h", dat_bytes[:n_vals * 2])
    data   = np.array(raw, dtype=np.float32).reshape(n_samples, n_leads)

    # Convert ADC units → mV
    for i in range(n_leads):
        data[:, i] = (data[:, i] - baselines[i]) / gains[i]

    # Select requested lead
    lead_upper = lead_name.upper()
    lead_map   = {n.upper(): i for i, n in enumerate(lead_names)}
    idx        = lead_map.get(lead_upper, 1)   # default Lead II

    return data[:, idx].astype(np.float32), fs, lead_names


def _ptbxl_label_to_scenario(label: str) -> str:
    label = label.upper()
    if any(x in label for x in ["AFIB", "AF,", " AF", "ATRIAL FIB"]): return "AFib"
    if "BRAD" in label: return "Bradycardia"
    if "TACH" in label: return "Tachycardia"
    return "Normal"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"service": "HelixMind Triage API", "status": "ok", "docs": "/docs"}

@app.get("/devices")
def list_devices():
    return {"devices": list(DEVICE_PROFILES.keys())}

@app.get("/health")
def health():
    return {"status": "ok", "engine_loaded": engine is not None}


@app.post("/triage")
def triage(req: TriageRequest):
    if req.ecg is None and req.ppg is None:
        raise HTTPException(400, "Provide at least one of 'ecg' or 'ppg'.")
    try:
        adapter = UniversalInputAdapter(req.device)
    except ValueError as e:
        raise HTTPException(400, str(e))
    ecg_raw = np.array(req.ecg, dtype=np.float32) if req.ecg else None
    ppg_raw = np.array(req.ppg, dtype=np.float32) if req.ppg else None
    adapted = adapter.adapt(ecg_raw=ecg_raw, ppg_raw=ppg_raw)
    gps     = tuple(req.gps) if req.gps and len(req.gps) == 2 else None
    result  = engine.evaluate(adapted, gps=gps)
    return {**result.to_dict(), "quality_flags": adapted["quality_flags"]}


@app.post("/triage/demo")
def triage_demo(req: DemoRequest):
    valid = ["Normal", "AFib", "Bradycardia", "Tachycardia", "Anomaly"]
    if req.scenario not in valid:
        raise HTTPException(400, f"scenario must be one of {valid}")

    hr_map    = {"Normal":75,"AFib":105,"Bradycardia":38,"Tachycardia":145,"Anomaly":80}
    spo2_map  = {"Normal":97,"AFib":94,"Bradycardia":88,"Tachycardia":96,"Anomaly":92}
    stress_map= {"Normal":"Low","AFib":"High","Bradycardia":"Medium","Tachycardia":"High","Anomaly":"Medium"}

    hr, spo2, stress = hr_map[req.scenario], spo2_map[req.scenario], stress_map[req.scenario]
    ecg_raw = _gen_ecg(req.scenario)
    ppg_raw = _gen_ppg(hr, spo2, stress)

    adapter = UniversalInputAdapter(req.device)
    adapted = adapter.adapt(ecg_raw=ecg_raw, ppg_raw=ppg_raw)
    result  = engine.evaluate(adapted)

    ecg_display = adapted["ecg"][::ECG_LEN // 512].tolist()
    ppg_display = adapted["ppg"][::PPG_LEN // 256].tolist()

    return {
        **result.to_dict(),
        "quality_flags": adapted["quality_flags"],
        "demo_scenario": req.scenario,
        "ecg_display":   ecg_display,
        "ppg_display":   ppg_display,
    }


@app.post("/triage/wfdb")
async def triage_wfdb(
    dat_file:  UploadFile = File(..., description="PTB-XL .dat binary file"),
    hea_file:  UploadFile = File(..., description="PTB-XL .hea header file"),
    label:     str        = Form("Normal", description="Rhythm label from PTB-XL metadata CSV"),
    lead:      str        = Form("II",     description="Lead name: I, II, III, AVR, AVL, AVF, V1-V6"),
    device:    str        = Form("generic_wearable"),
):
    """
    Upload a PTB-XL WFDB record pair (.dat + .hea) and run triage.
    Files come from PTB-XL records500/ or records100/ folders.
    Example pair: 01000_hr.dat + 01000_hr.hea
    """
    if not dat_file.filename.endswith(".dat"):
        raise HTTPException(400, "dat_file must be a .dat file")
    if not hea_file.filename.endswith(".hea"):
        raise HTTPException(400, "hea_file must be a .hea file")

    dat_bytes = await dat_file.read()
    hea_bytes = await hea_file.read()

    try:
        ecg_raw, src_fs, lead_names = _parse_wfdb(dat_bytes, hea_bytes, lead_name=lead)
    except Exception as e:
        raise HTTPException(422, f"Could not parse WFDB files: {e}")

    try:
        adapter = UniversalInputAdapter(device)
        adapter.profile = {**adapter.profile, "ecg_fs": src_fs, "has_ecg": True}
    except ValueError as e:
        raise HTTPException(400, str(e))

    adapted = adapter.adapt(ecg_raw=ecg_raw, ppg_raw=None)
    result  = engine.evaluate(adapted)
    ecg_display = adapted["ecg"][::ECG_LEN // 512].tolist()

    return {
        **result.to_dict(),
        "quality_flags": adapted["quality_flags"],
        "ptbxl_label":   label,
        "lead_used":     lead,
        "all_leads":     lead_names,
        "source_fs":     src_fs,
        "ecg_display":   ecg_display,
    }


@app.get("/triage/stream")
async def triage_stream(scenario: str = "Normal", device: str = "generic_wearable"):
    """Server-Sent Events — pushes a new triage result every 4 seconds."""
    valid = ["Normal", "AFib", "Bradycardia", "Tachycardia", "Anomaly"]
    if scenario not in valid:
        raise HTTPException(400, f"scenario must be one of {valid}")

    import asyncio
    hr_map    = {"Normal":75,"AFib":105,"Bradycardia":38,"Tachycardia":145,"Anomaly":80}
    spo2_map  = {"Normal":97,"AFib":94,"Bradycardia":88,"Tachycardia":96,"Anomaly":92}
    stress_map= {"Normal":"Low","AFib":"High","Bradycardia":"Medium","Tachycardia":"High","Anomaly":"Medium"}

    async def gen():
        while True:
            hr, spo2, stress = hr_map[scenario], spo2_map[scenario], stress_map[scenario]
            ecg_raw = _gen_ecg(scenario)
            ppg_raw = _gen_ppg(hr, spo2, stress)
            adapter = UniversalInputAdapter(device)
            adapted = adapter.adapt(ecg_raw=ecg_raw, ppg_raw=ppg_raw)
            result  = engine.evaluate(adapted)
            payload = {
                **result.to_dict(),
                "ecg_display": adapted["ecg"][::ECG_LEN // 512].tolist(),
            }
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(4)

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/triage/csv")
async def triage_csv(
    file:       UploadFile = File(..., description="CSV file with ECG signal"),
    ecg_col:    str        = Form("ecg_value",  description="Column name containing ECG values"),
    time_col:   str        = Form("time",        description="Column name containing time (seconds). Leave blank if none."),
    delimiter:  str        = Form("auto",        description="Column delimiter: auto, comma, semicolon, tab"),
    src_fs:     float      = Form(0,             description="Source sample rate Hz. 0 = auto-detect from time column."),
    label:      str        = Form("Normal",      description="Rhythm label"),
    device:     str        = Form("generic_wearable"),
):
    """
    Upload any CSV file with a single ECG column and run triage.
    Supports comma, semicolon, or tab delimiters.
    Sample rate is auto-detected from the time column or can be specified manually.
    Works with files like: ecg_1d_timeseries_prediction.csv (time;ecg_value @ 1000Hz)
    """
    raw = await file.read()
    text = raw.decode("utf-8", errors="ignore")

    # Auto-detect delimiter
    if delimiter == "auto":
        first_line = text.split("\n")[0]
        if ";" in first_line:   sep = ";"
        elif "\t" in first_line: sep = "\t"
        else:                    sep = ","
    else:
        sep = {"comma": ",", "semicolon": ";", "tab": "\t"}.get(delimiter, ",")

    # Parse CSV
    import io as _io, csv as _csv
    reader = _csv.DictReader(_io.StringIO(text), delimiter=sep)
    rows   = [r for r in reader]

    if not rows:
        raise HTTPException(422, "CSV file is empty or could not be parsed.")

    # Find ECG column (case-insensitive fallback)
    headers    = list(rows[0].keys())
    ecg_col_actual = ecg_col
    if ecg_col not in headers:
        match = next((h for h in headers if ecg_col.lower() in h.lower()), None)
        if not match:
            # try common names
            for candidate in ["ecg", "signal", "value", "ecg_value", "amplitude", "mv", "voltage"]:
                match = next((h for h in headers if candidate in h.lower()), None)
                if match: break
        if not match:
            raise HTTPException(422, f"ECG column '{ecg_col}' not found. Available: {headers}")
        ecg_col_actual = match

    try:
        ecg_vals = np.array([float(r[ecg_col_actual]) for r in rows], dtype=np.float32)
    except (ValueError, KeyError) as e:
        raise HTTPException(422, f"Could not parse ECG values: {e}")

    # Detect sample rate
    detected_fs = float(src_fs)
    if detected_fs <= 0:
        time_col_actual = time_col if time_col in headers else None
        if not time_col_actual:
            time_col_actual = next((h for h in headers if "time" in h.lower() or "t" == h.lower()), None)

        if time_col_actual and len(rows) > 1:
            try:
                t0 = float(rows[0][time_col_actual])
                t1 = float(rows[1][time_col_actual])
                detected_fs = round(1.0 / (t1 - t0))
            except (ValueError, ZeroDivisionError):
                detected_fs = 256.0
        else:
            detected_fs = 256.0

    duration = len(ecg_vals) / detected_fs

    # Remove DC offset (mean subtraction)
    ecg_vals = ecg_vals - ecg_vals.mean()

    # Adapt and run
    try:
        adapter = UniversalInputAdapter(device)
        adapter.profile = {**adapter.profile, "ecg_fs": int(detected_fs), "has_ecg": True}
    except ValueError as e:
        raise HTTPException(400, str(e))

    adapted     = adapter.adapt(ecg_raw=ecg_vals, ppg_raw=None)
    result      = engine.evaluate(adapted)
    ecg_display = adapted["ecg"][::ECG_LEN // 512].tolist()

    return {
        **result.to_dict(),
        "quality_flags":  adapted["quality_flags"],
        "csv_label":      label,
        "ecg_col_used":   ecg_col_actual,
        "detected_fs":    detected_fs,
        "duration_sec":   round(duration, 2),
        "n_samples":      len(ecg_vals),
        "ecg_display":    ecg_display,
    }

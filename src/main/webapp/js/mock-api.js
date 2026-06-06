/**
 * mock-api.js
 * ECG Triage — Stubbed API Implementation
 *
 * Mirrors the api.js interface exactly. This file is the frozen development
 * baseline — do NOT modify it when real backend contracts arrive.
 * Only api.js changes when the backend is live.
 *
 * All functions return Promises that resolve/reject after a simulated delay,
 * so the rest of the application can be built and tested as if the network
 * is real.
 *
 * Sprint 1, Step 3 of 25.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Delay helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Simulates network + inference latency for write/heavy operations */
const MOCK_DELAY_MS = 1200;

/** Simulates fast read latency for lightweight GET calls */
const MOCK_READ_MS = 400;

/** @param {number} ms @returns {Promise<void>} */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ─────────────────────────────────────────────────────────────────────────────
// Mock data fixtures
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_TOKEN = 'mock.jwt.token.abc123';

const MOCK_USER = {
  user_id: 'u001',
  username: 'dr.adeyemi',
  full_name: 'Dr. Amaka Adeyemi',
  role: 'clinician',
};

/**
 * Generates a synthetic ECG-like signal for one lead.
 * Combines a sinusoidal base with a QRS spike and small noise so the waveform
 * looks clinically plausible on-screen without real patient data.
 *
 * @param {number} leadIndex  0–11; shifts phase per lead for visual variety.
 * @param {number} points     Number of sample points to generate.
 * @returns {number[]}
 */
function generateSyntheticSignal(leadIndex, points = 1000) {
  const phaseOffset = leadIndex * 0.3;
  return Array.from({ length: points }, (_, t) => {
    const normalised = t / points;
    // P-wave baseline
    const base = Math.sin((normalised * Math.PI * 20) + phaseOffset) * 0.15;
    // QRS complex — narrow spike at ~25 % into each cycle
    const cyclePos = (normalised * 5) % 1;
    const qrs =
      cyclePos > 0.2 && cyclePos < 0.3
        ? Math.sin((cyclePos - 0.2) * Math.PI * 10) * (1.2 + leadIndex * 0.05)
        : 0;
    // T-wave
    const tWave =
      cyclePos > 0.4 && cyclePos < 0.65
        ? Math.sin((cyclePos - 0.4) * Math.PI * 4) * 0.35
        : 0;
    // Subtle noise
    const noise = (Math.random() - 0.5) * 0.04;
    return base + qrs + tWave + noise;
  });
}

/** @type {Object} Canonical mock prediction — shared by upload and fetch stubs */
const MOCK_PREDICTION = {
  prediction_id: 'pred_001',
  patient_id: 'p_001',
  timestamp: new Date().toISOString(),
  status: 'success',
  diagnosis: {
    primary_label: 'Atrial Fibrillation',
    confidence: 0.91,
    secondary_labels: [
      { label: 'Normal Sinus Rhythm', confidence: 0.06 },
      { label: 'Left Bundle Branch Block', confidence: 0.03 },
    ],
  },
  waveform_data: {
    leads: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'],
    signals: Array.from({ length: 12 }, (_, i) => generateSyntheticSignal(i)),
    sampling_rate: 500,
  },
  metadata: {
    record_id: 'rec_001',
    duration_seconds: 10,
    num_leads: 12,
  },
};

/** @type {Array<Object>} 20-patient mock roster */
const MOCK_PATIENTS = Array.from({ length: 20 }, (_, i) => ({
  patient_id: `p_${String(i + 1).padStart(3, '0')}`,
  full_name: [
    'Amaka Adeyemi', 'Chidi Okonkwo', 'Fatima Al-Rashid', 'Priya Nair',
    'Samuel Mensah', 'Aisha Bello', 'Kwame Asante', 'Mei-Ling Chen',
    'Tariq Hassan', 'Ngozi Eze', 'David Kimani', 'Layla Ibrahim',
    'Yusuf Abdullahi', 'Grace Osei', 'Omar Diallo', 'Sione Tuilagi',
    'Nadia Volkov', 'Arjun Sharma', 'Emeka Obi', 'Zahra Khalil',
  ][i],
  date_of_birth: new Date(
    1950 + Math.floor(Math.random() * 40),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1,
  ).toISOString().split('T')[0],
  last_prediction_date: new Date(Date.now() - i * 86_400_000).toISOString(),
  prediction_count: Math.floor(Math.random() * 10) + 1,
}));


// ─────────────────────────────────────────────────────────────────────────────
// Auth endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Accepts username "demo" / password "demo" only.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ token: string, user: Object }>}
 */
export async function login(username, password) {
  await delay(MOCK_DELAY_MS);
  if (username === 'demo' && password === 'demo') {
    return { token: MOCK_TOKEN, user: MOCK_USER };
  }
  throw { status: 401, message: 'Invalid credentials. Use demo / demo.' };
}

/**
 * POST /auth/logout
 * Always succeeds in mock mode.
 *
 * @returns {Promise<{ success: boolean }>}
 */
export async function logout() {
  await delay(300);
  return { success: true };
}

/**
 * GET /auth/me
 * Returns the mock user without token validation.
 *
 * @returns {Promise<Object>}
 */
export async function getMe() {
  await delay(MOCK_READ_MS);
  return { ...MOCK_USER };
}


// ─────────────────────────────────────────────────────────────────────────────
// ECG upload endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /ecg/upload/csv
 * Simulates CSV upload + ML inference latency, returns prediction.
 *
 * @param {File} csvFile
 * @param {string} patientId
 * @returns {Promise<Object>}
 */
export async function uploadECGcsv(csvFile, patientId) {
  await delay(MOCK_DELAY_MS);
  return {
    ...MOCK_PREDICTION,
    patient_id: patientId,
    timestamp: new Date().toISOString(),
    metadata: { ...MOCK_PREDICTION.metadata, source_format: 'csv' },
  };
}

/**
 * POST /ecg/upload/wfdb
 * Simulates WFDB (DAT+HEA) upload + ML inference latency, returns prediction.
 *
 * @param {File} datFile
 * @param {File} heaFile
 * @param {string} patientId
 * @returns {Promise<Object>}
 */
export async function uploadECGwfdb(datFile, heaFile, patientId) {
  await delay(MOCK_DELAY_MS);
  return {
    ...MOCK_PREDICTION,
    patient_id: patientId,
    timestamp: new Date().toISOString(),
    metadata: { ...MOCK_PREDICTION.metadata, source_format: 'wfdb' },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Prediction endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /predictions/:id
 * Returns the canonical mock prediction regardless of the ID supplied.
 *
 * @param {string} predictionId
 * @returns {Promise<Object>}
 */
export async function getPrediction(predictionId) {
  await delay(MOCK_READ_MS);
  return { ...MOCK_PREDICTION, prediction_id: predictionId };
}


// ─────────────────────────────────────────────────────────────────────────────
// Patient endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /patients
 * Returns a paginated, optionally filtered patient list.
 *
 * @param {{ page?: number, limit?: number, search?: string }} options
 * @returns {Promise<{ patients: Array, total: number, page: number, limit: number }>}
 */
export async function getPatients({ page = 1, limit = 20, search = '' } = {}) {
  await delay(MOCK_READ_MS);
  const filtered = search
    ? MOCK_PATIENTS.filter(p =>
        p.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : MOCK_PATIENTS;

  const start = (page - 1) * limit;
  return {
    patients: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

/**
 * GET /patients/:id
 * Returns the matching mock patient, falling back to the first patient if
 * no match is found (so the results page always has data to display).
 *
 * @param {string} patientId
 * @returns {Promise<Object>}
 */
export async function getPatient(patientId) {
  await delay(MOCK_READ_MS);
  return MOCK_PATIENTS.find(p => p.patient_id === patientId) ?? MOCK_PATIENTS[0];
}

/**
 * GET /patients/:id/predictions
 * Returns the single canonical mock prediction wrapped in the expected shape.
 *
 * @param {string} patientId
 * @returns {Promise<{ patient_id: string, predictions: Array }>}
 */
export async function getPatientPredictions(patientId) {
  await delay(MOCK_READ_MS);
  return {
    patient_id: patientId,
    predictions: [{ ...MOCK_PREDICTION, patient_id: patientId }],
  };
}


// -----------------------------------------------------------------------------
// Sprint 5 � Alerts
// -----------------------------------------------------------------------------

const MOCK_ALERTS = [
  { alert_id:'alert_001', prediction_id:'pred_001', patient_id:'p_001', patient_name:'Amaka Adeyemi',     severity:'critical', title:'High-Confidence Atrial Fibrillation',    diagnosis_label:'Atrial Fibrillation',                   confidence:0.97, timestamp:new Date(Date.now()-2*60000).toISOString(),  status:'unreviewed' },
  { alert_id:'alert_002', prediction_id:'pred_002', patient_id:'p_003', patient_name:'Fatima Al-Rashid',  severity:'warning',  title:'Left Bundle Branch Block Detected',     diagnosis_label:'Left Bundle Branch Block',               confidence:0.82, timestamp:new Date(Date.now()-7*60000).toISOString(),  status:'unreviewed' },
  { alert_id:'alert_003', prediction_id:'pred_003', patient_id:'p_005', patient_name:'Samuel Mensah',     severity:'critical', title:'ST Elevation � Possible STEMI',         diagnosis_label:'ST Elevation Myocardial Infarction',    confidence:0.94, timestamp:new Date(Date.now()-15*60000).toISOString(), status:'unreviewed' },
  { alert_id:'alert_004', prediction_id:'pred_004', patient_id:'p_002', patient_name:'Chidi Okonkwo',     severity:'warning',  title:'Premature Ventricular Contractions',    diagnosis_label:'Premature Ventricular Contractions',    confidence:0.78, timestamp:new Date(Date.now()-32*60000).toISOString(), status:'reviewed'   },
  { alert_id:'alert_005', prediction_id:'pred_005', patient_id:'p_004', patient_name:'Priya Nair',        severity:'info',     title:'Routine Sinus Arrhythmia � Low Concern', diagnosis_label:'Sinus Arrhythmia',                     confidence:0.67, timestamp:new Date(Date.now()-60*60000).toISOString(), status:'unreviewed' },
];

export async function getAlerts({ page=1, limit=20, severity='' }={}) {
  await delay(MOCK_READ_MS);
  const filtered = severity ? MOCK_ALERTS.filter(a=>a.severity===severity) : MOCK_ALERTS;
  const start=(page-1)*limit;
  return { alerts:filtered.slice(start,start+limit), total:filtered.length, unreviewed_count:MOCK_ALERTS.filter(a=>a.status==='unreviewed').length, page, limit };
}

export async function dismissAlert(alertId) {
  await delay(400);
  const a=MOCK_ALERTS.find(x=>x.alert_id===alertId); if(a) a.status='reviewed';
  return { success:true, alert_id:alertId };
}


// -----------------------------------------------------------------------------
// Sprint 5 � Reports
// -----------------------------------------------------------------------------

const MOCK_WRITTEN_REPORTS = [
  { report_id:'rep_001', prediction_id:'pred_001', patient_id:'p_001', patient_name:'Amaka Adeyemi',    report_title:'Discharge Summary - Amaka Adeyemi',        report_type:'discharge',  diagnosis_label:'Atrial Fibrillation',                 confidence:0.91, summary:'Patient discharged in stable condition. AF managed with rate-control therapy. Follow-up with cardiology in 2 weeks.',          upload_format:'csv',  created_at:new Date(Date.now()-4*3600000).toISOString()  },
  { report_id:'rep_002', prediction_id:'pred_002', patient_id:'p_002', patient_name:'Chidi Okonkwo',   report_title:'Daily Vitals Report - Chidi Okonkwo',       report_type:'vitals',     diagnosis_label:'Normal Sinus Rhythm',                 confidence:0.88, summary:'All vitals within normal range. Patient compliant with medication schedule. No acute episodes in past 24 hours.',             upload_format:'csv',  created_at:new Date(Date.now()-10*3600000).toISOString() },
  { report_id:'rep_003', prediction_id:'pred_003', patient_id:'p_003', patient_name:'Fatima Al-Rashid',report_title:'Cardiac Monitoring Report - Fatima Al-Rashid',report_type:'monitoring', diagnosis_label:'Left Bundle Branch Block',             confidence:0.82, summary:'Patient shows stable sinus rhythm with occasional PVCs. Heart rate maintained between 58-72 bpm over 24h period.',            upload_format:'wfdb', created_at:new Date(Date.now()-18*3600000).toISOString() },
  { report_id:'rep_004', prediction_id:'pred_004', patient_id:'p_004', patient_name:'Priya Nair',      report_title:'Neurological Assessment - Priya Nair',      report_type:'diagnostic', diagnosis_label:'Sinus Arrhythmia',                    confidence:0.75, summary:'ECG confirms paroxysmal atrial activity. Neurological markers within expected range. Further monitoring advised.',              upload_format:'csv',  created_at:new Date(Date.now()-28*3600000).toISOString() },
  { report_id:'rep_005', prediction_id:'pred_005', patient_id:'p_005', patient_name:'Samuel Mensah',   report_title:'Diagnostic Report - Samuel Mensah',         report_type:'diagnostic', diagnosis_label:'ST Elevation Myocardial Infarction',   confidence:0.94, summary:'Urgent STEMI findings confirmed. Patient transferred to cath lab. PCI performed successfully. Monitoring in CCU.',            upload_format:'wfdb', created_at:new Date(Date.now()-40*3600000).toISOString() },
];

export async function getReports({ page=1, limit=20, from='', to='' }={}) {
  await delay(MOCK_READ_MS);
  let filtered=[...MOCK_WRITTEN_REPORTS];
  if(from) filtered=filtered.filter(r=>new Date(r.created_at)>=new Date(from));
  if(to)   filtered=filtered.filter(r=>new Date(r.created_at)<=new Date(to));
  const start=(page-1)*limit;
  return { reports:filtered.slice(start,start+limit), total:filtered.length, page, limit };
}

export async function getReportsSummary() {
  await delay(MOCK_READ_MS);
  return { total_predictions:18, predictions_today:4, diagnosis_breakdown:[{label:'Atrial Fibrillation',count:5},{label:'Normal Sinus Rhythm',count:4},{label:'Left Bundle Branch Block',count:4},{label:'ST Elevation Myocardial Infarction',count:3},{label:'Premature Ventricular Contractions',count:2}], avg_confidence:0.88, total_reports:MOCK_WRITTEN_REPORTS.length };
}

export async function exportReport(reportId) {
  await delay(600);
  const r=MOCK_WRITTEN_REPORTS.find(x=>x.report_id===reportId)||MOCK_WRITTEN_REPORTS[0];
  const csv=`report_id,patient_id,patient_name,report_type,diagnosis_label,confidence,created_at\n${r.report_id},${r.patient_id},${r.patient_name},${r.report_type},${r.diagnosis_label},${r.confidence},${r.created_at}`;
  return new Blob([csv],{type:'text/csv'});
}

export async function exportReportsBulk({from='',to=''}={}) {
  await delay(800);
  const hdr='report_id,patient_id,patient_name,report_type,diagnosis_label,confidence,created_at';
  const rows=MOCK_WRITTEN_REPORTS.map(r=>`${r.report_id},${r.patient_id},${r.patient_name},${r.report_type},${r.diagnosis_label},${r.confidence},${r.created_at}`).join('\n');
  return new Blob([hdr+'\n'+rows],{type:'text/csv'});
}

export async function createReport(body) {
  await delay(800);
  const patient=MOCK_PATIENTS.find(p=>p.patient_id===body.patient_id)||MOCK_PATIENTS[0];
  const newRep={ report_id:`rep_${String(MOCK_WRITTEN_REPORTS.length+1).padStart(3,'0')}`, prediction_id:body.prediction_id||null, patient_id:body.patient_id, patient_name:patient.full_name, report_title:body.report_title, report_type:body.report_type, diagnosis_label:body.diagnosis_label||'�', confidence:null, summary:body.summary, upload_format:null, created_at:new Date().toISOString() };
  MOCK_WRITTEN_REPORTS.unshift(newRep);
  return { success:true, report:newRep };
}


// -----------------------------------------------------------------------------
// Sprint 5 � Settings
// -----------------------------------------------------------------------------

const MOCK_SETTINGS = {
  display_name:'Dr. Amaka Adeyemi', email:'dr.adeyemi@ecgtriage.hospital.org', specialty:'Cardiology', hospital:'Lagos University Teaching Hospital',
  critical_alerts:true, warning_alerts:true, patient_updates:true, report_generated:false, email_notifications:true,
  alert_threshold_confidence:0.85, default_upload_format:'csv', timezone:'Africa/Lagos', items_per_page:20,
};

export async function getSettings() { await delay(300); return { ...MOCK_SETTINGS }; }

export async function saveSettings(preferences) { await delay(500); Object.assign(MOCK_SETTINGS,preferences); return { success:true, settings:{...MOCK_SETTINGS} }; }

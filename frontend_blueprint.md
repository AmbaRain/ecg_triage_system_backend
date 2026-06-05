# ECG Triage — Frontend Technical Blueprint
**Version:** 1.0.0 | **Status:** Active Development | **Stack:** HTML + Vanilla CSS + Vanilla JS

---

## Table of Contents
1. [Frontend Overview & Goals](#1-frontend-overview--goals)
2. [UI Architecture & Page Map](#2-ui-architecture--page-map)
3. [Component & File Structure](#3-component--file-structure)
4. [API Integration Layer](#4-api-integration-layer)
5. [Auth Flow & Route Protection](#5-auth-flow--route-protection)
6. [ECG Upload & Prediction Flow](#6-ecg-upload--prediction-flow)
7. [Waveform Rendering Specification](#7-waveform-rendering-specification)
8. [Role-Based UI Logic](#8-role-based-ui-logic)
9. [State & Data Management](#9-state--data-management)
10. [Error Handling & Loading States](#10-error-handling--loading-states)
11. [Backend Compatibility Notes](#11-backend-compatibility-notes)
12. [Build & Deployment](#12-build--deployment)
13. [Accepted Trade-offs & Deferred Decisions](#13-accepted-trade-offs--deferred-decisions)
14. [Prioritized Build Order](#14-prioritized-build-order)

---

## 1. Frontend Overview & Goals

### Project Summary
ECG Triage is an AI-powered clinical web dashboard for uploading ECG waveform data and receiving real-time diagnostic predictions via a CNN + BiLSTM model. Users are clinicians and researchers.

### Frontend Goals
- Provide a fast, reliable upload interface for two ECG input modes (CSV or DAT+HEA pair)
- Display synchronous prediction results with waveform visualization immediately after upload
- Maintain a patient record system with historical prediction access
- Operate safely against unconfirmed backend contracts via a full mock-api layer
- Be deployable as a static file bundle served by the Java Servlet

### Non-Goals (Current Scope)
- Real-time streaming or WebSocket connections
- Multi-role access control (deferred)
- Offline-first / PWA capabilities
- Mobile-responsive optimization (clinical desktop workstation primary target)

### Clinical Data Sensitivity Notice
This application handles patient ECG data. Every decision touching data storage, transmission, or display must be evaluated against HIPAA minimum necessary standards. Flagged items are marked ⚠️ HIPAA throughout this document.

---

## 2. UI Architecture & Page Map

### Architecture: Multi-Page Application (MPA)
Each page is a standalone HTML document. No client-side router. Navigation is standard `<a href>` links. Cross-page state is passed via URL query parameters or sessionStorage (see Section 9).

### Page Inventory

| Page | File | Route | Description |
|------|------|--------|-------------|
| Login | `login.html` | `/login.html` | Credential entry, JWT acquisition |
| Dashboard | `dashboard.html` | `/dashboard.html` | Summary stats, recent activity, quick upload |
| Upload | `upload.html` | `/upload.html` | ECG file upload (CSV or DAT+HEA), submission |
| Results | `results.html` | `/results.html?prediction_id=<id>` | Prediction output, waveform, diagnosis labels |
| Patient List | `patients.html` | `/patients.html` | Searchable/filterable patient index |
| Patient Record | `patient.html` | `/patient.html?patient_id=<id>` | Individual patient history, past predictions |
| 404 | `404.html` | fallback | Error page for unknown routes |

### Cross-Page Navigation Contract
- **Results page** always receives `prediction_id` as a URL query param: `/results.html?prediction_id=abc123`
- **Patient record page** always receives `patient_id`: `/patient.html?patient_id=p456`
- **Upload → Results transition**: On successful upload response, redirect via `window.location.href = '/results.html?prediction_id=' + response.prediction_id`
- Query params are the canonical source of truth for page-level context. sessionStorage is secondary fallback only.

---

## 3. Component & File Structure

```
ecg-triage/
├── index.html                  → redirects to login.html or dashboard.html based on auth state
├── login.html
├── dashboard.html
├── upload.html
├── results.html
├── patients.html
├── patient.html
├── 404.html
│
├── css/
│   └── styles.css              → single hand-authored stylesheet; all custom properties defined here
│
├── js/
│   ├── config.js               → all environment constants (URLs, limits, defaults)
│   ├── state.js                → global state module with pub/sub pattern
│   ├── auth.js                 → token management, route protection, user context
│   ├── api.js                  → real fetch calls (swap in when backend is live)
│   ├── mock-api.js             → stubbed responses matching api.js interface exactly
│   ├── api-adapter.js          → single import point; switches between api.js and mock-api.js
│   ├── router.js               → URL param parsing utilities
│   ├── upload.js               → file validation, upload flow, mode detection
│   ├── waveform.js             → Plotly.js rendering, signal prep, lead layout
│   ├── patients.js             → patient list search, filter, pagination
│   └── components/
│       ├── nav.js              → injects shared navigation HTML into every page
│       ├── toast.js            → global toast notification system
│       ├── modal.js            → reusable modal component
│       ├── loader.js           → loading overlay and spinner management
│       └── patient-card.js     → patient summary card used on list + dashboard
│
├── assets/
│   └── icons/                  → SVG icons (inline where possible, no icon font CDN)
│
└── vendor/
    └── plotly.min.js           → locally vendored Plotly.js (do NOT use CDN; see Section 12)
```

### Shared Component Injection Pattern
Every page includes shared nav via JS injection. No server-side templating.

```html
<!-- In every page <body>, first child: -->
<div id="nav-container"></div>
<script type="module">
  import { injectNav } from './js/components/nav.js';
  injectNav(document.getElementById('nav-container'));
</script>
```

`nav.js` renders the nav HTML string and sets the active link based on `window.location.pathname`.

### CSS Architecture
```css
/* styles.css — structure */

/* 1. Custom Properties (design tokens) */
:root {
  --color-bg: #0d1117;
  --color-surface: #161b22;
  --color-border: #30363d;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-accent: #2ea043;
  --color-accent-hover: #3fb950;
  --color-danger: #f85149;
  --color-warning: #d29922;
  --color-info: #388bfd;
  --font-base: 'IBM Plex Mono', monospace;
  --font-display: 'IBM Plex Sans', sans-serif;
  --radius-sm: 4px;
  --radius-md: 8px;
  --space-unit: 8px;
  --sidebar-width: 240px;
  --content-max-width: 1200px;
}

/* 2. Reset */
/* 3. Typography */
/* 4. Layout (grid, sidebar, content area) */
/* 5. Navigation */
/* 6. Forms & Inputs */
/* 7. Buttons */
/* 8. Cards */
/* 9. Upload Zone */
/* 10. Waveform Container */
/* 11. Patient List & Table */
/* 12. Results / Diagnosis Display */
/* 13. Toast Notifications */
/* 14. Modal */
/* 15. Loading States */
/* 16. Utility Classes */
```

**Font loading:** Import IBM Plex fonts from Google Fonts in `styles.css` `@import` at top. If offline/intranet deployment is required, download and self-host font files in `assets/fonts/`.

---

## 4. API Integration Layer

### Switching Between Mock and Real API

```js
// api-adapter.js
import * as RealAPI from './api.js';
import * as MockAPI from './mock-api.js';

const USE_MOCK = true; // SET TO false WHEN BACKEND IS LIVE

export const API = USE_MOCK ? MockAPI : RealAPI;
```

All application code imports from `api-adapter.js` only. Never import directly from `api.js` or `mock-api.js`.

```js
// Usage in any page script:
import { API } from './js/api-adapter.js';
const result = await API.uploadECG(formData);
```

---

### config.js — All Constants

```js
// config.js
export const CONFIG = {
  // API URLs — DEFERRED: replace with confirmed values from backend team
  API_BASE_URL: 'http://localhost:8080/api',       // Java Servlet (dev)
  ML_API_BASE_URL: 'http://localhost:5000/api',    // Python microservice (dev)

  // Auth
  AUTH_TOKEN_KEY: 'ecg_auth_token',               // sessionStorage key
  AUTH_USER_KEY: 'ecg_current_user',              // sessionStorage key

  // Upload limits — DEFERRED: confirm with backend team
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,          // 10MB per file
  MAX_TOTAL_UPLOAD_BYTES: 25 * 1024 * 1024,       // 25MB total

  // ECG defaults — DEFERRED: confirm lead count with backend team
  DEFAULT_LEAD_COUNT: 12,
  LEAD_LABELS: ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'],
  DISPLAY_POINTS_PER_LEAD: 1000,                  // downsample target for Plotly rendering

  // Request timeout — set above expected max inference time; confirm SLA with backend
  FETCH_TIMEOUT_MS: 45000,                        // 45 seconds

  // Pagination
  PATIENTS_PER_PAGE: 20,
};
```

---

### Endpoint Registry

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/auth/login` | `login()` | Authenticate user, receive JWT |
| POST | `/auth/logout` | `logout()` | Invalidate session |
| GET | `/auth/me` | `getMe()` | Validate token, fetch current user |
| POST | `/ecg/upload/csv` | `uploadECGcsv()` | Upload CSV file, receive prediction |
| POST | `/ecg/upload/wfdb` | `uploadECGwfdb()` | Upload DAT+HEA pair, receive prediction |
| GET | `/predictions/:id` | `getPrediction()` | Fetch stored prediction result by ID |
| GET | `/patients` | `getPatients()` | Paginated patient list |
| GET | `/patients/:id` | `getPatient()` | Single patient record |
| GET | `/patients/:id/predictions` | `getPatientPredictions()` | All predictions for a patient |

---

### api.js — Real Implementation

```js
// api.js
import { CONFIG } from './config.js';
import { getAuthToken } from './auth.js';

// Fetch wrapper with timeout and auth header
async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw { status: response.status, message: error.message || 'Request failed' };
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { status: 408, message: 'Request timed out. The server may still be processing.' };
    }
    throw err;
  }
}

// For multipart form data (file uploads) — do NOT set Content-Type; browser sets boundary
async function apiUpload(url, formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw { status: response.status, message: error.message || 'Upload failed' };
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw { status: 408, message: 'Upload timed out. ECG analysis may take longer than expected.' };
    }
    throw err;
  }
}

export async function login(username, password) {
  return apiFetch(`${CONFIG.API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return apiFetch(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST' });
}

export async function getMe() {
  return apiFetch(`${CONFIG.API_BASE_URL}/auth/me`);
}

export async function uploadECGcsv(csvFile, patientId) {
  const formData = new FormData();
  formData.append('file', csvFile);
  formData.append('patient_id', patientId);
  formData.append('format', 'csv');
  return apiUpload(`${CONFIG.API_BASE_URL}/ecg/upload/csv`, formData);
}

export async function uploadECGwfdb(datFile, heaFile, patientId) {
  const formData = new FormData();
  formData.append('dat_file', datFile);
  formData.append('hea_file', heaFile);
  formData.append('patient_id', patientId);
  formData.append('format', 'wfdb');
  return apiUpload(`${CONFIG.API_BASE_URL}/ecg/upload/wfdb`, formData);
}

export async function getPrediction(predictionId) {
  return apiFetch(`${CONFIG.API_BASE_URL}/predictions/${predictionId}`);
}

export async function getPatients({ page = 1, limit = CONFIG.PATIENTS_PER_PAGE, search = '' } = {}) {
  const params = new URLSearchParams({ page, limit, search });
  return apiFetch(`${CONFIG.API_BASE_URL}/patients?${params}`);
}

export async function getPatient(patientId) {
  return apiFetch(`${CONFIG.API_BASE_URL}/patients/${patientId}`);
}

export async function getPatientPredictions(patientId) {
  return apiFetch(`${CONFIG.API_BASE_URL}/patients/${patientId}/predictions`);
}
```

---

### mock-api.js — Stubbed Implementation

```js
// mock-api.js
// Mirrors api.js interface exactly. Do NOT modify this file when backend contracts arrive.
// Only api.js changes. This file is the frozen development baseline.

const MOCK_DELAY_MS = 1200; // Simulate network + inference latency

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MOCK_TOKEN = 'mock.jwt.token.abc123';

const MOCK_USER = {
  user_id: 'u001',
  username: 'dr.adeyemi',
  full_name: 'Dr. Amaka Adeyemi',
  role: 'clinician',
};

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
    leads: ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'],
    // Generates synthetic sinusoidal signal data for each lead
    signals: Array.from({ length: 12 }, (_, i) =>
      Array.from({ length: 1000 }, (_, t) =>
        Math.sin((t / 100) * Math.PI * 2 + i * 0.3) * (0.8 + Math.random() * 0.4)
      )
    ),
    sampling_rate: 500,
  },
  metadata: {
    record_id: 'rec_001',
    duration_seconds: 10,
    num_leads: 12,
  },
};

const MOCK_PATIENTS = Array.from({ length: 20 }, (_, i) => ({
  patient_id: `p_${String(i + 1).padStart(3, '0')}`,
  full_name: `Patient ${i + 1}`,
  date_of_birth: '1970-01-01',
  last_prediction_date: new Date(Date.now() - i * 86400000).toISOString(),
  prediction_count: Math.floor(Math.random() * 10) + 1,
}));

export async function login(username, password) {
  await delay(MOCK_DELAY_MS);
  if (username === 'demo' && password === 'demo') {
    return { token: MOCK_TOKEN, user: MOCK_USER };
  }
  throw { status: 401, message: 'Invalid credentials' };
}

export async function logout() {
  await delay(300);
  return { success: true };
}

export async function getMe() {
  await delay(300);
  return MOCK_USER;
}

export async function uploadECGcsv(csvFile, patientId) {
  await delay(MOCK_DELAY_MS);
  return { ...MOCK_PREDICTION, patient_id: patientId };
}

export async function uploadECGwfdb(datFile, heaFile, patientId) {
  await delay(MOCK_DELAY_MS);
  return { ...MOCK_PREDICTION, patient_id: patientId };
}

export async function getPrediction(predictionId) {
  await delay(500);
  return { ...MOCK_PREDICTION, prediction_id: predictionId };
}

export async function getPatients({ page = 1, limit = 20, search = '' } = {}) {
  await delay(500);
  const filtered = search
    ? MOCK_PATIENTS.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()))
    : MOCK_PATIENTS;
  const start = (page - 1) * limit;
  return {
    patients: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

export async function getPatient(patientId) {
  await delay(400);
  return MOCK_PATIENTS.find(p => p.patient_id === patientId) || MOCK_PATIENTS[0];
}

export async function getPatientPredictions(patientId) {
  await delay(500);
  return {
    patient_id: patientId,
    predictions: [MOCK_PREDICTION],
  };
}
```

---

## 5. Auth Flow & Route Protection

### Token Lifecycle

```
Login form submit
  → POST /auth/login { username, password }
  → Response: { token: "...", user: { user_id, username, full_name, role } }
  → sessionStorage.setItem('ecg_auth_token', token)
  → sessionStorage.setItem('ecg_current_user', JSON.stringify(user))
  → window.location.href = '/dashboard.html'
```

### auth.js

```js
// auth.js
import { CONFIG } from './config.js';
import { API } from './api-adapter.js';

export function getAuthToken() {
  return sessionStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem(CONFIG.AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export async function login(username, password) {
  const data = await API.login(username, password);
  sessionStorage.setItem(CONFIG.AUTH_TOKEN_KEY, data.token);
  sessionStorage.setItem(CONFIG.AUTH_USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  try {
    await API.logout();
  } finally {
    // Always clear local state even if server call fails
    sessionStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    sessionStorage.removeItem(CONFIG.AUTH_USER_KEY);
    window.location.href = '/login.html';
  }
}

// Call at top of every protected page
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}
```

### Route Protection Pattern
Every protected page includes this as the first script executed:

```html
<!-- In every protected page <head>, before any other JS -->
<script type="module">
  import { requireAuth } from './js/auth.js';
  requireAuth(); // Redirects to login.html if no token
</script>
```

`login.html` is the only page that does NOT include this guard. It should redirect to `dashboard.html` if a valid token is already present:

```js
// login.html init script
import { isAuthenticated } from './js/auth.js';
if (isAuthenticated()) {
  window.location.href = '/dashboard.html';
}
```

### ⚠️ HIPAA Note
sessionStorage is cleared on tab close but is readable by any JavaScript on the page, making it vulnerable to XSS. If the application is ever subject to a security audit, this will be a finding. Migration path: request the backend team implement HttpOnly cookie sessions and replace sessionStorage token storage with cookie-based auth. The `auth.js` module is the only file that requires changes.

---

## 6. ECG Upload & Prediction Flow

### Upload Mode Detection
The upload page presents a toggle UI for two modes. Mode selection determines which file inputs are shown and which API function is called.

```js
// upload.js
import { CONFIG } from './config.js';
import { API } from './api-adapter.js';
import { showLoader, hideLoader } from './components/loader.js';
import { showToast } from './components/toast.js';

const UploadMode = { CSV: 'csv', WFDB: 'wfdb' };
let currentMode = UploadMode.CSV;

// File validation
function validateFile(file, allowedExtensions) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Invalid file type: .${ext}. Expected: ${allowedExtensions.join(', ')}`);
  }
  if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
  }
}

function validateWFDBPair(datFile, heaFile) {
  // Strip extension and compare base names
  const datBase = datFile.name.replace(/\.dat$/i, '');
  const heaBase = heaFile.name.replace(/\.hea$/i, '');
  if (datBase !== heaBase) {
    throw new Error(`File name mismatch: "${datFile.name}" and "${heaFile.name}" must share the same base name.`);
  }
}

function getTotalSize(...files) {
  return files.reduce((sum, f) => sum + (f ? f.size : 0), 0);
}

// Main upload handler
export async function handleUploadSubmit(patientId) {
  try {
    let result;

    if (currentMode === UploadMode.CSV) {
      const csvFile = document.getElementById('input-csv').files[0];
      if (!csvFile) throw new Error('Please select a CSV file.');
      validateFile(csvFile, ['csv']);

      showLoader('Uploading ECG data...');
      result = await API.uploadECGcsv(csvFile, patientId);

    } else {
      const datFile = document.getElementById('input-dat').files[0];
      const heaFile = document.getElementById('input-hea').files[0];
      if (!datFile || !heaFile) throw new Error('Please select both .dat and .hea files.');
      validateFile(datFile, ['dat']);
      validateFile(heaFile, ['hea']);
      validateWFDBPair(datFile, heaFile);

      const totalSize = getTotalSize(datFile, heaFile);
      if (totalSize > CONFIG.MAX_TOTAL_UPLOAD_BYTES) {
        throw new Error(`Combined file size too large: ${(totalSize / 1024 / 1024).toFixed(1)}MB. Maximum: ${CONFIG.MAX_TOTAL_UPLOAD_BYTES / 1024 / 1024}MB`);
      }

      showLoader('Uploading ECG data...');
      result = await API.uploadECGwfdb(datFile, heaFile, patientId);
    }

    // Update loader message after upload completes, during inference
    document.getElementById('loader-message').textContent = 'Analyzing ECG...';

    hideLoader();

    // Navigate to results page with prediction ID
    window.location.href = `/results.html?prediction_id=${result.prediction_id}`;

  } catch (err) {
    hideLoader();
    showToast(err.message || 'Upload failed. Please try again.', 'error');
  }
}
```

### Upload Page UI State Machine

```
IDLE
  → User selects mode (CSV / WFDB)
  → User selects file(s)
  → Client-side validation runs on file select
    → INVALID: show inline file error, disable submit button
    → VALID: enable submit button
  → User enters / confirms patient ID
  → User clicks Submit
UPLOADING
  → Loader overlay: "Uploading ECG data..."
  → Submit button disabled
ANALYZING
  → Loader overlay: "Analyzing ECG..."
  → (same request, loader message updates mid-flight)
SUCCESS
  → Redirect: /results.html?prediction_id=<id>
ERROR
  → hideLoader()
  → Toast notification with error message
  → Form re-enabled for retry
```

### Synchronous Flow Diagram
```
[Upload Form]
    │
    ▼
POST /ecg/upload/csv  OR  POST /ecg/upload/wfdb
    │ (request held open during ML inference)
    │ ~2–30 seconds
    ▼
Response: { prediction_id, diagnosis, waveform_data, ... }
    │
    ▼
window.location.href = /results.html?prediction_id=...
    │
    ▼
[Results Page] → GET /predictions/:id (or use sessionStorage cache)
```

**Note on async variant:** If the backend team later moves to async inference (webhook or polling), the change is isolated to `upload.js`. Replace the `uploadECG*` calls with a two-step flow: (1) POST returns a `job_id`, (2) poll `GET /predictions/:id` every 2 seconds until `status !== 'pending'`. The results page does not need to change.

---

## 7. Waveform Rendering Specification

### Plotly.js Setup
Plotly is vendored locally at `vendor/plotly.min.js`. It is loaded only on pages that render waveforms (`results.html`, `patient.html`). Do not include it on other pages.

```html
<!-- Only in results.html and patient.html -->
<script src="./vendor/plotly.min.js"></script>
```

### waveform.js

```js
// waveform.js
import { CONFIG } from './config.js';

/**
 * Downsamples a signal array to a target point count using min-max decimation.
 * This preserves peaks (clinically important) while reducing render load.
 */
function downsampleSignal(signal, targetPoints) {
  if (signal.length <= targetPoints) return signal;
  const factor = Math.floor(signal.length / targetPoints);
  const result = [];
  for (let i = 0; i < targetPoints; i++) {
    const chunk = signal.slice(i * factor, (i + 1) * factor);
    // Preserve min and max within each chunk to retain waveform morphology
    result.push(chunk.reduce((a, b) => Math.abs(b) > Math.abs(a) ? b : a, 0));
  }
  return result;
}

/**
 * Renders a stacked 12-lead (or n-lead) ECG waveform in the target container.
 * @param {string} containerId - DOM element ID to render into
 * @param {Object} waveformData - waveform_data object from prediction response
 */
export function renderWaveform(containerId, waveformData) {
  const { leads, signals, sampling_rate } = waveformData;

  if (!leads || !signals || leads.length !== signals.length) {
    renderFallback(containerId, 'Waveform data is incomplete or malformed.');
    return;
  }

  const targetPoints = CONFIG.DISPLAY_POINTS_PER_LEAD;
  const timeAxis = Array.from(
    { length: targetPoints },
    (_, i) => i / sampling_rate
  );

  // Each lead is a separate trace, offset vertically for stacked display
  const traces = leads.map((leadLabel, i) => {
    const signal = downsampleSignal(signals[i], targetPoints);
    const offset = -i * 2; // 2mV vertical separation between leads

    return {
      x: timeAxis,
      y: signal.map(v => v + offset),
      type: 'scatter',
      mode: 'lines',
      name: leadLabel,
      line: { width: 1, color: '#2ea043' },
      hovertemplate: `<b>${leadLabel}</b><br>t: %{x:.3f}s<br>mV: %{customdata:.3f}<extra></extra>`,
      customdata: signal,
    };
  });

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: '#0d1117',
    font: { color: '#8b949e', family: 'IBM Plex Mono, monospace', size: 11 },
    margin: { t: 20, b: 40, l: 60, r: 20 },
    height: leads.length * 80 + 60,
    xaxis: {
      title: 'Time (s)',
      color: '#30363d',
      gridcolor: '#21262d',
      zeroline: false,
    },
    yaxis: {
      tickvals: leads.map((_, i) => -i * 2),
      ticktext: leads,
      color: '#30363d',
      gridcolor: '#21262d',
      zeroline: false,
    },
    showlegend: false,
    hovermode: 'x unified',
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
    displaylogo: false,
  };

  try {
    Plotly.newPlot(containerId, traces, layout, config);
  } catch (err) {
    renderFallback(containerId, 'Waveform rendering failed. Raw data is available for download.');
  }
}

/**
 * Destroys the Plotly instance in a container (call before re-rendering).
 */
export function destroyWaveform(containerId) {
  const el = document.getElementById(containerId);
  if (el && el._fullLayout) {
    Plotly.purge(containerId);
  }
}

/**
 * Renders a fallback error message inside the waveform container.
 */
function renderFallback(containerId, message) {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = `
      <div class="waveform-fallback">
        <span class="icon-warning">⚠</span>
        <p>${message}</p>
      </div>
    `;
  }
}
```

### Waveform Container HTML
```html
<!-- In results.html and patient.html -->
<div class="waveform-section">
  <div class="waveform-header">
    <h3>ECG Waveform</h3>
    <span class="waveform-meta" id="waveform-meta">12 leads · 500 Hz · 10s</span>
  </div>
  <div id="waveform-container" class="waveform-container">
    <!-- Plotly renders here -->
  </div>
</div>
```

### Signal Format Assumption
**[DEFERRED]** The frontend assumes `waveform_data.signals` is a 2D array: outer index = lead, inner index = time sample, values in millivolts (mV). If the backend returns a different shape (e.g. interleaved, transposed, or in raw ADC units), update the `renderWaveform` function's signal access pattern only. The Plotly trace configuration does not need to change.

---

## 8. Role-Based UI Logic

**Current status:** Single-role system confirmed. All authenticated users are treated as `clinician`.

The role hook is built now so access control can be layered in without structural changes later.

```js
// auth.js (addition)
export function getCurrentUserRole() {
  const user = getCurrentUser();
  return user?.role || 'clinician'; // Default to clinician if role absent
}

export function hasRole(requiredRole) {
  // Currently always returns true for single-role system
  // When roles are added: compare getCurrentUserRole() against requiredRole
  return true;
}
```

**When roles are introduced:**
1. Add role-based redirect in `requireAuth()` — e.g. admin-only pages redirect non-admins to dashboard
2. Conditionally render UI elements using `hasRole()` checks in page scripts
3. `hasRole()` is the single change point — no page scripts need restructuring

**Example pattern (ready for future use):**
```js
// In any page script — already wired, just needs hasRole() to return real values
if (!hasRole('admin')) {
  document.getElementById('admin-controls').style.display = 'none';
}
```

---

## 9. State & Data Management

### Philosophy
No framework. No global variables. A single `state.js` module owns all cross-component state. DOM updates happen via explicit subscriptions.

### state.js

```js
// state.js
const _state = {
  currentUser: null,
  currentPrediction: null,
  currentPatient: null,
  patientList: [],
  uploadMode: 'csv', // 'csv' | 'wfdb'
  isLoading: false,
  lastError: null,
};

const _listeners = {};

export function getState(key) {
  return _state[key];
}

export function setState(key, value) {
  _state[key] = value;
  if (_listeners[key]) {
    _listeners[key].forEach(fn => fn(value));
  }
}

export function subscribe(key, callback) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(callback);
}

export function unsubscribe(key, callback) {
  if (_listeners[key]) {
    _listeners[key] = _listeners[key].filter(fn => fn !== callback);
  }
}
```

### Cross-Page State Transfer
State does not persist across page navigations (MPA). Cross-page context is passed via:

1. **URL query params** (canonical): `patient_id`, `prediction_id`
2. **sessionStorage** (secondary): for larger objects that would clutter URLs

```js
// router.js — URL param utilities
export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

export function buildUrl(base, params) {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}
```

### Results Page Initialization Pattern
```js
// results.html init script
import { requireAuth } from './js/auth.js';
import { getQueryParam } from './js/router.js';
import { API } from './js/api-adapter.js';
import { setState } from './js/state.js';
import { renderWaveform } from './js/waveform.js';
import { showToast } from './js/components/toast.js';

requireAuth();

const predictionId = getQueryParam('prediction_id');
if (!predictionId) {
  window.location.href = '/dashboard.html';
}

(async () => {
  try {
    const prediction = await API.getPrediction(predictionId);
    setState('currentPrediction', prediction);

    // Render diagnosis
    document.getElementById('primary-label').textContent = prediction.diagnosis.primary_label;
    document.getElementById('confidence').textContent =
      `${(prediction.diagnosis.confidence * 100).toFixed(1)}%`;

    // Render secondary labels
    const secondaryContainer = document.getElementById('secondary-labels');
    prediction.diagnosis.secondary_labels.forEach(({ label, confidence }) => {
      const el = document.createElement('div');
      el.className = 'secondary-label';
      el.textContent = `${label} — ${(confidence * 100).toFixed(1)}%`;
      secondaryContainer.appendChild(el);
    });

    // Render waveform
    renderWaveform('waveform-container', prediction.waveform_data);

  } catch (err) {
    showToast('Failed to load prediction results.', 'error');
  }
})();
```

---

## 10. Error Handling & Loading States

### Error Categories

| Category | HTTP Status | User Message | Action |
|----------|------------|-------------|--------|
| Auth failure | 401 | "Session expired. Please log in again." | Redirect to login |
| Forbidden | 403 | "You do not have permission to view this." | Stay on page |
| Not found | 404 | "Record not found." | Stay on page |
| Timeout | 408 | "Request timed out. The server may still be processing." | Retry button |
| Validation | 422 | Server message (safe to display) | Stay on page |
| Server error | 500 | "A server error occurred. Please try again." | Retry button |
| Network error | — | "Unable to connect. Check your network connection." | Retry button |

### Global Error Handler
Add to every page — catches unhandled promise rejections:

```js
// In every page init script
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason;
  if (err?.status === 401) {
    window.location.href = '/login.html';
    return;
  }
  showToast(err?.message || 'An unexpected error occurred.', 'error');
});
```

### loader.js

```js
// components/loader.js
let loaderEl = null;

function ensureLoader() {
  if (!loaderEl) {
    loaderEl = document.createElement('div');
    loaderEl.id = 'global-loader';
    loaderEl.className = 'loader-overlay hidden';
    loaderEl.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <p class="loader-message" id="loader-message">Loading...</p>
      </div>
    `;
    document.body.appendChild(loaderEl);
  }
  return loaderEl;
}

export function showLoader(message = 'Loading...') {
  const el = ensureLoader();
  document.getElementById('loader-message').textContent = message;
  el.classList.remove('hidden');
}

export function hideLoader() {
  const el = ensureLoader();
  el.classList.add('hidden');
}
```

### toast.js

```js
// components/toast.js
export function showToast(message, type = 'info', duration = 5000) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}
```

---

## 11. Backend Compatibility Notes

### Java Servlet (Primary Backend)

| Concern | Frontend Requirement |
|---------|---------------------|
| Multipart form data | Do NOT set `Content-Type` header on upload requests. The browser sets `multipart/form-data; boundary=...` automatically when using `FormData`. Setting it manually will break the request. |
| CORS | Servlet must include `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers: Authorization, Content-Type`, `Access-Control-Allow-Methods: GET, POST, OPTIONS` and handle preflight `OPTIONS` requests with a 200 response. |
| Session timeout | If servlet has a default session/request timeout, it must be set above the ML inference SLA. Frontend timeout is set to 45s (`FETCH_TIMEOUT_MS`). |
| JSON responses | All responses must be `Content-Type: application/json`. Error responses must include a `message` field. |
| Auth header | Frontend sends `Authorization: Bearer <token>` on every authenticated request. |

### Python Microservice (ML Inference)

| Concern | Frontend Requirement |
|---------|---------------------|
| Direct vs proxied | **[DEFERRED]** If the Python microservice is called directly by the frontend, it needs its own CORS config and its own base URL in `config.js` (`ML_API_BASE_URL`). If it is proxied through the Java Servlet, the frontend only talks to the Servlet and Python is invisible to the frontend. Confirm with backend team. |
| Inference timeout | Python microservice must complete inference within the agreed SLA. If it cannot, the Servlet must return a 408 with a meaningful message. |
| Error passthrough | If Python microservice errors, the Servlet must propagate a meaningful JSON error response. The frontend cannot distinguish which backend caused a 500. |

### Recommended Backend Contract Checklist
Share this with the backend team:
- [ ] Confirm auth method (JWT vs session cookie) and token format
- [ ] Confirm all API endpoint paths and HTTP methods
- [ ] Confirm exact JSON response shapes for all endpoints
- [ ] Confirm error response shape: `{ "message": "string", "code": "string" }`
- [ ] Enable CORS on Java Servlet for frontend domain
- [ ] Enable CORS on Python microservice OR confirm it is proxied
- [ ] Confirm file size limits for CSV, DAT, HEA uploads
- [ ] Confirm maximum inference time SLA
- [ ] Confirm number of ECG leads the model accepts
- [ ] Confirm API base URLs for dev and production environments
- [ ] Confirm `waveform_data` signal array shape and units (mV assumed)

---

## 12. Build & Deployment

### Static File Serving
The frontend is a fully static bundle. It can be served directly by the Java Servlet (place files in `webapp/` or equivalent static resources directory) or by any HTTP server (nginx, Apache, etc.).

### No Build Step Required
No bundler, no transpiler, no package manager. The only build-time action is:
- **Vendoring Plotly.js:** Download `plotly.min.js` from https://cdn.plot.ly/plotly-2.x.x.min.js and place at `vendor/plotly.min.js`. Lock the version. Do not use the CDN at runtime.

### Environment Configuration
There is no `.env` file. Environment switching is done by editing `config.js`:

```js
// For production, change:
API_BASE_URL: 'https://ecg-triage.hospital.org/api',
ML_API_BASE_URL: 'https://ecg-triage.hospital.org/ml/api', // or remove if proxied
```

And in `api-adapter.js`:
```js
const USE_MOCK = false; // Switch to real API
```

### CORS Checklist for Backend Team
The following headers must be present on ALL API responses, including error responses:

```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

For preflight requests (`OPTIONS` method), the server must return `200 OK` with the above headers and an empty body.

⚠️ **Do not use `Access-Control-Allow-Origin: *` in production.** Wildcard CORS with a clinical application is a security risk. Use the specific frontend origin.

### Font Self-Hosting (If Intranet Deployment)
If the deployment environment is an air-gapped hospital intranet without internet access:
1. Download IBM Plex Sans and IBM Plex Mono from Google Fonts
2. Place in `assets/fonts/`
3. Replace the `@import` in `styles.css` with local `@font-face` declarations

---

## 13. Accepted Trade-offs & Deferred Decisions

| Item | Status | Frontend Assumption | Change Required When Resolved |
|------|--------|-------------------|-------------------------------|
| Auth method (JWT vs cookie) | DEFERRED | JWT in sessionStorage | If HttpOnly cookie: remove sessionStorage token logic in `auth.js`; cookies are sent automatically |
| Sync vs async prediction | CONFIRMED SYNC | Single response | If async: add polling loop in `upload.js`; results page unchanged |
| API response schema | DEFERRED | Mock schema in `mock-api.js` | Update `api.js` to match real schema; audit all field references in page scripts |
| CORS policy | DEFERRED | Mock bypasses CORS | Backend must add CORS headers before any real API call works |
| File size limits | DEFERRED | 10MB per file, 25MB total | Update `CONFIG.MAX_FILE_SIZE_BYTES` and `CONFIG.MAX_TOTAL_UPLOAD_BYTES` in `config.js` |
| API base URLs | DEFERRED | localhost:8080 / localhost:5000 | Update `CONFIG.API_BASE_URL` and `CONFIG.ML_API_BASE_URL` in `config.js` |
| ECG lead count | DEFERRED | 12 leads | Update `CONFIG.DEFAULT_LEAD_COUNT` and `CONFIG.LEAD_LABELS` in `config.js` |
| Python microservice routing | DEFERRED | Assumed proxied through Servlet | If direct: add CORS to microservice; add `ML_API_BASE_URL` calls in `api.js` |
| User roles | DEFERRED (single role) | All users are `clinician` | Add role logic to `auth.js` `hasRole()`; add role-based DOM conditionals in page scripts |
| Standalone CSV vs WFDB | CONFIRMED (both modes) | Two upload flows | N/A — implemented |

### ⚠️ sessionStorage XSS Risk
Acknowledged. sessionStorage JWT storage is readable by JavaScript and is vulnerable to XSS attacks. This is the accepted interim approach pending backend confirmation of HttpOnly cookie support. Do not store any patient data (ECG signals, diagnosis results, patient records) in sessionStorage — only the auth token and current user metadata.

---

## 14. Prioritized Build Order

Build in this exact order. Each step is independently testable before the next begins.

### Sprint 1 — Foundation (No Backend Required)
1. **`config.js`** — Define all constants. Nothing else can import correctly without this.
2. **`state.js`** — Pub/sub state module. No dependencies.
3. **`mock-api.js`** — Complete mock for all endpoints. Freeze it.
4. **`api-adapter.js`** — Switch between mock and real. Set `USE_MOCK = true`.
5. **`styles.css`** — Full design system: custom properties, reset, typography, layout, buttons, cards, forms, loader, toast.
6. **`components/nav.js`** — Shared navigation. Required by every page.
7. **`components/toast.js`** — Global notifications. Required by every page.
8. **`components/loader.js`** — Loading overlay. Required by upload flow.

### Sprint 2 — Auth & Shell Pages
9. **`auth.js`** — Token management, `requireAuth()`, login/logout.
10. **`login.html`** — Login form, auth flow, redirect on success. *(First testable page.)*
11. **`router.js`** — URL param utilities.
12. **`dashboard.html`** — Summary stats shell. Requires auth guard. Use mock data.
13. **`404.html`** — Static error page.

### Sprint 3 — Core Clinical Flow
14. **`upload.html` + `upload.js`** — Both upload modes, file validation, submit flow, loader states.
15. **`vendor/plotly.min.js`** — Download and vendor Plotly. Do not proceed to results page without this.
16. **`waveform.js`** — Plotly rendering, downsampling, fallback.
17. **`results.html`** — Prediction display, diagnosis labels, confidence scores, waveform. *(End-to-end clinical flow is testable after this step.)*

### Sprint 4 — Patient Management
18. **`components/patient-card.js`** — Reusable patient summary card.
19. **`patients.html` + `patients.js`** — Patient list, search, pagination.
20. **`patient.html`** — Individual patient record, prediction history, waveform replay.

### Sprint 5 — Backend Integration
21. **`api.js`** — Real fetch implementations, matching `mock-api.js` interface exactly.
22. **Set `USE_MOCK = false`** in `api-adapter.js`.
23. Audit every mock assumption against real API contract (response field names, error shapes, auth token format).
24. Confirm CORS is enabled on backend.
25. End-to-end test: login → upload → results → patient record.

---

*Blueprint generated against confirmed decisions and deferred assumptions as of project initiation. Every deferred item has an explicit change location documented. No further clarification is required to begin Sprint 1.*

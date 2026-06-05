# ECG Triage — Frontend Technical Blueprint
**Version:** 1.1.0 | **Status:** Active Development | **Stack:** HTML + Vanilla CSS + Vanilla JS
**Changelog v1.1.0:** Added Reports, Alerts, and Settings pages — full page spec, API endpoints, mock data, JS modules, DOM contracts, and build order integration.

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
| Alerts | `alerts.html` | `/alerts.html` | Flagged diagnostic predictions requiring review |
| Reports | `reports.html` | `/reports.html` | Prediction history export and summary statistics |
| Settings | `settings.html` | `/settings.html` | User preferences and application configuration |
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
├── alerts.html
├── reports.html
├── settings.html
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
│   ├── alerts.js               → alert list rendering, severity filter, dismiss/review actions
│   ├── reports.js              → report list, date filter, CSV export, summary stats
│   ├── settings.js             → preference reads/writes, form submit, reset to defaults
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

`nav.js` renders the nav HTML string and sets the active link based on `window.location.pathname`. The nav must include all nine authenticated pages: Dashboard, Upload, Results, Patients, Alerts, Reports, Settings. The Alerts nav item renders an unreviewed-count badge if `getAlerts()` returns `unreviewed_count > 0` — this count is fetched once on nav inject and is not polled.

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
/* 13. Alert Cards & Severity Badges */
/* 14. Reports Table & Export Controls */
/* 15. Settings Form & Section Groups */
/* 16. Toast Notifications */
/* 17. Modal */
/* 18. Loading States */
/* 19. Utility Classes */
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
| GET | `/alerts` | `getAlerts()` | Paginated list of flagged predictions requiring review |
| PATCH | `/alerts/:id/dismiss` | `dismissAlert()` | Mark alert as reviewed/dismissed |
| GET | `/reports` | `getReports()` | Paginated prediction history with optional date filter |
| GET | `/reports/summary` | `getReportsSummary()` | Aggregate stats: total predictions, diagnoses breakdown |
| GET | `/reports/:id/export` | `exportReport()` | Download single prediction report as CSV |
| GET | `/reports/export` | `exportReportsBulk()` | Download filtered prediction set as CSV |
| GET | `/settings` | `getSettings()` | Fetch current user's saved preferences |
| PUT | `/settings` | `saveSettings()` | Persist updated user preferences |

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

export async function getAlerts({ page = 1, limit = 20, severity = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (severity) params.set('severity', severity);
  return apiFetch(`${CONFIG.API_BASE_URL}/alerts?${params}`);
}

export async function dismissAlert(alertId) {
  return apiFetch(`${CONFIG.API_BASE_URL}/alerts/${alertId}/dismiss`, { method: 'PATCH' });
}

export async function getReports({ page = 1, limit = 20, from = '', to = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`${CONFIG.API_BASE_URL}/reports?${params}`);
}

export async function getReportsSummary() {
  return apiFetch(`${CONFIG.API_BASE_URL}/reports/summary`);
}

export async function exportReport(reportId) {
  // Returns a Blob — caller creates object URL for download
  const token = getAuthToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${CONFIG.API_BASE_URL}/reports/${reportId}/export`, { headers });
  if (!response.ok) throw { status: response.status, message: 'Export failed' };
  return response.blob();
}

export async function exportReportsBulk({ from = '', to = '' } = {}) {
  const token = getAuthToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const response = await fetch(`${CONFIG.API_BASE_URL}/reports/export?${params}`, { headers });
  if (!response.ok) throw { status: response.status, message: 'Bulk export failed' };
  return response.blob();
}

export async function getSettings() {
  return apiFetch(`${CONFIG.API_BASE_URL}/settings`);
}

export async function saveSettings(preferences) {
  return apiFetch(`${CONFIG.API_BASE_URL}/settings`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
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

// ─── Alerts ──────────────────────────────────────────────────────────────────

const MOCK_ALERTS = [
  {
    alert_id: 'alert_001',
    prediction_id: 'pred_001',
    patient_id: 'p_001',
    patient_name: 'Osama Elnaha',
    severity: 'critical',
    title: 'High-Confidence Atrial Fibrillation',
    diagnosis_label: 'Atrial Fibrillation',
    confidence: 0.97,
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    status: 'unreviewed',
  },
  {
    alert_id: 'alert_002',
    prediction_id: 'pred_002',
    patient_id: 'p_003',
    patient_name: 'Noura Hassan',
    severity: 'warning',
    title: 'Left Bundle Branch Block Detected',
    diagnosis_label: 'Left Bundle Branch Block',
    confidence: 0.82,
    timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
    status: 'unreviewed',
  },
  {
    alert_id: 'alert_003',
    prediction_id: 'pred_003',
    patient_id: 'p_005',
    patient_name: 'Ahmed Samir',
    severity: 'critical',
    title: 'ST Elevation — Possible STEMI',
    diagnosis_label: 'ST Elevation Myocardial Infarction',
    confidence: 0.94,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'unreviewed',
  },
  {
    alert_id: 'alert_004',
    prediction_id: 'pred_004',
    patient_id: 'p_002',
    patient_name: 'Sarah Ahmed',
    severity: 'warning',
    title: 'Premature Ventricular Contractions',
    diagnosis_label: 'Premature Ventricular Contractions',
    confidence: 0.78,
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    status: 'reviewed',
  },
];

export async function getAlerts({ page = 1, limit = 20, severity = '' } = {}) {
  await delay(500);
  const filtered = severity
    ? MOCK_ALERTS.filter(a => a.severity === severity)
    : MOCK_ALERTS;
  const start = (page - 1) * limit;
  return {
    alerts: filtered.slice(start, start + limit),
    total: filtered.length,
    unreviewed_count: filtered.filter(a => a.status === 'unreviewed').length,
    page,
    limit,
  };
}

export async function dismissAlert(alertId) {
  await delay(400);
  const alert = MOCK_ALERTS.find(a => a.alert_id === alertId);
  if (alert) alert.status = 'reviewed';
  return { success: true, alert_id: alertId };
}

// ─── Reports ─────────────────────────────────────────────────────────────────

const MOCK_REPORTS = Array.from({ length: 18 }, (_, i) => ({
  report_id: `rep_${String(i + 1).padStart(3, '0')}`,
  prediction_id: `pred_${String(i + 1).padStart(3, '0')}`,
  patient_id: `p_${String((i % 5) + 1).padStart(3, '0')}`,
  patient_name: ['Osama Elnaha', 'Sarah Ahmed', 'Noura Hassan', 'Ahmed Samir', 'Dr. Patient Five'][i % 5],
  diagnosis_label: ['Atrial Fibrillation', 'Normal Sinus Rhythm', 'Left Bundle Branch Block', 'ST Elevation', 'Premature Ventricular Contractions'][i % 5],
  confidence: parseFloat((0.75 + (i % 5) * 0.04).toFixed(2)),
  upload_format: i % 2 === 0 ? 'csv' : 'wfdb',
  created_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
}));

export async function getReports({ page = 1, limit = 20, from = '', to = '' } = {}) {
  await delay(500);
  let filtered = [...MOCK_REPORTS];
  if (from) filtered = filtered.filter(r => new Date(r.created_at) >= new Date(from));
  if (to)   filtered = filtered.filter(r => new Date(r.created_at) <= new Date(to));
  const start = (page - 1) * limit;
  return {
    reports: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

export async function getReportsSummary() {
  await delay(400);
  return {
    total_predictions: 18,
    predictions_today: 4,
    diagnosis_breakdown: [
      { label: 'Atrial Fibrillation',                   count: 5 },
      { label: 'Normal Sinus Rhythm',                   count: 4 },
      { label: 'Left Bundle Branch Block',              count: 4 },
      { label: 'ST Elevation Myocardial Infarction',    count: 3 },
      { label: 'Premature Ventricular Contractions',    count: 2 },
    ],
    avg_confidence: 0.88,
  };
}

export async function exportReport(reportId) {
  await delay(600);
  // Return a mock CSV blob
  const csv = `report_id,patient_id,diagnosis,confidence,created_at\n${reportId},p_001,Atrial Fibrillation,0.91,${new Date().toISOString()}`;
  return new Blob([csv], { type: 'text/csv' });
}

export async function exportReportsBulk({ from = '', to = '' } = {}) {
  await delay(800);
  const header = 'report_id,patient_id,diagnosis,confidence,created_at\n';
  const rows = MOCK_REPORTS
    .slice(0, 5)
    .map(r => `${r.report_id},${r.patient_id},${r.diagnosis_label},${r.confidence},${r.created_at}`)
    .join('\n');
  return new Blob([header + rows], { type: 'text/csv' });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const MOCK_SETTINGS = {
  display_name: 'Dr. Amaka Adeyemi',
  email_notifications: true,
  alert_threshold_confidence: 0.85,
  default_upload_format: 'csv',
  waveform_color: '#2ea043',
  timezone: 'Africa/Lagos',
  items_per_page: 20,
};

export async function getSettings() {
  await delay(300);
  return { ...MOCK_SETTINGS };
}

export async function saveSettings(preferences) {
  await delay(500);
  Object.assign(MOCK_SETTINGS, preferences);
  return { success: true, settings: { ...MOCK_SETTINGS } };
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

## 10A. Alerts Page Specification

### Purpose
Displays all ECG predictions that the model flagged with high-confidence abnormal diagnoses, requiring a clinician to review or dismiss. This is a clinical action surface — not cosmetic. Unreviewed critical alerts must be visually dominant.

### Source Mapping from React Code
The React `AlertsScreen` component provides the visual reference: left-bordered alert cards, severity color coding (red for critical, yellow for warning), a "Review" button that appears on hover, and a topbar filter row (All / Critical / Warning). These translate directly. The React code used hardcoded vital-sign data (heart rate, SpO₂) — the ECG Triage version replaces this with AI diagnosis data (label, confidence score, prediction ID).

### alerts.html — DOM Contract

```html
<!-- Required IDs — alerts.js depends on these exactly -->
<div id="nav-container"></div>
<div id="app-shell">
  <main id="alerts-main">

    <!-- Topbar filter -->
    <div id="alerts-filter-bar">
      <button id="filter-all"      class="filter-btn filter-btn--active">All</button>
      <button id="filter-critical" class="filter-btn">Critical</button>
      <button id="filter-warning"  class="filter-btn">Warning</button>
      <button id="filter-reviewed" class="filter-btn">Reviewed</button>
    </div>

    <!-- Unreviewed count badge -->
    <div id="unreviewed-count" class="alert-count-badge"></div>

    <!-- Alert list — alerts.js renders rows here -->
    <div id="alerts-list"></div>

    <!-- Empty state — shown when list is empty after filter -->
    <div id="alerts-empty" class="empty-state hidden">
      <p>No alerts match the current filter.</p>
    </div>

    <!-- Loading skeleton -->
    <div id="alerts-loading" class="skeleton-list">
      <div class="skeleton skeleton--card"></div>
      <div class="skeleton skeleton--card"></div>
    </div>

  </main>
</div>
```

### alerts.js — Full Module Specification

```js
// alerts.js
import { API } from './api-adapter.js';
import { requireAuth } from './auth.js';
import { showToast } from './components/toast.js';
import { buildUrl } from './router.js';

requireAuth();

let currentFilter = 'all'; // 'all' | 'critical' | 'warning' | 'reviewed'

// Severity → CSS modifier and label
const SEVERITY_CONFIG = {
  critical: { modifier: 'alert-card--critical', label: 'Critical', color: 'var(--color-danger)' },
  warning:  { modifier: 'alert-card--warning',  label: 'Warning',  color: 'var(--color-warning)' },
  reviewed: { modifier: 'alert-card--reviewed', label: 'Reviewed', color: 'var(--color-text-secondary)' },
};

function renderAlertCard(alert) {
  const cfg = SEVERITY_CONFIG[alert.status === 'reviewed' ? 'reviewed' : alert.severity] || SEVERITY_CONFIG.warning;
  const ts  = new Date(alert.timestamp);
  const age = formatRelativeTime(ts);

  const card = document.createElement('div');
  card.className = `alert-card ${cfg.modifier}`;
  card.dataset.alertId = alert.alert_id;
  card.innerHTML = `
    <div class="alert-card__severity-bar"></div>
    <div class="alert-card__body">
      <div class="alert-card__meta">
        <span class="alert-card__badge alert-card__badge--${alert.severity}">${cfg.label}</span>
        <span class="alert-card__time">${age}</span>
      </div>
      <h3 class="alert-card__title">${alert.title}</h3>
      <p class="alert-card__patient">${alert.patient_name}</p>
      <div class="alert-card__stats">
        <span class="alert-card__diagnosis">${alert.diagnosis_label}</span>
        <span class="alert-card__confidence">${(alert.confidence * 100).toFixed(0)}% confidence</span>
      </div>
    </div>
    <div class="alert-card__actions">
      <a href="${buildUrl('/results.html', { prediction_id: alert.prediction_id })}"
         class="btn btn--sm btn--ghost">View ECG</a>
      ${alert.status !== 'reviewed'
        ? `<button class="btn btn--sm btn--primary js-dismiss-alert"
                  data-alert-id="${alert.alert_id}">Mark Reviewed</button>`
        : `<span class="alert-card__reviewed-label">✓ Reviewed</span>`
      }
    </div>
  `;
  return card;
}

function formatRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const mins   = Math.floor(diffMs / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return date.toLocaleDateString();
}

async function loadAlerts() {
  const list     = document.getElementById('alerts-list');
  const loading  = document.getElementById('alerts-loading');
  const empty    = document.getElementById('alerts-empty');
  const countEl  = document.getElementById('unreviewed-count');

  list.innerHTML = '';
  loading.classList.remove('hidden');
  empty.classList.add('hidden');

  try {
    const severity = currentFilter === 'all' || currentFilter === 'reviewed' ? '' : currentFilter;
    const data = await API.getAlerts({ severity });

    loading.classList.add('hidden');

    // Apply reviewed filter client-side (mock and real API filter by severity only)
    let alerts = data.alerts;
    if (currentFilter === 'reviewed') {
      alerts = alerts.filter(a => a.status === 'reviewed');
    } else if (currentFilter !== 'all') {
      alerts = alerts.filter(a => a.status !== 'reviewed');
    }

    countEl.textContent = data.unreviewed_count > 0
      ? `${data.unreviewed_count} unreviewed`
      : '';

    if (alerts.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    alerts.forEach(alert => list.appendChild(renderAlertCard(alert)));

  } catch (err) {
    loading.classList.add('hidden');
    showToast(err?.message || 'Failed to load alerts.', 'error');
  }
}

async function handleDismiss(alertId) {
  try {
    await API.dismissAlert(alertId);
    showToast('Alert marked as reviewed.', 'success');
    await loadAlerts(); // Re-render list
  } catch (err) {
    showToast(err?.message || 'Failed to dismiss alert.', 'error');
  }
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    currentFilter = btn.id.replace('filter-', '');
    loadAlerts();
  });
});

// Dismiss via event delegation — one listener on the list container
document.getElementById('alerts-list').addEventListener('click', e => {
  const btn = e.target.closest('.js-dismiss-alert');
  if (btn) handleDismiss(btn.dataset.alertId);
});

// Initial load
loadAlerts();
```

### Alerts Page — Navigation Cross-Link
The "View ECG" button on each alert card links to `/results.html?prediction_id=<id>`. This reuses the existing results page — no new page needed for individual alert detail.

### Alerts Mock Data Shape
```json
{
  "alerts": [
    {
      "alert_id": "alert_001",
      "prediction_id": "pred_001",
      "patient_id": "p_001",
      "patient_name": "Osama Elnaha",
      "severity": "critical",
      "title": "High-Confidence Atrial Fibrillation",
      "diagnosis_label": "Atrial Fibrillation",
      "confidence": 0.97,
      "timestamp": "ISO8601",
      "status": "unreviewed | reviewed"
    }
  ],
  "total": 4,
  "unreviewed_count": 3,
  "page": 1,
  "limit": 20
}
```

### CSS Classes Required (add to styles.css Section 13)
```css
/* Alert Cards & Severity Badges */
.alert-card { ... }                        /* base card with left border slot */
.alert-card--critical { border-left: 3px solid var(--color-danger); }
.alert-card--warning  { border-left: 3px solid var(--color-warning); }
.alert-card--reviewed { border-left: 3px solid var(--color-border); opacity: 0.7; }
.alert-card__badge--critical { background: var(--color-danger); color: #fff; }
.alert-card__badge--warning  { background: var(--color-warning); color: #0d1117; }
.alert-count-badge { ... }                 /* "3 unreviewed" pill in topbar */
.filter-btn { ... }
.filter-btn--active { ... }
```

---

## 10B. Reports Page Specification

### Purpose
Provides a full history of ECG prediction records with date range filtering and CSV export. Also displays aggregate summary statistics (total predictions, diagnosis breakdown, average confidence). This is the primary audit and download surface for the application.

### Source Mapping from React Code
The React source has no Reports screen implementation — only a "Reports: 18" stat card on the dashboard. The page is designed fresh, consistent with the clinical dashboard aesthetic established across other pages.

### reports.html — DOM Contract

```html
<!-- Required IDs — reports.js depends on these exactly -->
<div id="nav-container"></div>
<div id="app-shell">
  <main id="reports-main">

    <!-- Summary stats bar -->
    <div id="reports-summary" class="reports-summary-bar">
      <div class="summary-stat">
        <span class="summary-stat__value" id="stat-total-predictions">—</span>
        <span class="summary-stat__label">Total Predictions</span>
      </div>
      <div class="summary-stat">
        <span class="summary-stat__value" id="stat-predictions-today">—</span>
        <span class="summary-stat__label">Today</span>
      </div>
      <div class="summary-stat">
        <span class="summary-stat__value" id="stat-avg-confidence">—</span>
        <span class="summary-stat__label">Avg Confidence</span>
      </div>
    </div>

    <!-- Filter & export controls -->
    <div id="reports-controls" class="reports-controls">
      <div class="reports-controls__filters">
        <label for="filter-from">From</label>
        <input type="date" id="filter-from" class="input input--sm">
        <label for="filter-to">To</label>
        <input type="date" id="filter-to" class="input input--sm">
        <button id="btn-apply-filter" class="btn btn--ghost btn--sm">Apply</button>
        <button id="btn-clear-filter" class="btn btn--ghost btn--sm">Clear</button>
      </div>
      <button id="btn-export-bulk" class="btn btn--primary btn--sm">
        Export CSV
      </button>
    </div>

    <!-- Reports table -->
    <div class="table-wrapper">
      <table id="reports-table" class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient</th>
            <th>Diagnosis</th>
            <th>Confidence</th>
            <th>Format</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="reports-tbody"></tbody>
      </table>
    </div>

    <!-- Loading skeleton -->
    <div id="reports-loading" class="skeleton-list hidden">
      <div class="skeleton skeleton--row"></div>
      <div class="skeleton skeleton--row"></div>
      <div class="skeleton skeleton--row"></div>
    </div>

    <!-- Empty state -->
    <div id="reports-empty" class="empty-state hidden">
      <p>No predictions found for the selected date range.</p>
    </div>

    <!-- Pagination -->
    <div id="reports-pagination" class="pagination"></div>

  </main>
</div>
```

### reports.js — Full Module Specification

```js
// reports.js
import { API } from './api-adapter.js';
import { requireAuth } from './auth.js';
import { showToast } from './components/toast.js';
import { buildUrl } from './router.js';
import { CONFIG } from './config.js';

requireAuth();

let currentPage  = 1;
let currentFrom  = '';
let currentTo    = '';

// ── Summary stats ──────────────────────────────────────────────────────────

async function loadSummary() {
  try {
    const data = await API.getReportsSummary();
    document.getElementById('stat-total-predictions').textContent = data.total_predictions;
    document.getElementById('stat-predictions-today').textContent = data.predictions_today;
    document.getElementById('stat-avg-confidence').textContent =
      `${(data.avg_confidence * 100).toFixed(0)}%`;
  } catch {
    // Non-critical — summary failure does not block table
  }
}

// ── Table rendering ─────────────────────────────────────────────────────────

function renderRow(report) {
  const date = new Date(report.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const confidencePct = `${(report.confidence * 100).toFixed(0)}%`;
  const confidenceClass = report.confidence >= 0.9 ? 'confidence--high'
    : report.confidence >= 0.75 ? 'confidence--medium'
    : 'confidence--low';

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${date}</td>
    <td>
      <a href="${buildUrl('/patient.html', { patient_id: report.patient_id })}"
         class="table-link">${report.patient_name}</a>
    </td>
    <td>${report.diagnosis_label}</td>
    <td><span class="confidence-badge ${confidenceClass}">${confidencePct}</span></td>
    <td><span class="format-tag">${report.upload_format.toUpperCase()}</span></td>
    <td class="table-actions">
      <a href="${buildUrl('/results.html', { prediction_id: report.prediction_id })}"
         class="btn btn--xs btn--ghost">View</a>
      <button class="btn btn--xs btn--ghost js-export-single"
              data-report-id="${report.report_id}"
              data-patient-name="${report.patient_name}">CSV</button>
    </td>
  `;
  return tr;
}

async function loadReports() {
  const tbody   = document.getElementById('reports-tbody');
  const loading = document.getElementById('reports-loading');
  const empty   = document.getElementById('reports-empty');

  tbody.innerHTML = '';
  loading.classList.remove('hidden');
  empty.classList.add('hidden');

  try {
    const data = await API.getReports({
      page: currentPage,
      limit: CONFIG.PATIENTS_PER_PAGE,
      from: currentFrom,
      to: currentTo,
    });

    loading.classList.add('hidden');

    if (data.reports.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    data.reports.forEach(r => tbody.appendChild(renderRow(r)));
    renderPagination(data.total, data.page, data.limit);

  } catch (err) {
    loading.classList.add('hidden');
    showToast(err?.message || 'Failed to load reports.', 'error');
  }
}

// ── Pagination ──────────────────────────────────────────────────────────────

function renderPagination(total, page, limit) {
  const container  = document.getElementById('reports-pagination');
  const totalPages = Math.ceil(total / limit);
  container.innerHTML = '';
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `pagination__btn${i === page ? ' pagination__btn--active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => { currentPage = i; loadReports(); });
    container.appendChild(btn);
  }
}

// ── Export ──────────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('btn-export-bulk').addEventListener('click', async () => {
  try {
    showToast('Preparing export…', 'info');
    const blob = await API.exportReportsBulk({ from: currentFrom, to: currentTo });
    downloadBlob(blob, `ecg-triage-reports-${Date.now()}.csv`);
  } catch (err) {
    showToast(err?.message || 'Export failed.', 'error');
  }
});

document.getElementById('reports-tbody').addEventListener('click', async e => {
  const btn = e.target.closest('.js-export-single');
  if (!btn) return;
  try {
    const blob = await API.exportReport(btn.dataset.reportId);
    downloadBlob(blob, `ecg-report-${btn.dataset.reportId}.csv`);
  } catch (err) {
    showToast('Export failed.', 'error');
  }
});

// ── Filter controls ─────────────────────────────────────────────────────────

document.getElementById('btn-apply-filter').addEventListener('click', () => {
  currentFrom = document.getElementById('filter-from').value;
  currentTo   = document.getElementById('filter-to').value;
  currentPage = 1;
  loadReports();
});

document.getElementById('btn-clear-filter').addEventListener('click', () => {
  currentFrom = '';
  currentTo   = '';
  currentPage = 1;
  document.getElementById('filter-from').value = '';
  document.getElementById('filter-to').value   = '';
  loadReports();
});

// ── Init ─────────────────────────────────────────────────────────────────────

loadSummary();
loadReports();
```

### Reports Mock Data Shape
```json
{
  "reports": [
    {
      "report_id": "rep_001",
      "prediction_id": "pred_001",
      "patient_id": "p_001",
      "patient_name": "Osama Elnaha",
      "diagnosis_label": "Atrial Fibrillation",
      "confidence": 0.91,
      "upload_format": "csv | wfdb",
      "created_at": "ISO8601"
    }
  ],
  "total": 18,
  "page": 1,
  "limit": 20
}
```

Summary endpoint shape:
```json
{
  "total_predictions": 18,
  "predictions_today": 4,
  "diagnosis_breakdown": [
    { "label": "Atrial Fibrillation", "count": 5 }
  ],
  "avg_confidence": 0.88
}
```

### CSS Classes Required (add to styles.css Section 14)
```css
/* Reports Table & Export Controls */
.reports-summary-bar { ... }               /* horizontal stat row */
.summary-stat { ... }
.reports-controls { ... }                  /* filter row + export button row */
.confidence-badge { ... }
.confidence--high   { color: var(--color-accent); }
.confidence--medium { color: var(--color-warning); }
.confidence--low    { color: var(--color-danger); }
.format-tag { ... }                        /* "CSV" / "WFDB" pill */
```

---

## 10C. Settings Page Specification

### Purpose
Allows the current user to configure application-level preferences: notification thresholds, default upload format, display preferences, and timezone. All settings persist to the backend via `PUT /settings` and are loaded fresh on page init via `GET /settings`. No settings are stored in sessionStorage — only the backend is the source of truth.

**⚠️ HIPAA Note:** The alert confidence threshold setting directly affects which predictions trigger clinical alerts. Lowering it carelessly could suppress notifications for genuinely abnormal findings. The UI must display a warning when the threshold is set below 0.80.

### Source Mapping from React Code
The React source has no Settings screen. The page is designed fresh. Visual reference: card-grouped form sections consistent with the patient details tab layout (bordered card, label/input rows, section headers in small-caps).

### settings.html — DOM Contract

```html
<!-- Required IDs — settings.js depends on these exactly -->
<div id="nav-container"></div>
<div id="app-shell">
  <main id="settings-main">

    <form id="settings-form" novalidate>

      <!-- Section: Profile -->
      <section class="settings-section" id="section-profile">
        <h2 class="settings-section__title">Profile</h2>
        <div class="settings-field">
          <label for="setting-display-name">Display Name</label>
          <input type="text" id="setting-display-name" class="input" maxlength="80">
        </div>
      </section>

      <!-- Section: Notifications -->
      <section class="settings-section" id="section-notifications">
        <h2 class="settings-section__title">Notifications</h2>
        <div class="settings-field settings-field--toggle">
          <label for="setting-email-notifications">Email Notifications</label>
          <input type="checkbox" id="setting-email-notifications" class="toggle-input" role="switch">
        </div>
        <div class="settings-field">
          <label for="setting-alert-threshold">
            Alert Confidence Threshold
            <span class="settings-field__hint">Predictions above this confidence trigger alerts</span>
          </label>
          <input type="number" id="setting-alert-threshold" class="input input--sm"
                 min="0.50" max="1.00" step="0.01">
          <!-- Warning injected here by settings.js when value < 0.80 -->
          <div id="threshold-warning" class="settings-field__warning hidden">
            ⚠ Setting below 0.80 may suppress clinically significant alert notifications.
          </div>
        </div>
      </section>

      <!-- Section: Upload Defaults -->
      <section class="settings-section" id="section-upload">
        <h2 class="settings-section__title">Upload Defaults</h2>
        <div class="settings-field">
          <label for="setting-default-format">Default Upload Format</label>
          <select id="setting-default-format" class="input input--select">
            <option value="csv">CSV</option>
            <option value="wfdb">DAT + HEA (WFDB)</option>
          </select>
        </div>
      </section>

      <!-- Section: Display -->
      <section class="settings-section" id="section-display">
        <h2 class="settings-section__title">Display</h2>
        <div class="settings-field">
          <label for="setting-timezone">Timezone</label>
          <select id="setting-timezone" class="input input--select" id="setting-timezone">
            <!-- Populated by settings.js from a static list -->
          </select>
        </div>
        <div class="settings-field">
          <label for="setting-items-per-page">Items per Page</label>
          <select id="setting-items-per-page" class="input input--select">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </section>

      <!-- Form actions -->
      <div class="settings-actions">
        <button type="submit" id="btn-save-settings" class="btn btn--primary">Save Changes</button>
        <button type="button" id="btn-reset-settings" class="btn btn--ghost">Reset to Defaults</button>
        <span id="settings-save-status" class="settings-save-status" aria-live="polite"></span>
      </div>

    </form>

  </main>
</div>
```

### settings.js — Full Module Specification

```js
// settings.js
import { API } from './api-adapter.js';
import { requireAuth } from './auth.js';
import { showToast } from './components/toast.js';

requireAuth();

const TIMEZONES = [
  'Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi',
  'Europe/London', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Kolkata',
  'UTC',
];

const DEFAULTS = {
  display_name: '',
  email_notifications: true,
  alert_threshold_confidence: 0.85,
  default_upload_format: 'csv',
  waveform_color: '#2ea043',
  timezone: 'Africa/Lagos',
  items_per_page: 20,
};

// ── DOM refs ─────────────────────────────────────────────────────────────────

const form             = document.getElementById('settings-form');
const displayNameEl    = document.getElementById('setting-display-name');
const emailNotifEl     = document.getElementById('setting-email-notifications');
const thresholdEl      = document.getElementById('setting-alert-threshold');
const thresholdWarnEl  = document.getElementById('threshold-warning');
const formatEl         = document.getElementById('setting-default-format');
const timezoneEl       = document.getElementById('setting-timezone');
const itemsPerPageEl   = document.getElementById('setting-items-per-page');
const saveStatusEl     = document.getElementById('settings-save-status');

// ── Populate timezone dropdown ───────────────────────────────────────────────

TIMEZONES.forEach(tz => {
  const opt = document.createElement('option');
  opt.value = tz;
  opt.textContent = tz;
  timezoneEl.appendChild(opt);
});

// ── Load settings from API ───────────────────────────────────────────────────

async function loadSettings() {
  try {
    const s = await API.getSettings();
    displayNameEl.value        = s.display_name   || '';
    emailNotifEl.checked       = s.email_notifications ?? true;
    thresholdEl.value          = s.alert_threshold_confidence ?? 0.85;
    formatEl.value             = s.default_upload_format || 'csv';
    timezoneEl.value           = s.timezone || 'Africa/Lagos';
    itemsPerPageEl.value       = String(s.items_per_page || 20);
    checkThresholdWarning(parseFloat(thresholdEl.value));
  } catch (err) {
    showToast('Failed to load settings. Showing defaults.', 'error');
  }
}

// ── Threshold safety warning ─────────────────────────────────────────────────

function checkThresholdWarning(value) {
  if (value < 0.80) {
    thresholdWarnEl.classList.remove('hidden');
  } else {
    thresholdWarnEl.classList.add('hidden');
  }
}

thresholdEl.addEventListener('input', () => {
  checkThresholdWarning(parseFloat(thresholdEl.value));
});

// ── Save ─────────────────────────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const preferences = {
    display_name:                 displayNameEl.value.trim(),
    email_notifications:          emailNotifEl.checked,
    alert_threshold_confidence:   parseFloat(thresholdEl.value),
    default_upload_format:        formatEl.value,
    timezone:                     timezoneEl.value,
    items_per_page:               parseInt(itemsPerPageEl.value, 10),
  };

  // Client-side validation
  if (preferences.alert_threshold_confidence < 0.50 ||
      preferences.alert_threshold_confidence > 1.00) {
    showToast('Confidence threshold must be between 0.50 and 1.00.', 'error');
    return;
  }

  const btn = document.getElementById('btn-save-settings');
  btn.disabled = true;
  saveStatusEl.textContent = 'Saving…';

  try {
    await API.saveSettings(preferences);
    saveStatusEl.textContent = '✓ Saved';
    showToast('Settings saved.', 'success');
    setTimeout(() => { saveStatusEl.textContent = ''; }, 3000);
  } catch (err) {
    saveStatusEl.textContent = '';
    showToast(err?.message || 'Failed to save settings.', 'error');
  } finally {
    btn.disabled = false;
  }
});

// ── Reset to defaults ────────────────────────────────────────────────────────

document.getElementById('btn-reset-settings').addEventListener('click', async () => {
  if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
  try {
    await API.saveSettings(DEFAULTS);
    await loadSettings(); // Re-populate form with defaults
    showToast('Settings reset to defaults.', 'success');
  } catch (err) {
    showToast('Reset failed.', 'error');
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

loadSettings();
```

### Settings Mock Data Shape
```json
{
  "display_name": "Dr. Amaka Adeyemi",
  "email_notifications": true,
  "alert_threshold_confidence": 0.85,
  "default_upload_format": "csv",
  "waveform_color": "#2ea043",
  "timezone": "Africa/Lagos",
  "items_per_page": 20
}
```

### CSS Classes Required (add to styles.css Section 15)
```css
/* Settings Form & Section Groups */
.settings-section { ... }                    /* bordered card per section */
.settings-section__title { ... }             /* small-caps section header */
.settings-field { ... }                      /* label + input row */
.settings-field--toggle { ... }              /* label + checkbox toggle row */
.settings-field__hint { ... }                /* secondary help text under label */
.settings-field__warning { ... }             /* inline warning — red text + icon */
.settings-actions { ... }                    /* save/reset button row */
.settings-save-status { ... }                /* inline "✓ Saved" feedback */
.toggle-input { ... }                        /* styled checkbox as pill toggle */
```

---

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
| Alerts schema | DEFERRED | Mock schema in `mock-api.js` | Update `api.js`; audit `alert_id`, `severity`, `status` field names |
| Reports export format | DEFERRED | CSV blob assumed | If backend returns a signed URL instead of a blob, update `exportReport()` and `exportReportsBulk()` in `api.js` to fetch the URL |
| Settings schema | DEFERRED | Mock schema in `mock-api.js` | Update `api.js`; confirm all preference field names match backend |
| Alert threshold backend enforcement | DEFERRED | Frontend validates 0.50–1.00 range | Confirm backend also enforces range; if validation differs, update `settings.js` min/max |

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

### Sprint 5 — Alerts, Reports, Settings
21. **`alerts.html` + `alerts.js`** — Alert list, severity filter, dismiss action, "View ECG" cross-link to results.html.
22. **`reports.html` + `reports.js`** — Prediction history table, date filter, summary stats bar, single and bulk CSV export.
23. **`settings.html` + `settings.js`** — Preferences form, threshold safety warning, save/reset flow.
24. **Update `nav.js`** — Add Alerts, Reports, Settings links; add unreviewed-count badge on Alerts nav item.

### Sprint 6 — Backend Integration
25. **`api.js`** — Real fetch implementations for all endpoints, matching `mock-api.js` interface exactly.
26. **Set `USE_MOCK = false`** in `api-adapter.js`.
27. Audit every mock assumption against real API contract (response field names, error shapes, auth token format, export blob vs URL).
28. Confirm CORS is enabled on backend for all new endpoints.
29. End-to-end test: login → upload → results → patient record → alerts → dismiss → reports → export → settings → save.

---

*Blueprint v1.1.0 — updated to include Alerts, Reports, and Settings pages. All deferred items have explicit change locations documented. No further clarification is required to begin Sprint 1.*

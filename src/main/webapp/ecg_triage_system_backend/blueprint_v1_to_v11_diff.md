# Blueprint v1 → v1.1.0 Change Log
**Compared:** `frontend_blueprint.md` (v1.0) vs `frontend_blueprint_v2.md` (v1.1.0)

---

## Summary

| Area | Nature of Change |
|---|---|
| Version / Changelog | Header updated; changelog entry added |
| Section 2 — Page Map | 3 new page rows added |
| Section 3 — File Structure | 3 new HTML files, 3 new JS modules, CSS section numbers renumbered |
| Section 3 — nav.js description | Updated to cover all 9 pages + Alerts badge |
| Section 3 — CSS Architecture | Sections 13–15 added (Alerts, Reports, Settings); old 13–17 shifted to 16–19 |
| Section 4 — Endpoint Registry | 8 new endpoints added |
| Section 4 — api.js | 8 new exported functions added |
| Section 4 — mock-api.js | New `MOCK_ALERTS`, `MOCK_REPORTS`, `MOCK_SETTINGS` data + 8 new mock functions |
| Sections 10A / 10B / 10C | **3 entirely new sections** inserted (Alerts, Reports, Settings page specs) |
| Section 11 | Section header line removed (now starts inline after 10C) |
| Section 13 — Deferred Decisions | 4 new deferred-decision rows added |
| Section 14 — Build Order | Sprint 5 replaced/expanded; Sprint 6 is renamed + extended |

---

## Detailed Changes

---

### Document Header

| | v1.0 | v1.1.0 |
|---|---|---|
| Version line | *(absent)* | `**Version:** 1.1.0 \| **Status:** Active Development \| **Stack:** HTML + Vanilla CSS + Vanilla JS` |
| Changelog line | *(absent)* | `**Changelog v1.1.0:** Added Reports, Alerts, and Settings pages — full page spec, API endpoints, mock data, JS modules, DOM contracts, and build order integration.` |

---

### Section 2 — Page Map

Three rows **added** to the Page Inventory table:

| Page | File | Route | Description |
|---|---|---|---|
| Alerts | `alerts.html` | `/alerts.html` | Flagged diagnostic predictions requiring review |
| Reports | `reports.html` | `/reports.html` | Prediction history export and summary statistics |
| Settings | `settings.html` | `/settings.html` | User preferences and application configuration |

The 404 row was already present and is unchanged.

---

### Section 3 — Component & File Structure

**New HTML files** in root listing:
```diff
+ ├── alerts.html
+ ├── reports.html
+ ├── settings.html
```

**New JS modules** in `js/`:
```diff
+ │   ├── alerts.js               → alert list rendering, severity filter, dismiss/review actions
+ │   ├── reports.js              → report list, date filter, CSV export, summary stats
+ │   ├── settings.js             → preference reads/writes, form submit, reset to defaults
```

---

### Section 3 — nav.js Description (inline prose)

| v1.0 | v1.1.0 |
|---|---|
| "The nav must include all six authenticated pages: Dashboard, Upload, Results, Patients." *(paraphrased)* | "The nav must include **all nine** authenticated pages: Dashboard, Upload, Results, Patients, **Alerts, Reports, Settings**. The Alerts nav item renders an **unreviewed-count badge** if `getAlerts()` returns `unreviewed_count > 0` — this count is fetched once on nav inject and is not polled." |

---

### Section 3 — CSS Architecture Comment Block

Three new sections **inserted**; numbering of subsequent sections **shifted**:

```diff
+ /* 13. Alert Cards & Severity Badges */
+ /* 14. Reports Table & Export Controls */
+ /* 15. Settings Form & Section Groups */
- /* 13. Results / Diagnosis Display */   → now /* 16. ... */  (renamed + renumbered)
- /* 14. Toast Notifications */           → now /* 16. Toast Notifications */
- /* 15. Modal */                         → now /* 17. Modal */
- /* 16. Loading States */                → now /* 18. Loading States */
- /* 17. Utility Classes */               → now /* 19. Utility Classes */
```

*(The existing section numbers in the implemented `styles.css` are unaffected; this is only the architecture comment in the blueprint.)*

---

### Section 4 — Endpoint Registry

Eight new rows **appended** to the table:

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| GET | `/alerts` | `getAlerts()` | Paginated list of flagged predictions requiring review |
| PATCH | `/alerts/:id/dismiss` | `dismissAlert()` | Mark alert as reviewed/dismissed |
| GET | `/reports` | `getReports()` | Paginated prediction history with optional date filter |
| GET | `/reports/summary` | `getReportsSummary()` | Aggregate stats: total predictions, diagnoses breakdown |
| GET | `/reports/:id/export` | `exportReport()` | Download single prediction report as CSV |
| GET | `/reports/export` | `exportReportsBulk()` | Download filtered prediction set as CSV |
| GET | `/settings` | `getSettings()` | Fetch current user's saved preferences |
| PUT | `/settings` | `saveSettings()` | Persist updated user preferences |

---

### Section 4 — api.js

Eight new exported functions **appended** after `getPatientPredictions()`:

```js
// New in v1.1.0
export async function getAlerts({ page, limit, severity } = {}) { ... }
export async function dismissAlert(alertId) { ... }            // PATCH
export async function getReports({ page, limit, from, to } = {}) { ... }
export async function getReportsSummary() { ... }
export async function exportReport(reportId) { ... }           // returns Blob
export async function exportReportsBulk({ from, to } = {}) { ... }  // returns Blob
export async function getSettings() { ... }
export async function saveSettings(preferences) { ... }        // PUT
```

> **Note on Blob functions:** `exportReport` and `exportReportsBulk` do **not** use the shared `apiFetch` wrapper because they return a raw `Blob` (for `<a download>` triggers), not JSON. They construct their own fetch call with the auth header only.

---

### Section 4 — mock-api.js

Three new mock data constants and eight new exported mock functions **added** after `getPatientPredictions()`:

#### New mock data

**`MOCK_ALERTS`** — array of 4 alerts:

| alert_id | patient_name | severity | title | confidence | status |
|---|---|---|---|---|---|
| alert_001 | Osama Elnaha | critical | High-Confidence Atrial Fibrillation | 0.97 | unreviewed |
| alert_002 | Noura Hassan | warning | Left Bundle Branch Block Detected | 0.82 | unreviewed |
| alert_003 | Ahmed Samir | critical | ST Elevation — Possible STEMI | 0.94 | unreviewed |
| alert_004 | Sarah Ahmed | warning | Premature Ventricular Contractions | 0.78 | **reviewed** |

**`MOCK_REPORTS`** — array of 18 reports, generated via `Array.from({ length: 18 }, ...)` cycling through 5 patients and 5 diagnosis labels with alternating CSV/WFDB format.

**`MOCK_SETTINGS`** — single object:
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

#### New mock functions

| Function | Delay | Behaviour |
|---|---|---|
| `getAlerts({ page, limit, severity })` | 500 ms | Filters `MOCK_ALERTS` by severity if provided; returns `alerts[]`, `total`, `unreviewed_count`, `page`, `limit` |
| `dismissAlert(alertId)` | 400 ms | Mutates `MOCK_ALERTS` in-place (`status = 'reviewed'`); returns `{ success, alert_id }` |
| `getReports({ page, limit, from, to })` | 500 ms | Date-range filters `MOCK_REPORTS`; returns `reports[]`, `total`, `page`, `limit` |
| `getReportsSummary()` | 400 ms | Returns hardcoded aggregate stats object |
| `exportReport(reportId)` | 600 ms | Returns a `Blob` of mock CSV text |
| `exportReportsBulk({ from, to })` | 800 ms | Returns a `Blob` of first 5 mock reports as CSV |
| `getSettings()` | 300 ms | Returns a shallow copy of `MOCK_SETTINGS` |
| `saveSettings(preferences)` | 500 ms | Merges `preferences` into `MOCK_SETTINGS`; returns `{ success, settings }` |

---

### Sections 10A, 10B, 10C — New Page Specifications *(entirely new)*

Three complete page specs inserted between the end of Section 10 (Error Handling) and what was previously Section 11 (Backend Compatibility Notes).

---

#### 10A — Alerts Page

**Purpose:** Clinical action surface for high-confidence abnormal predictions. Unreviewed critical alerts must be visually dominant.

**React source mapping:** React `AlertsScreen` → left-bordered alert cards, severity colour coding, topbar filter, "Review" button. Patient vital-sign data replaced with AI diagnosis data.

**DOM Contract — required IDs:**

| ID | Element | Role |
|---|---|---|
| `alerts-filter-bar` | `<div>` | Container for filter buttons |
| `filter-all` | `<button>` | Initially `.filter-btn--active` |
| `filter-critical` | `<button>` | Filter to critical only |
| `filter-warning` | `<button>` | Filter to warning only |
| `filter-reviewed` | `<button>` | Filter to reviewed only |
| `unreviewed-count` | `<div>` | Unreviewed count badge text |
| `alerts-list` | `<div>` | Alert card render target |
| `alerts-empty` | `<div>` | Empty state (hidden by default) |
| `alerts-loading` | `<div>` | Skeleton loading state |

**alerts.js key behaviours:**
- `SEVERITY_CONFIG` maps severity → CSS modifier + label + colour variable
- `renderAlertCard(alert)` builds a card DOM element with left severity bar, title, patient name, diagnosis label, confidence, relative timestamp, "View ECG" link, and conditional "Mark Reviewed" button
- `formatRelativeTime(date)` → "Just now" / "N min ago" / "Nh ago" / date string
- `loadAlerts()` calls `API.getAlerts({ severity })` then applies client-side `reviewed` filter
- `handleDismiss(alertId)` calls `API.dismissAlert()` then reloads list
- Filter buttons use event listeners on `.filter-btn` class; dismiss uses event delegation on `#alerts-list`
- "View ECG" links to `/results.html?prediction_id=<id>` (reuses results page — no new detail page needed)

**Alert response shape:**
```json
{ "alerts": [...], "total": 4, "unreviewed_count": 3, "page": 1, "limit": 20 }
```

**New CSS classes (styles.css Section 13):**
`.alert-card`, `.alert-card--critical`, `.alert-card--warning`, `.alert-card--reviewed`, `.alert-card__badge--critical`, `.alert-card__badge--warning`, `.alert-count-badge`, `.filter-btn`, `.filter-btn--active`

---

#### 10B — Reports Page

**Purpose:** Full history of ECG predictions with date range filtering and CSV export (single + bulk). Also shows aggregate summary stats.

**React source mapping:** No React Reports screen exists — only a "Reports: 18" stat card on the dashboard. Page designed fresh.

**DOM Contract — required IDs:**

| ID | Element | Role |
|---|---|---|
| `stat-total-predictions` | `<span>` | Summary stat value |
| `stat-predictions-today` | `<span>` | Summary stat value |
| `stat-avg-confidence` | `<span>` | Summary stat value |
| `filter-from` | `<input type="date">` | Date range start |
| `filter-to` | `<input type="date">` | Date range end |
| `btn-apply-filter` | `<button>` | Apply date filter |
| `btn-clear-filter` | `<button>` | Clear date filter |
| `btn-export-bulk` | `<button>` | Bulk CSV export |
| `reports-table` | `<table>` | Data table |
| `reports-tbody` | `<tbody>` | Row render target |
| `reports-loading` | `<div>` | Skeleton state |
| `reports-empty` | `<div>` | Empty state |
| `reports-pagination` | `<div>` | Pagination controls |

**Table columns:** Date · Patient (link to patient.html) · Diagnosis · Confidence · Format · Actions (View + CSV)

**reports.js key behaviours:**
- `loadSummary()` fetches `getReportsSummary()` and populates the 3 stat spans (non-blocking — failure doesn't block table)
- `renderRow(report)` builds a `<tr>` with confidence colour class (`confidence--high/medium/low`)
- `renderPagination(total, page, limit)` renders numbered page buttons
- `downloadBlob(blob, filename)` creates an `<a download>` object URL, clicks it, and revokes the URL
- Bulk export fires on `#btn-export-bulk` click; single export fires via event delegation on `#reports-tbody` targeting `.js-export-single`
- Filter apply/clear are separate button listeners (no debounce — explicit Apply button)
- `loadSummary()` and `loadReports()` both called on init

**Report response shape:**
```json
{ "reports": [...], "total": 18, "page": 1, "limit": 20 }
```
**Summary shape:**
```json
{ "total_predictions": 18, "predictions_today": 4, "diagnosis_breakdown": [...], "avg_confidence": 0.88 }
```

**New CSS classes (styles.css Section 14):**
`.reports-summary-bar`, `.summary-stat`, `.reports-controls`, `.confidence-badge`, `.confidence--high`, `.confidence--medium`, `.confidence--low`, `.format-tag`

---

#### 10C — Settings Page

**Purpose:** User preferences that persist to the backend. Source of truth is the backend only — no sessionStorage caching.

> ⚠️ **HIPAA Note (new):** Alert confidence threshold directly affects clinical alert generation. The UI must display a warning when the threshold is set below 0.80.

**React source mapping:** No React Settings screen. Designed fresh using patient-details card aesthetic.

**DOM Contract — required IDs:**

| ID | Element | Role |
|---|---|---|
| `settings-form` | `<form novalidate>` | Parent form |
| `section-profile` | `<section>` | Profile card |
| `setting-display-name` | `<input type="text">` | Display name |
| `section-notifications` | `<section>` | Notifications card |
| `setting-email-notifications` | `<input type="checkbox" role="switch">` | Email toggle |
| `setting-alert-threshold` | `<input type="number" min="0.50" max="1.00" step="0.01">` | Alert confidence threshold |
| `threshold-warning` | `<div>` | Inline HIPAA warning (hidden until value < 0.80) |
| `section-upload` | `<section>` | Upload defaults card |
| `setting-default-format` | `<select>` | csv / wfdb default |
| `section-display` | `<section>` | Display prefs card |
| `setting-timezone` | `<select>` | Timezone (populated by JS) |
| `setting-items-per-page` | `<select>` | 10 / 20 / 50 options |
| `btn-save-settings` | `<button type="submit">` | Save changes |
| `btn-reset-settings` | `<button type="button">` | Reset to defaults |
| `settings-save-status` | `<span aria-live="polite">` | Inline "✓ Saved" / "Saving…" feedback |

**settings.js key behaviours:**
- `TIMEZONES` constant array (11 entries: Africa/Lagos, Europe/London, UTC, etc.)
- `DEFAULTS` constant mirrors `MOCK_SETTINGS` shape — used for reset flow
- Timezone `<select>` populated programmatically from `TIMEZONES`
- `loadSettings()` — `GET /settings` → populates all form fields; calls `checkThresholdWarning()` on load
- `checkThresholdWarning(value)` — shows/hides `#threshold-warning` based on `value < 0.80`
- `thresholdEl` `input` event → `checkThresholdWarning` (real-time inline feedback)
- Form `submit` handler: builds `preferences` object, validates threshold in `[0.50, 1.00]`, disables button, calls `API.saveSettings()`, shows "✓ Saved" for 3 s
- Reset button: `confirm()` dialog → `API.saveSettings(DEFAULTS)` → `loadSettings()` to repopulate

**Settings mock data shape:**
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

**New CSS classes (styles.css Section 15):**
`.settings-section`, `.settings-section__title`, `.settings-field`, `.settings-field--toggle`, `.settings-field__hint`, `.settings-field__warning`, `.settings-actions`, `.settings-save-status`, `.toggle-input`

---

### Section 13 — Accepted Trade-offs & Deferred Decisions

Four new rows **appended** to the deferred-decisions table:

| Item | Status | Frontend Assumption | Change Required When Resolved |
|---|---|---|---|
| Alerts schema | DEFERRED | Mock schema in `mock-api.js` | Update `api.js`; audit `alert_id`, `severity`, `status` field names |
| Reports export format | DEFERRED | CSV blob assumed | If backend returns signed URL instead of blob, update `exportReport()` and `exportReportsBulk()` in `api.js` |
| Settings schema | DEFERRED | Mock schema in `mock-api.js` | Update `api.js`; confirm all preference field names match backend |
| Alert threshold backend enforcement | DEFERRED | Frontend validates 0.50–1.00 range | Confirm backend also enforces range; if validation differs, update `settings.js` min/max |

---

### Section 14 — Prioritized Build Order

#### Sprint 5 — **New** (was not present in v1.0)

```
Sprint 5 — Alerts, Reports, Settings
21. alerts.html + alerts.js   — Alert list, severity filter, dismiss action, cross-link to results.html
22. reports.html + reports.js — Prediction history table, date filter, summary stats bar, single and bulk CSV export
23. settings.html + settings.js — Preferences form, threshold safety warning, save/reset flow
24. Update nav.js             — Add Alerts, Reports, Settings links; add unreviewed-count badge on Alerts item
```

#### Sprint 5 → Sprint 6 rename (Backend Integration)

| v1.0 Sprint 5 | v1.1.0 Sprint 6 |
|---|---|
| Step 21: `api.js` real implementation | Step 25: `api.js` real implementation for **all endpoints** (expanded scope) |
| Step 22: Set `USE_MOCK = false` | Step 26: unchanged |
| Step 23: Audit mock assumptions | Step 27: Same + adds "export blob vs URL" to audit list |
| Step 24: Confirm CORS | Step 28: Same + "all **new** endpoints" explicitly called out |
| Step 25: End-to-end test | Step 29: **Extended test path**: login → upload → results → patient record → **alerts → dismiss → reports → export → settings → save** |

---

## What Did NOT Change

Everything below is **identical** between v1.0 and v1.1.0:

- Section 1 — Frontend Overview & Goals
- Section 5 — Auth Flow & Route Protection (`auth.js`, route protection pattern, HIPAA note)
- Section 6 — ECG Upload & Prediction Flow (`upload.js`, state machine, flow diagram)
- Section 7 — Waveform Rendering Specification (`waveform.js`, Plotly setup)
- Section 8 — Role-Based UI Logic
- Section 9 — State & Data Management (`state.js`, `router.js`, cross-page state pattern)
- Section 10 — Error Handling & Loading States (categories table, `loader.js`, `toast.js`)
- Section 11 — Backend Compatibility Notes (all content identical)
- Section 12 — Build & Deployment
- Sprints 1–4 in Section 14 (steps 1–20 completely unchanged)
- `config.js` — unchanged
- `api-adapter.js` — unchanged
- The 9 original API functions in `api.js` — unchanged
- The 9 original mock functions in `mock-api.js` — unchanged
- `MOCK_PREDICTION`, `MOCK_USER`, `MOCK_TOKEN`, `MOCK_PATIENTS` — unchanged

---

## Sprint Plan for v1.1.0 Changes

> All code changes introduced in v1.1.0 land in a single new sprint — **Sprint 5**.
> **Sprint 6 (Backend Integration)** already existed in v1.0; v1.1.0 only expands its scope (more endpoints to wire, longer E2E test path). No new sprint is required for that.

---

### Sprint 5 — Alerts, Reports & Settings

**Prerequisite:** Sprint 4 fully complete and passing (`patients.html`, `patient.html`, `patient-card.js`, `patients.js`).

**Goal:** Deliver the three remaining feature pages (Alerts, Reports, Settings) and update shared navigation so all nine authenticated pages are linked, with the Alerts badge showing the live unreviewed count.

---

#### Step 1 — `js/mock-api.js` — New mock data & 8 functions

The mock layer must be extended **before** any page code is written so every step can use realistic data immediately.

- [ ] Add `MOCK_ALERTS` constant (4 alerts: `alert_001` critical/unreviewed, `alert_002` warning/unreviewed, `alert_003` critical/unreviewed, `alert_004` warning/**reviewed**)
- [ ] Add `MOCK_REPORTS` constant (18 reports via `Array.from({ length: 18 })`, cycling 5 patients × 5 diagnoses, alternating CSV/WFDB format)
- [ ] Add `MOCK_SETTINGS` constant (7-field object: `display_name`, `email_notifications`, `alert_threshold_confidence: 0.85`, `default_upload_format`, `waveform_color`, `timezone`, `items_per_page`)
- [ ] Add `getAlerts({ page, limit, severity })` — filter by severity; return `alerts[]`, `total`, `unreviewed_count`, `page`, `limit`
- [ ] Add `dismissAlert(alertId)` — mutate matching entry's `status` to `'reviewed'` in-place; return `{ success, alert_id }`
- [ ] Add `getReports({ page, limit, from, to })` — date-range filter; return `reports[]`, `total`, `page`, `limit`
- [ ] Add `getReportsSummary()` — return hardcoded aggregate stats (`total_predictions: 18`, `predictions_today: 4`, `avg_confidence: 0.88`)
- [ ] Add `exportReport(reportId)` — return `new Blob([csv], { type: 'text/csv' })` with single mock row
- [ ] Add `exportReportsBulk({ from, to })` — return `Blob` for first 5 `MOCK_REPORTS` rows
- [ ] Add `getSettings()` — return shallow copy of `MOCK_SETTINGS`
- [ ] Add `saveSettings(preferences)` — `Object.assign(MOCK_SETTINGS, preferences)`; return `{ success, settings }`

**Verification:** All 17 named exports visible when inspecting the module in browser devtools.

---

#### Step 2 — `css/styles.css` — Three new CSS sections

Append sections 13, 14, 15 after the existing Sprint 4 block. Do **not** renumber already-implemented sections.

**Section 13 — Alert Cards & Severity Badges**

- [ ] `.alert-card` — base card, flex layout, left border slot, border-radius, margin-bottom
- [ ] `.alert-card--critical` — `border-left: 3px solid var(--color-danger)`
- [ ] `.alert-card--warning` — `border-left: 3px solid var(--color-warning)`
- [ ] `.alert-card--reviewed` — `border-left: 3px solid var(--color-border); opacity: 0.7`
- [ ] `.alert-card__severity-bar`, `__body`, `__meta`, `__title`, `__patient`, `__stats`, `__diagnosis`, `__confidence`, `__actions`, `__reviewed-label`
- [ ] `.alert-card__badge--critical` — `background: var(--color-danger); color: #fff`
- [ ] `.alert-card__badge--warning` — `background: var(--color-warning); color: #0d1117`
- [ ] `.alert-count-badge` — unreviewed count pill (topbar/header)
- [ ] `.filter-btn` — pill-style toggle; `.filter-btn--active` — accent highlight

**Section 14 — Reports Table & Export Controls**

- [ ] `.reports-summary-bar` — flex row, gap, border-bottom, padding-bottom
- [ ] `.summary-stat` — stat block; `.summary-stat__value` large mono; `.summary-stat__label` small uppercase
- [ ] `.reports-controls` — flex row for filters + export button
- [ ] `.confidence-badge` — pill for confidence %; `.confidence--high` accent; `.confidence--medium` warning; `.confidence--low` danger
- [ ] `.format-tag` — "CSV" / "WFDB" pill badge

**Section 15 — Settings Form & Section Groups**

- [ ] `.settings-section` — bordered card per section
- [ ] `.settings-section__title` — small-caps header
- [ ] `.settings-field` — label + input row with border-bottom separator; `:last-child` removes border
- [ ] `.settings-field--toggle` — `justify-content: space-between` row
- [ ] `.settings-field__hint` — secondary help text (block, small font, secondary color)
- [ ] `.settings-field__warning` — inline HIPAA warning (danger color)
- [ ] `.settings-actions` — save/reset button row
- [ ] `.settings-save-status` — inline "✓ Saved" feedback
- [ ] `.toggle-input` — styled checkbox as pill toggle (`appearance: none`, custom shape)

---

#### Step 3 — `js/alerts.js` — Alerts list controller

- [ ] Imports: `API`, `showToast`, `buildUrl`; call `requireAuth()`
- [ ] Module state: `let currentFilter = 'all'`
- [ ] `SEVERITY_CONFIG` map: `critical | warning | reviewed` → `{ modifier, label, color }`
- [ ] `formatRelativeTime(date)` → `'Just now'` / `'N min ago'` / `'Nh ago'` / `date.toLocaleDateString()`
- [ ] `renderAlertCard(alert)` → builds `<div class="alert-card {modifier}">`:
  - Severity bar div, badge + timestamp, title `<h3>`, patient `<p>`, diagnosis + confidence
  - "View ECG" `<a>` via `buildUrl('/results.html', { prediction_id })`
  - Conditional `<button class="js-dismiss-alert" data-alert-id>Mark Reviewed</button>` or `<span class="alert-card__reviewed-label">✓ Reviewed</span>`
- [ ] `loadAlerts()`:
  - Clear list, show loading, hide empty
  - `severity = ''` when filter is `'all'` or `'reviewed'`; otherwise pass filter value
  - Apply client-side reviewed filter post-fetch
  - Update `#unreviewed-count` text (clear if 0)
  - Append cards or show empty state
- [ ] `handleDismiss(alertId)` → `API.dismissAlert()` → success toast → `loadAlerts()`
- [ ] Filter buttons: `querySelectorAll('.filter-btn')` → toggle `.filter-btn--active`, set `currentFilter`, reload
- [ ] Dismiss: event delegation on `#alerts-list` targeting `.js-dismiss-alert`
- [ ] Init: `loadAlerts()`

---

#### Step 4 — `alerts.html` — Alerts page

- [ ] Standard shell; `<title>Alerts — ECG Triage</title>`; description meta; auth guard in `<head>`
- [ ] `#app-shell` → `#nav-container` → `<main id="alerts-main" class="content-area">`
- [ ] `<h1>` page heading; `<div id="unreviewed-count" class="alert-count-badge">`
- [ ] `<div id="alerts-filter-bar">` with four buttons: `#filter-all` (`.filter-btn--active`), `#filter-critical`, `#filter-warning`, `#filter-reviewed`
- [ ] `<div id="alerts-list">` (render target)
- [ ] `<div id="alerts-empty" style="display:none">` with message
- [ ] `<div id="alerts-loading">` with 2–3 `.skeleton.skeleton--card` children
- [ ] Bottom `<script type="module">`: `injectNav`, import `alerts.js`, global error handler

**Required IDs:** `nav-container`, `app-shell`, `alerts-main`, `alerts-filter-bar`, `filter-all`, `filter-critical`, `filter-warning`, `filter-reviewed`, `unreviewed-count`, `alerts-list`, `alerts-empty`, `alerts-loading`

---

#### Step 5 — `js/reports.js` — Reports controller

- [ ] Imports: `API`, `showToast`, `buildUrl`, `CONFIG`; call `requireAuth()`
- [ ] Module state: `currentPage = 1`, `currentFrom = ''`, `currentTo = ''`
- [ ] `loadSummary()` — `API.getReportsSummary()` → populate 3 stat spans; failure is non-critical
- [ ] `renderRow(report)` → `<tr>` with date, patient link, diagnosis, confidence badge, format tag, View + CSV actions
- [ ] `renderPagination(total, page, limit)` → numbered buttons in `#reports-pagination`; skip if `totalPages <= 1`
- [ ] `downloadBlob(blob, filename)` → create object URL → click `<a download>` → `URL.revokeObjectURL()`
- [ ] `loadReports()` — clear tbody, show loading, hide empty → `API.getReports()` → render rows or empty state → pagination
- [ ] `#btn-export-bulk` → `API.exportReportsBulk()` → `downloadBlob()`
- [ ] `#reports-tbody` delegation on `.js-export-single` → `API.exportReport()` → `downloadBlob()`
- [ ] `#btn-apply-filter` → set dates, `currentPage = 1`, reload
- [ ] `#btn-clear-filter` → reset state + input values, `currentPage = 1`, reload
- [ ] Init: `loadSummary()` and `loadReports()` (parallel, non-blocking)

---

#### Step 6 — `reports.html` — Reports page

- [ ] Standard shell; `<title>Reports — ECG Triage</title>`; description meta; auth guard
- [ ] `#app-shell` → `#nav-container` → `<main class="content-area">`
- [ ] **Summary bar** `<div id="reports-summary" class="reports-summary-bar">` — three `.summary-stat` blocks with `#stat-total-predictions`, `#stat-predictions-today`, `#stat-avg-confidence` (init `—`)
- [ ] **Controls** `<div id="reports-controls" class="reports-controls">`:
  - `<input type="date" id="filter-from">`, `<input type="date" id="filter-to">`, `#btn-apply-filter`, `#btn-clear-filter`
  - `<button id="btn-export-bulk">Export CSV</button>`
- [ ] `<table id="reports-table" class="data-table">` with 6-column `<thead>` and `<tbody id="reports-tbody">`
- [ ] `<div id="reports-loading" class="hidden">` (3 skeleton rows); `<div id="reports-empty" class="hidden">` with message
- [ ] `<div id="reports-pagination" class="pagination">`
- [ ] Bottom script: `injectNav`, import `reports.js`, global error handler

**Required IDs:** `nav-container`, `app-shell`, `reports-summary`, `stat-total-predictions`, `stat-predictions-today`, `stat-avg-confidence`, `reports-controls`, `filter-from`, `filter-to`, `btn-apply-filter`, `btn-clear-filter`, `btn-export-bulk`, `reports-table`, `reports-tbody`, `reports-loading`, `reports-empty`, `reports-pagination`

---

#### Step 7 — `js/settings.js` — Settings controller

- [ ] Imports: `API`, `showToast`; call `requireAuth()`
- [ ] `TIMEZONES` constant — 11 entries (Africa/Lagos, Africa/Accra, Africa/Nairobi, Europe/London, Europe/Paris, America/New_York, America/Chicago, America/Los_Angeles, Asia/Dubai, Asia/Kolkata, UTC)
- [ ] `DEFAULTS` constant — 7-field object matching `MOCK_SETTINGS` shape
- [ ] Resolve all DOM refs at module top
- [ ] Populate `#setting-timezone` `<select>` from `TIMEZONES`
- [ ] `checkThresholdWarning(value)` — toggle hidden class on `#threshold-warning` when `value < 0.80`
- [ ] Wire `#setting-alert-threshold` `input` event → `checkThresholdWarning()`
- [ ] `loadSettings()` — `API.getSettings()` → set all 6 form field values/states → call `checkThresholdWarning()`; on error toast
- [ ] Form `submit` handler:
  - `e.preventDefault()`; build `preferences` object
  - Validate threshold `[0.50, 1.00]` — toast error if invalid
  - Disable button, `saveStatusEl.textContent = 'Saving…'`
  - `API.saveSettings(preferences)` → `'✓ Saved'` → clear after 3 000 ms
  - `finally`: re-enable button
- [ ] `#btn-reset-settings`: `confirm()` → `API.saveSettings(DEFAULTS)` → `loadSettings()` → success toast
- [ ] Init: `loadSettings()`

---

#### Step 8 — `settings.html` — Settings page

- [ ] Standard shell; `<title>Settings — ECG Triage</title>`; description meta; auth guard
- [ ] `#app-shell` → `#nav-container` → `<main id="settings-main" class="content-area">`
- [ ] `<form id="settings-form" novalidate>` with four `<section class="settings-section">`:
  - **Profile** `id="section-profile"`: `#setting-display-name` text input
  - **Notifications** `id="section-notifications"`: `#setting-email-notifications` checkbox toggle, `#setting-alert-threshold` number input + hint span + `<div id="threshold-warning" class="hidden">`
  - **Upload Defaults** `id="section-upload"`: `#setting-default-format` select (csv / wfdb)
  - **Display** `id="section-display"`: `#setting-timezone` select (JS-populated), `#setting-items-per-page` select (10/20/50)
- [ ] `.settings-actions` div: `#btn-save-settings` submit, `#btn-reset-settings` button, `<span id="settings-save-status" aria-live="polite">`
- [ ] Bottom script: `injectNav`, import `settings.js`, global error handler

**Required IDs:** `nav-container`, `app-shell`, `settings-main`, `settings-form`, `section-profile`, `setting-display-name`, `section-notifications`, `setting-email-notifications`, `setting-alert-threshold`, `threshold-warning`, `section-upload`, `setting-default-format`, `section-display`, `setting-timezone`, `setting-items-per-page`, `btn-save-settings`, `btn-reset-settings`, `settings-save-status`

---

#### Step 9 — `js/components/nav.js` — Add three nav links + Alerts badge

This is the **final** step — all three pages must exist before the nav links to them.

- [ ] Add Alerts, Reports, Settings entries to the `NAV_LINKS` array (with SVG icons)
- [ ] After nav HTML is injected, fire-and-forget `API.getAlerts()`:
  - If `unreviewed_count > 0`: append `<span class="nav-alert-badge">{count}</span>` to the Alerts `<a>` element
  - Failure must silently no-op — never block nav rendering
- [ ] Add `.nav-alert-badge` CSS — small accent-coloured circle, absolute top-right of Alerts link

**Blueprint constraint:** Count fetched **once on nav inject**. No polling, no `setInterval`.

---

### Sprint 5 — Verification Checklist

| # | Check | Pass Condition |
|---|---|---|
| 1 | Static analysis | `node test/static-check-sprint5.mjs` exits 0 |
| 2 | mock-api.js exports | 17 named exports in devtools |
| 3 | Alerts page renders | `/alerts.html` shows 4 cards (3 unreviewed, 1 reviewed) |
| 4 | Severity filter | "Critical" → 2 cards; "Warning" → 2 cards; "Reviewed" → 1 card |
| 5 | Dismiss action | "Mark Reviewed" → card moves to reviewed state |
| 6 | Nav badge | All pages show Alerts nav item with unreviewed count badge |
| 7 | Reports page renders | `/reports.html` summary stats + 18 rows in table |
| 8 | Date filter | From/To → filtered rows; Clear → all 18 return |
| 9 | Bulk export | "Export CSV" → `.csv` file downloads |
| 10 | Single export | Row "CSV" button → single-row `.csv` downloads |
| 11 | Settings page renders | `/settings.html` all fields pre-populated from mock |
| 12 | Threshold warning | 0.75 → warning shown; 0.90 → warning hidden |
| 13 | Save settings | "Save Changes" → "✓ Saved" for 3 s |
| 14 | Reset settings | "Reset to Defaults" → confirm → fields reset |
| 15 | Nav all nine links | Every page shows all 9 nav items in sidebar |

---

### Sprint 6 — Backend Integration (Expanded Scope)

> Existed in v1.0 as Sprint 5. v1.1.0 expands each step's scope to cover the 8 new endpoints.

| Step | Task | Expanded Scope vs v1.0 |
|---|---|---|
| 25 | `api.js` — real fetch for all endpoints | Now **17** functions (was 9); blob-returning `exportReport` / `exportReportsBulk` use raw `fetch`, not `apiFetch` wrapper |
| 26 | Set `USE_MOCK = false` in `api-adapter.js` | Unchanged |
| 27 | Audit mock schema vs real API contract | Add: alert field names (`alert_id`, `severity`, `status`), export format (blob vs signed URL), settings field names |
| 28 | Confirm CORS on backend for all endpoints | Add: `/alerts`, `/alerts/:id/dismiss`, `/reports`, `/reports/summary`, `/reports/:id/export`, `/reports/export`, `/settings` |
| 29 | End-to-end test | Extended: login → upload → results → patient record → **alerts → dismiss → reports → export CSV → settings → save → reset** |

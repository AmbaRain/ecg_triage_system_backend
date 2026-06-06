/**
 * config.js
 * ECG Triage — Environment Constants
 *
 * This is the single source of truth for every configurable value in the
 * application. No magic numbers or hardcoded strings anywhere else.
 *
 * Deferred items are flagged with [DEFERRED] — placeholders that must be
 * replaced once backend contracts are confirmed. See Section 13 of the
 * frontend blueprint for the full deferred-decisions table.
 *
 * Sprint 1, Step 1 of 25.
 */

export const CONFIG = {

  // ─────────────────────────────────────────────────────────────────────────
  // API URLs
  // [DEFERRED] Replace with confirmed values from backend team before
  // switching USE_MOCK = false in api-adapter.js.
  // ─────────────────────────────────────────────────────────────────────────

  /** Java Servlet base URL (development) */
  API_BASE_URL: 'http://localhost:8080/api',

  /**
   * Python microservice base URL (development).
   * [DEFERRED] If the microservice is proxied through the Servlet, this
   * value is unused. Confirm routing with backend team.
   */
  ML_API_BASE_URL: 'http://localhost:5000/api',


  // ─────────────────────────────────────────────────────────────────────────
  // Auth — sessionStorage keys
  // See Section 5 of the blueprint for the full auth flow and the HIPAA
  // note regarding sessionStorage XSS risk.
  // ─────────────────────────────────────────────────────────────────────────

  /** Key under which the JWT is stored in sessionStorage */
  AUTH_TOKEN_KEY: 'ecg_auth_token',

  /** Key under which the serialised user object is stored in sessionStorage */
  AUTH_USER_KEY: 'ecg_current_user',


  // ─────────────────────────────────────────────────────────────────────────
  // Upload limits
  // [DEFERRED] Confirm exact limits with backend team. Mismatches here will
  // produce client-side rejections that differ from server-side rejections.
  // ─────────────────────────────────────────────────────────────────────────

  /** Maximum size for a single uploaded file (CSV, DAT, or HEA) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,       // 10 MB

  /** Maximum combined size for a WFDB DAT + HEA pair */
  MAX_TOTAL_UPLOAD_BYTES: 25 * 1024 * 1024,    // 25 MB


  // ─────────────────────────────────────────────────────────────────────────
  // ECG signal defaults
  // [DEFERRED] Confirm lead count and labels with backend team. The model
  // may support fewer or more leads than the standard clinical 12.
  // ─────────────────────────────────────────────────────────────────────────

  /** Expected number of leads in every ECG recording */
  DEFAULT_LEAD_COUNT: 12,

  /** Ordered display labels for each lead channel */
  LEAD_LABELS: ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'],

  /**
   * Target number of data points per lead sent to Plotly.
   * Signals are downsampled to this count before rendering to keep the DOM
   * performant. Peaks are preserved via min-max decimation — see waveform.js.
   */
  DISPLAY_POINTS_PER_LEAD: 1000,


  // ─────────────────────────────────────────────────────────────────────────
  // Network
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * AbortController timeout for all fetch calls (milliseconds).
   * Must be greater than the backend's maximum ML inference time.
   * [DEFERRED] Confirm with backend team; raise if inference SLA exceeds 45s.
   */
  FETCH_TIMEOUT_MS: 45_000,                    // 45 seconds


  // ─────────────────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────────────────

  /** Number of patient records to fetch per page on the patient list */
  PATIENTS_PER_PAGE: 20,

};

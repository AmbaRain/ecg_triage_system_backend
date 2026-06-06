/**
 * api-adapter.js
 * ECG Triage — Single API Import Point
 *
 * All application code imports from this file only.
 * Never import directly from api.js or mock-api.js.
 *
 * To switch to the real backend: set USE_MOCK = false.
 * api.js does not need to exist yet — it will be wired in Sprint 5.
 *
 * Sprint 1, Step 4 of 25.
 */

import * as MockAPI from './mock-api.js';

// ─── Toggle here when backend is live ────────────────────────────────────────
const USE_MOCK = true; // SET TO false WHEN BACKEND IS LIVE (Sprint 5)
// ─────────────────────────────────────────────────────────────────────────────

let RealAPI;
if (!USE_MOCK) {
  // Dynamically import real API only when needed so that mock-only builds
  // do not throw a module-not-found error before api.js is authored.
  // This branch is inert during Sprints 1–4.
  RealAPI = await import('./api.js');
}

/**
 * The active API module.
 * Exposes: login, logout, getMe, uploadECGcsv, uploadECGwfdb,
 *          getPrediction, getPatients, getPatient, getPatientPredictions
 *
 * @type {typeof MockAPI}
 */
export const API = USE_MOCK ? MockAPI : RealAPI;

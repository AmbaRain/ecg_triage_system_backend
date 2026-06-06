/**
 * state.js
 * ECG Triage — Global State Module (pub/sub pattern)
 *
 * This module is the single owner of all in-page cross-component state.
 * It has zero dependencies (does not import config.js or anything else).
 *
 * Rules:
 *  - No direct access to _state or _listeners outside this module.
 *  - All reads go through getState(key).
 *  - All writes go through setState(key, value), which notifies subscribers.
 *  - State does NOT persist across page navigations (MPA design).
 *    Cross-page context travels via URL query params — see router.js.
 *
 * Sprint 1, Step 2 of 25.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal state store
// ─────────────────────────────────────────────────────────────────────────────

const _state = {
  /** The authenticated user object: { user_id, username, full_name, role } */
  currentUser: null,

  /** The active prediction result object returned by the API */
  currentPrediction: null,

  /** The active patient record object returned by the API */
  currentPatient: null,

  /** Populated patient array on the patients list page */
  patientList: [],

  /** Active upload mode — 'csv' | 'wfdb' */
  uploadMode: 'csv',

  /** Global loading flag — managed by loader.js; set here for cross-component awareness */
  isLoading: false,

  /** Last caught error object: { status, message } or null */
  lastError: null,
};


// ─────────────────────────────────────────────────────────────────────────────
// Internal listener registry
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Object.<string, Array.<function>>} */
const _listeners = {};


// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the current value of a state key.
 *
 * @param {keyof typeof _state} key
 * @returns {*}
 *
 * @example
 * import { getState } from './js/state.js';
 * const user = getState('currentUser');
 */
export function getState(key) {
  return _state[key];
}

/**
 * Write a value to a state key and notify all subscribers for that key.
 *
 * @param {keyof typeof _state} key
 * @param {*} value
 *
 * @example
 * import { setState } from './js/state.js';
 * setState('isLoading', true);
 */
export function setState(key, value) {
  _state[key] = value;
  if (_listeners[key]) {
    _listeners[key].forEach(fn => fn(value));
  }
}

/**
 * Subscribe a callback to changes on a specific state key.
 * The callback is called immediately with the current value on first
 * subscription so callers do not need a separate initial read.
 *
 * @param {keyof typeof _state} key
 * @param {function(*): void} callback  Receives the new value on each change.
 * @returns {function(): void}          Unsubscribe function for cleanup.
 *
 * @example
 * import { subscribe } from './js/state.js';
 * const unsub = subscribe('isLoading', (loading) => {
 *   document.getElementById('spinner').hidden = !loading;
 * });
 * // Later, to stop listening:
 * unsub();
 */
export function subscribe(key, callback) {
  if (!_listeners[key]) _listeners[key] = [];
  _listeners[key].push(callback);

  // Immediately invoke with current value so the subscriber
  // can initialise its DOM without a separate getState() call.
  callback(_state[key]);

  // Return a convenience unsubscribe function.
  return () => unsubscribe(key, callback);
}

/**
 * Remove a previously registered callback for a state key.
 * Prefer calling the unsubscribe function returned by subscribe() instead.
 *
 * @param {keyof typeof _state} key
 * @param {function(*): void} callback  Must be the same function reference.
 */
export function unsubscribe(key, callback) {
  if (_listeners[key]) {
    _listeners[key] = _listeners[key].filter(fn => fn !== callback);
  }
}

/**
 * Reset the entire state to its initial values and clear all listeners.
 * Called on logout to ensure no stale patient or prediction data lingers.
 */
export function resetState() {
  Object.assign(_state, {
    currentUser: null,
    currentPrediction: null,
    currentPatient: null,
    patientList: [],
    uploadMode: 'csv',
    isLoading: false,
    lastError: null,
  });

  // Notify all listeners of the reset values
  Object.keys(_listeners).forEach(key => {
    if (_listeners[key]) {
      _listeners[key].forEach(fn => fn(_state[key]));
    }
  });
}

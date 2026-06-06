/**
 * components/patient-card.js
 * ECG Triage — Reusable Patient Summary Card
 *
 * Creates and returns a self-contained <a> element representing a patient.
 * Used by patients.html (list) and patient.html (top banner).
 *
 * Visual translation (React Vitals screen → patient-card):
 *   React: patient name + "● LIVE MONITORING" badge in a topbar
 *   Here:  Avatar initial + name + ID pill + DOB + prediction count badge
 *
 * Usage:
 *   import { createPatientCard } from './js/components/patient-card.js';
 *   const card = createPatientCard(patient, { selected: false });
 *   container.appendChild(card);
 *
 * Sprint 4, Step 18 of 25.
 */

/**
 * Derive initials from a full name.
 * "Dr. Amaka Adeyemi" → "AA"
 * @param {string} fullName
 * @returns {string} 1–2 uppercase characters
 */
function getInitials(fullName) {
  const parts = (fullName || '?').trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format an ISO date string to a readable local date.
 * @param {string|null} iso
 * @returns {string}
 */
function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Create a patient summary card element.
 *
 * @param {Object}  patient                  Patient record from API.getPatients()
 * @param {string}  patient.patient_id
 * @param {string}  patient.full_name
 * @param {string}  [patient.date_of_birth]  ISO date string
 * @param {string}  [patient.last_prediction_date]  ISO date string
 * @param {number}  [patient.prediction_count]
 *
 * @param {Object}  [options]
 * @param {boolean} [options.selected=false]  Adds .patient-card--selected accent
 * @param {string}  [options.href]            Override href (default: /patient.html?patient_id=...)
 *
 * @returns {HTMLAnchorElement}
 */
export function createPatientCard(patient, options = {}) {
  const {
    selected = false,
    href = `/patient.html?patient_id=${encodeURIComponent(patient.patient_id)}`,
  } = options;

  const card = document.createElement('a');
  card.className = `patient-card${selected ? ' patient-card--selected' : ''}`;
  card.href = href;
  card.setAttribute('aria-label', `Patient ${patient.full_name}, ID ${patient.patient_id}`);

  const initials  = getInitials(patient.full_name);
  const dob       = fmtDate(patient.date_of_birth);
  const lastPred  = patient.last_prediction_date
    ? `Last: ${fmtDate(patient.last_prediction_date)}`
    : 'No predictions yet';
  const count     = patient.prediction_count ?? 0;

  card.innerHTML = `
    <div class="patient-card__avatar" aria-hidden="true">${initials}</div>
    <div class="patient-card__info">
      <div class="patient-card__name">${patient.full_name}</div>
      <div class="patient-card__meta">
        <span class="patient-card__id label-mono">${patient.patient_id}</span>
        <span class="patient-card__dob">DOB: ${dob}</span>
        <span class="patient-card__dob">${lastPred}</span>
      </div>
    </div>
    <div class="patient-card__badge">
      <span class="badge badge--neutral" title="${count} prediction${count !== 1 ? 's' : ''}">
        ${count}
      </span>
    </div>
  `;

  return card;
}

/**
 * Create a row of skeleton patient cards (loading state).
 * @param {number} count  Number of skeleton rows to render (default 5)
 * @returns {DocumentFragment}
 */
export function createPatientCardSkeletons(count = 5) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'patient-card';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="patient-card__avatar skeleton" style="background:none"></div>
      <div class="patient-card__info">
        <div class="skeleton skeleton--text" style="width:${120 + (i % 3) * 30}px"></div>
        <div class="skeleton skeleton--text" style="width:${80 + (i % 2) * 20}px;height:0.75em"></div>
      </div>
      <div class="patient-card__badge">
        <div class="skeleton" style="width:28px;height:20px;border-radius:100px"></div>
      </div>
    `;
    frag.appendChild(el);
  }
  return frag;
}

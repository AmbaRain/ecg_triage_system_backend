/**
 * reports.js
 * ECG Triage — Reports List Controller
 * Sprint 5, Step 5 of 9.
 *
 * Shows a card grid of written clinical reports.
 * Clinicians can write new reports via a modal (Generate Report).
 * Supports date-range filtering and CSV export.
 */

import { API } from './api-adapter.js';
import { requireAuth } from './auth.js';
import { showToast } from './components/toast.js';

if (!requireAuth()) throw new Error('Unauthenticated');

// ─── State ───────────────────────────────────────────────────────────────────
let currentPage = 1;
let currentFrom = '';
let currentTo   = '';
const LIMIT = 12; // cards per page

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const gridEl       = document.getElementById('reports-grid');
const emptyEl      = document.getElementById('reports-empty');
const loadingEl    = document.getElementById('reports-loading');
const paginationEl = document.getElementById('reports-pagination');
const modalEl      = document.getElementById('generate-report-modal');
const formEl       = document.getElementById('generate-report-form');
const filterFrom   = document.getElementById('filter-from');
const filterTo     = document.getElementById('filter-to');

// ─── Report type config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  discharge:  { label: 'Discharge',  iconMod: 'report-card__icon--discharge',  tagMod: 'report-type-tag--discharge',  icon: '🏥' },
  vitals:     { label: 'Vitals',     iconMod: 'report-card__icon--vitals',     tagMod: 'report-type-tag--vitals',     icon: '📈' },
  monitoring: { label: 'Monitoring', iconMod: 'report-card__icon--monitoring', tagMod: 'report-type-tag--monitoring', icon: '🖥' },
  diagnostic: { label: 'Diagnostic', iconMod: 'report-card__icon--diagnostic', tagMod: 'report-type-tag--diagnostic', icon: '🔬' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Render card ─────────────────────────────────────────────────────────────
function renderReportCard(report) {
  const type = report.report_type || 'diagnostic';
  const cfg  = TYPE_CONFIG[type] || TYPE_CONFIG.diagnostic;

  const card = document.createElement('div');
  card.className = 'report-card';
  card.innerHTML = `
    <div class="report-card__top">
      <div class="report-card__icon ${cfg.iconMod}" aria-hidden="true">${cfg.icon}</div>
      <span class="report-type-tag ${cfg.tagMod}">${cfg.label}</span>
    </div>
    <h3 class="report-card__title">${escapeHtml(report.report_title)}</h3>
    <p class="report-card__patient">
      <a href="/patient.html?patient_id=${encodeURIComponent(report.patient_id)}"
         class="text-link" id="rpt-patient-${report.report_id}">
        ${escapeHtml(report.patient_name)}
      </a>
    </p>
    <p class="report-card__summary">${escapeHtml(report.summary)}</p>
    <div class="report-card__footer">
      <span class="report-card__date">${formatDate(report.created_at)}</span>
      <button class="btn btn--ghost btn--sm js-export-single"
              data-report-id="${report.report_id}"
              data-patient-name="${escapeHtml(report.patient_name)}"
              id="export-${report.report_id}"
              aria-label="Download report for ${escapeHtml(report.patient_name)}">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd"
            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            clip-rule="evenodd"/>
        </svg>
        Download
      </button>
    </div>
  `;
  return card;
}

// ─── Render pagination ────────────────────────────────────────────────────────
function renderPagination(total, page, limit) {
  if (!paginationEl) return;
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  const btns = Array.from({ length: totalPages }, (_, i) => {
    const n = i + 1;
    return `<button class="pagination__btn${n === page ? ' active' : ''}"
                    data-page="${n}"
                    aria-label="Page ${n}"
                    aria-current="${n === page ? 'page' : 'false'}">
              ${n}
            </button>`;
  }).join('');

  paginationEl.innerHTML = `<div class="pagination__controls">${btns}</div>`;
  paginationEl.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      loadReports();
    });
  });
}

// ─── Load summary stats ───────────────────────────────────────────────────────
async function loadSummary() {
  try {
    const data = await API.getReportsSummary();
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setEl('stat-total-predictions', data.total_predictions ?? '—');
    setEl('stat-predictions-today', data.predictions_today ?? '—');
    setEl('stat-avg-confidence',    data.avg_confidence ? `${Math.round(data.avg_confidence * 100)}%` : '—');
    setEl('stat-total-reports',     data.total_reports ?? '—');
  } catch { /* non-critical */ }
}

// ─── Load reports ─────────────────────────────────────────────────────────────
async function loadReports() {
  loadingEl.style.display = '';
  emptyEl.style.display   = 'none';
  gridEl.innerHTML         = '';
  if (paginationEl) paginationEl.innerHTML = '';

  try {
    const data = await API.getReports({ page: currentPage, limit: LIMIT, from: currentFrom, to: currentTo });

    loadingEl.style.display = 'none';

    if (!data.reports.length) { emptyEl.style.display = ''; return; }

    const frag = document.createDocumentFragment();
    data.reports.forEach(r => frag.appendChild(renderReportCard(r)));
    gridEl.appendChild(frag);
    renderPagination(data.total, data.page, LIMIT);

  } catch (err) {
    loadingEl.style.display = 'none';
    showToast(err?.message || 'Failed to load reports.', 'error');
  }
}

// ─── Modal helpers ─────────────────────────────────────────────────────────────
function openModal() { modalEl.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal() { modalEl.classList.add('hidden'); document.body.style.overflow = ''; formEl.reset(); }

// Populate patient select in modal
async function populatePatientSelect() {
  try {
    const select = document.getElementById('report-patient-select');
    if (!select) return;
    const { patients } = await API.getPatients({ limit: 50 });
    select.innerHTML = '<option value="">Select patient</option>' +
      patients.map(p => `<option value="${p.patient_id}">${escapeHtml(p.full_name)}</option>`).join('');
  } catch { /* non-critical */ }
}

// ─── Wire modal open/close ────────────────────────────────────────────────────
document.getElementById('btn-generate-report')?.addEventListener('click', () => { openModal(); populatePatientSelect(); });
document.getElementById('btn-modal-cancel')?.addEventListener('click', closeModal);
modalEl?.addEventListener('click', e => { if (e.target === modalEl) closeModal(); });
document.getElementById('btn-modal-close')?.addEventListener('click', closeModal);

// ─── Wire modal form submit ───────────────────────────────────────────────────
formEl?.addEventListener('submit', async e => {
  e.preventDefault();
  const submitBtn = formEl.querySelector('[type="submit"]');
  const title     = document.getElementById('report-title-input').value.trim();
  const patientId = document.getElementById('report-patient-select').value;
  const type      = document.getElementById('report-type-select').value;
  const summary   = document.getElementById('report-summary-input').value.trim();

  if (!title || !patientId || !type || !summary) {
    showToast('Please fill in all fields.', 'error'); return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Generating…';

  try {
    await API.createReport({ report_title: title, patient_id: patientId, report_type: type, summary });
    showToast('Report generated successfully.', 'success');
    closeModal();
    currentPage = 1;
    loadReports();
    loadSummary();
  } catch (err) {
    showToast(err?.message || 'Failed to generate report.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Generate';
  }
});

// ─── Wire filter apply/clear ──────────────────────────────────────────────────
document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
  currentFrom = filterFrom?.value || '';
  currentTo   = filterTo?.value   || '';
  currentPage = 1;
  loadReports();
});

document.getElementById('btn-clear-filter')?.addEventListener('click', () => {
  currentFrom = ''; currentTo = '';
  if (filterFrom) filterFrom.value = '';
  if (filterTo)   filterTo.value   = '';
  currentPage = 1;
  loadReports();
});

// ─── Wire export buttons (event delegation) ───────────────────────────────────
document.getElementById('btn-export-bulk')?.addEventListener('click', async () => {
  try {
    const blob = await API.exportReportsBulk({ from: currentFrom, to: currentTo });
    downloadBlob(blob, `ecg-triage-reports-${Date.now()}.csv`);
  } catch (err) {
    showToast(err?.message || 'Export failed.', 'error');
  }
});

gridEl?.addEventListener('click', async e => {
  const btn = e.target.closest('.js-export-single');
  if (!btn) return;
  try {
    const blob = await API.exportReport(btn.dataset.reportId);
    downloadBlob(blob, `ecg-report-${btn.dataset.reportId}.csv`);
  } catch (err) {
    showToast(err?.message || 'Export failed.', 'error');
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadSummary();
loadReports();

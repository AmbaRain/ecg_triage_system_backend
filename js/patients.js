/**
 * patients.js
 * ECG Triage — Patient List Controller
 *
 * Handles:
 *   - Initial load: fetch paginated patient list from API
 *   - Client-side search debounce → re-fetch with search param
 *   - Pagination: prev / next / page-number buttons
 *   - Row click → navigate to patient.html
 *   - Loading and empty states
 *
 * Sprint 4, Step 19 of 25.
 */

import { CONFIG }                             from './config.js';
import { API }                                from './api-adapter.js';
import { setState }                           from './state.js';
import { navigateTo, getQueryParam }          from './router.js';
import { showToast }                          from './components/toast.js';
import { createPatientCardSkeletons }         from './components/patient-card.js';

// ─── State ────────────────────────────────────────────────────────────────────

let _currentPage   = 1;
let _currentSearch = '';
let _totalPatients = 0;
let _debounceTimer = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function getInitials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── DOM refs (populated in initPatientsPage) ─────────────────────────────────

let tbody, loadingEl, tableWrap, emptyEl;
let paginationInfo, btnPrev, btnNext, pageButtons;
let searchInput;

// ─── Table rendering ──────────────────────────────────────────────────────────

/**
 * Render a page of patients into the table body.
 * @param {Object[]} patients
 */
function renderRows(patients) {
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!patients.length) {
    if (loadingEl)  loadingEl.style.display  = 'none';
    if (tableWrap)  tableWrap.style.display  = 'none';
    if (emptyEl)    emptyEl.style.display    = '';
    return;
  }

  if (emptyEl)    emptyEl.style.display    = 'none';
  if (loadingEl)  loadingEl.style.display  = 'none';
  if (tableWrap)  tableWrap.style.display  = '';

  patients.forEach(p => {
    const lastDate = fmtDate(p.last_prediction_date);
    const dob      = fmtDate(p.date_of_birth);
    const count    = p.prediction_count ?? 0;
    const initials = getInitials(p.full_name);

    const tr = document.createElement('tr');
    tr.dataset.patientId = p.patient_id;
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="patient-card__avatar" style="width:32px;height:32px;font-size:0.8rem;flex-shrink:0" aria-hidden="true">
            ${initials}
          </div>
          <span style="font-weight:500">${p.full_name}</span>
        </div>
      </td>
      <td><span class="label-mono">${p.patient_id}</span></td>
      <td class="text-secondary text-sm">${dob}</td>
      <td class="text-secondary text-sm">${lastDate}</td>
      <td>
        <span class="badge badge--neutral" title="${count} prediction${count !== 1 ? 's' : ''}">
          ${count}
        </span>
      </td>
      <td style="text-align:right">
        <a
          href="/patient.html?patient_id=${encodeURIComponent(p.patient_id)}"
          class="btn btn--ghost btn--sm"
          id="btn-view-patient-${p.patient_id}"
          aria-label="View patient ${p.full_name}"
        >View →</a>
      </td>
    `;

    // Full-row click navigates, unless they clicked the action link itself
    tr.addEventListener('click', e => {
      if (e.target.tagName !== 'A' && !e.target.closest('a')) {
        navigateTo('/patient.html', { patient_id: p.patient_id });
      }
    });

    tbody.appendChild(tr);
  });
}

// ─── Pagination rendering ─────────────────────────────────────────────────────

function renderPagination(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start      = total === 0 ? 0 : (page - 1) * limit + 1;
  const end        = Math.min(page * limit, total);

  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${start}–${end} of ${total} patients`;
  }

  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;

  // Rebuild page-number buttons
  if (pageButtons) {
    pageButtons.innerHTML = '';
    const maxVisible = 5;
    let startPage = Math.max(1, page - 2);
    let endPage   = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.className = `pagination__btn${i === page ? ' active' : ''}`;
      btn.textContent = i;
      btn.setAttribute('aria-label', `Page ${i}`);
      btn.setAttribute('aria-current', i === page ? 'page' : 'false');
      btn.addEventListener('click', () => {
        _currentPage = i;
        loadPatients();
      });
      pageButtons.appendChild(btn);
    }
  }
}

// ─── Data load ────────────────────────────────────────────────────────────────

/**
 * Fetch the current page of patients from the API and update the DOM.
 */
async function loadPatients() {
  // Show skeleton while loading
  if (loadingEl)  loadingEl.style.display = '';
  if (tableWrap)  tableWrap.style.display = 'none';
  if (emptyEl)    emptyEl.style.display   = 'none';

  try {
    const { patients, total, page, limit } = await API.getPatients({
      page:   _currentPage,
      limit:  CONFIG.PATIENTS_PER_PAGE,
      search: _currentSearch,
    });

    _totalPatients = total;
    setState('patientList', patients);

    const countLabel = document.getElementById('patients-count-label');
    if (countLabel) {
      countLabel.textContent = `${total} patient${total !== 1 ? 's' : ''} registered`;
    }

    renderRows(patients);
    renderPagination(total, page, limit ?? CONFIG.PATIENTS_PER_PAGE);

    // Sync URL without full reload
    const url = new URL(window.location.href);
    if (_currentSearch) url.searchParams.set('search', _currentSearch);
    else                url.searchParams.delete('search');
    url.searchParams.set('page', String(_currentPage));
    window.history.replaceState({}, '', url.toString());

  } catch (err) {
    if (loadingEl) {
      loadingEl.innerHTML =
        `<span style="color:var(--color-danger)">Failed to load patients.</span>`;
      loadingEl.style.display = '';
    }
    showToast(err?.message || 'Failed to load patient list.', 'error');
  }
}

// ─── Public init ──────────────────────────────────────────────────────────────

/**
 * Initialize the patients list page.
 * Call once from patients.html <script type="module">.
 */
export function initPatientsPage() {
  // Resolve DOM refs
  tbody          = document.getElementById('patients-tbody');
  loadingEl      = document.getElementById('patients-loading');
  tableWrap      = document.getElementById('patients-table-wrap');
  emptyEl        = document.getElementById('patients-empty');
  paginationInfo = document.getElementById('pagination-info');
  btnPrev        = document.getElementById('btn-page-prev');
  btnNext        = document.getElementById('btn-page-next');
  pageButtons    = document.getElementById('page-buttons');
  searchInput    = document.getElementById('patients-search');

  // Show loading skeletons immediately
  if (loadingEl) {
    loadingEl.innerHTML = '';
    loadingEl.appendChild(createPatientCardSkeletons(CONFIG.PATIENTS_PER_PAGE));
  }

  // Seed from URL params (e.g. arriving from dashboard search)
  _currentSearch = getQueryParam('search') || '';
  _currentPage   = parseInt(getQueryParam('page') || '1', 10) || 1;
  if (searchInput && _currentSearch) searchInput.value = _currentSearch;

  // Search debounce
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => {
        _currentSearch = searchInput.value.trim();
        _currentPage   = 1;
        loadPatients();
      }, 350);
    });
    // Immediate search on Enter
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        clearTimeout(_debounceTimer);
        _currentSearch = searchInput.value.trim();
        _currentPage   = 1;
        loadPatients();
      }
    });
  }

  // Pagination buttons
  btnPrev?.addEventListener('click', () => {
    if (_currentPage > 1) { _currentPage--; loadPatients(); }
  });
  btnNext?.addEventListener('click', () => {
    const totalPages = Math.ceil(_totalPatients / CONFIG.PATIENTS_PER_PAGE);
    if (_currentPage < totalPages) { _currentPage++; loadPatients(); }
  });

  // Initial load
  loadPatients();
}

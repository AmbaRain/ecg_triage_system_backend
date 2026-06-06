/**
 * upload.js
 * ECG Triage — Upload Flow Controller
 *
 * Handles:
 *   - CSV / WFDB mode toggle
 *   - Drag-and-drop + click-to-select file picking
 *   - Client-side file validation (type, size, WFDB base-name match)
 *   - Submit flow: showLoader → API call → redirect to results.html
 *   - Error display via toast + inline field errors
 *
 * See Section 6 of the frontend blueprint for the full upload flow spec.
 * Sprint 3, Step 14 of 25.
 */

import { CONFIG }                   from './config.js';
import { API }                      from './api-adapter.js';
import { showLoader, hideLoader }   from './components/loader.js';
import { showToast }                from './components/toast.js';

// ─── Upload Mode ─────────────────────────────────────────────────────────────

const UploadMode = Object.freeze({ CSV: 'csv', WFDB: 'wfdb' });
let currentMode = UploadMode.CSV;

// ─── File state ──────────────────────────────────────────────────────────────

let _csvFile  = null;
let _datFile  = null;
let _heaFile  = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate a file's extension and size.
 * @param {File} file
 * @param {string[]} allowedExts  e.g. ['csv']
 * @throws {Error} on invalid type or excess size
 */
function validateFile(file, allowedExts) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowedExts.includes(ext)) {
    throw new Error(
      `Invalid file type: .${ext}. Expected: ${allowedExts.join(', ')}`
    );
  }
  if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File too large: ${formatBytes(file.size)}. Maximum: ${formatBytes(CONFIG.MAX_FILE_SIZE_BYTES)}`
    );
  }
}

/**
 * Ensure both WFDB files share the same base name.
 * @param {File} datFile
 * @param {File} heaFile
 * @throws {Error} on mismatch
 */
function validateWFDBPair(datFile, heaFile) {
  const datBase = datFile.name.replace(/\.dat$/i, '');
  const heaBase = heaFile.name.replace(/\.hea$/i, '');
  if (datBase !== heaBase) {
    throw new Error(
      `File name mismatch: "${datFile.name}" and "${heaFile.name}" must share the same base name.`
    );
  }
}

// ─── Inline error display ─────────────────────────────────────────────────────

function showFieldError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'flex';
}

function clearFieldError(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

// ─── File info display ────────────────────────────────────────────────────────

function renderFileInfo(containerId, file) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!file) { el.style.display = 'none'; return; }
  el.querySelector('.file-selected-info__name').textContent = file.name;
  el.querySelector('.file-selected-info__size').textContent = formatBytes(file.size);
  el.style.display = 'flex';
}

// ─── Submit button state ──────────────────────────────────────────────────────

function updateSubmitState() {
  const btn = document.getElementById('btn-submit-upload');
  if (!btn) return;

  let ready = false;
  const patientId = (document.getElementById('input-patient-id')?.value || '').trim();

  if (currentMode === UploadMode.CSV) {
    ready = !!_csvFile && !!patientId;
  } else {
    ready = !!_datFile && !!_heaFile && !!patientId;
  }

  btn.disabled = !ready;
}

// ─── Mode toggle ─────────────────────────────────────────────────────────────

/**
 * Switch the upload mode and update the UI accordingly.
 * @param {string} mode  UploadMode.CSV | UploadMode.WFDB
 */
export function setMode(mode) {
  currentMode = mode;
  _csvFile = _datFile = _heaFile = null;

  // Toggle button active state
  document.querySelectorAll('.upload-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Show/hide mode-specific panels
  const csvPanel  = document.getElementById('panel-csv');
  const wfdbPanel = document.getElementById('panel-wfdb');
  if (csvPanel)  csvPanel.style.display  = mode === UploadMode.CSV  ? '' : 'none';
  if (wfdbPanel) wfdbPanel.style.display = mode === UploadMode.WFDB ? '' : 'none';

  // Reset file info displays and errors
  ['csv-file-info', 'dat-file-info', 'hea-file-info'].forEach(id => renderFileInfo(id, null));
  ['error-csv', 'error-dat', 'error-hea', 'error-wfdb-pair'].forEach(clearFieldError);

  updateSubmitState();
}

// ─── Drop zone wiring ─────────────────────────────────────────────────────────

/**
 * Wire drag-and-drop and change events on a drop zone.
 * @param {string} dropZoneId   ID of the .drop-zone element
 * @param {string} fileInputId  ID of the <input type="file">
 * @param {function} onFile     Callback(file) when a file is selected/dropped
 */
function wireDropZone(dropZoneId, fileInputId, onFile) {
  const zone  = document.getElementById(dropZoneId);
  const input = document.getElementById(fileInputId);
  if (!zone || !input) return;

  // Drag visual feedback
  zone.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  });

  // Standard file picker
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) onFile(file);
    // Reset so the same file can be re-selected after a validation error
    input.value = '';
  });
}

// ─── File-specific handlers ───────────────────────────────────────────────────

function handleCsvFile(file) {
  clearFieldError('error-csv');
  try {
    validateFile(file, ['csv']);
    _csvFile = file;
    renderFileInfo('csv-file-info', file);
  } catch (err) {
    _csvFile = null;
    renderFileInfo('csv-file-info', null);
    showFieldError('error-csv', err.message);
  }
  updateSubmitState();
}

function handleDatFile(file) {
  clearFieldError('error-dat');
  clearFieldError('error-wfdb-pair');
  try {
    validateFile(file, ['dat']);
    _datFile = file;
    renderFileInfo('dat-file-info', file);
    // Re-validate pair if HEA is already selected
    if (_heaFile) validateWFDBPair(_datFile, _heaFile);
  } catch (err) {
    if (err.message.includes('mismatch')) {
      showFieldError('error-wfdb-pair', err.message);
    } else {
      _datFile = null;
      renderFileInfo('dat-file-info', null);
      showFieldError('error-dat', err.message);
    }
  }
  updateSubmitState();
}

function handleHeaFile(file) {
  clearFieldError('error-hea');
  clearFieldError('error-wfdb-pair');
  try {
    validateFile(file, ['hea']);
    _heaFile = file;
    renderFileInfo('hea-file-info', file);
    // Re-validate pair if DAT is already selected
    if (_datFile) validateWFDBPair(_datFile, _heaFile);
  } catch (err) {
    if (err.message.includes('mismatch')) {
      showFieldError('error-wfdb-pair', err.message);
    } else {
      _heaFile = null;
      renderFileInfo('hea-file-info', null);
      showFieldError('error-hea', err.message);
    }
  }
  updateSubmitState();
}

// ─── Submit handler ───────────────────────────────────────────────────────────

/**
 * Execute the upload + inference request, then navigate to results.
 * Called from upload.html's submit button.
 * @returns {Promise<void>}
 */
export async function handleUploadSubmit() {
  const patientId = (document.getElementById('input-patient-id')?.value || '').trim();

  if (!patientId) {
    showToast('Please enter a Patient ID before submitting.', 'warning');
    document.getElementById('input-patient-id')?.focus();
    return;
  }

  try {
    let result;

    if (currentMode === UploadMode.CSV) {
      if (!_csvFile) throw new Error('Please select a CSV file.');
      validateFile(_csvFile, ['csv']);                 // re-validate before submit
      showLoader('Uploading ECG data…');
      result = await API.uploadECGcsv(_csvFile, patientId);

    } else {
      if (!_datFile || !_heaFile) throw new Error('Please select both .dat and .hea files.');
      validateFile(_datFile, ['dat']);
      validateFile(_heaFile, ['hea']);
      validateWFDBPair(_datFile, _heaFile);

      const totalSize = _datFile.size + _heaFile.size;
      if (totalSize > CONFIG.MAX_TOTAL_UPLOAD_BYTES) {
        throw new Error(
          `Combined file size too large: ${formatBytes(totalSize)}. Maximum: ${formatBytes(CONFIG.MAX_TOTAL_UPLOAD_BYTES)}`
        );
      }

      showLoader('Uploading ECG data…');
      result = await API.uploadECGwfdb(_datFile, _heaFile, patientId);
    }

    // Update loader message for inference phase
    const msgEl = document.getElementById('loader-message');
    if (msgEl) msgEl.textContent = 'Analyzing ECG…';

    hideLoader();

    // Navigate to results page — see Section 6 of blueprint
    window.location.href = `/results.html?prediction_id=${result.prediction_id}`;

  } catch (err) {
    hideLoader();
    showToast(err.message || 'Upload failed. Please try again.', 'error');
  }
}

// ─── Page init ────────────────────────────────────────────────────────────────

/**
 * Initialize the upload page.
 * Call once from upload.html's <script type="module">.
 */
export function initUploadPage() {
  // Mode toggle buttons
  document.querySelectorAll('.upload-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  // Wire drop zones
  wireDropZone('drop-zone-csv', 'input-csv', handleCsvFile);
  wireDropZone('drop-zone-dat', 'input-dat', handleDatFile);
  wireDropZone('drop-zone-hea', 'input-hea', handleHeaFile);

  // Patient ID → re-evaluate submit state on every keystroke
  document.getElementById('input-patient-id')?.addEventListener('input', updateSubmitState);

  // Submit button
  document.getElementById('btn-submit-upload')?.addEventListener('click', handleUploadSubmit);

  // Initial state: CSV mode
  setMode(UploadMode.CSV);
}

// static-check-sprint3.mjs
// Offline structural checks for Sprint 3 deliverables.
// Usage: node test/static-check-sprint3.mjs

import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const checks = [];
function pass(name)                { checks.push({ status: 'PASS', name }); }
function fail(name, reason)        { checks.push({ status: 'FAIL', name, reason }); }
function check(name, cond, reason) { cond ? pass(name) : fail(name, reason); }

function read(rel)    { return readFileSync(path.join(root, rel), 'utf8'); }
function exists(rel)  { return existsSync(path.join(root, rel)); }
function sizeKB(rel)  { return statSync(path.join(root, rel)).size / 1024; }

// ── js/upload.js ──────────────────────────────────────────────────────────────
const upload = read('js/upload.js');
check('upload.js · exports initUploadPage',          upload.includes('export function initUploadPage'),     'initUploadPage not exported');
check('upload.js · exports handleUploadSubmit',      upload.includes('export async function handleUploadSubmit'), 'handleUploadSubmit not exported');
check('upload.js · exports setMode',                 upload.includes('export function setMode'),            'setMode not exported');
check('upload.js · imports CONFIG',                  upload.includes("from './config.js'"),                  'config.js not imported');
check('upload.js · imports API',                     upload.includes("from './api-adapter.js'"),             'api-adapter.js not imported');
check('upload.js · imports showLoader/hideLoader',   upload.includes("from './components/loader.js'"),      'loader.js not imported');
check('upload.js · imports showToast',               upload.includes("from './components/toast.js'"),        'toast.js not imported');
check('upload.js · CSV mode constant',               upload.includes("CSV: 'csv'"),                          "UploadMode.CSV missing");
check('upload.js · WFDB mode constant',              upload.includes("WFDB: 'wfdb'"),                        "UploadMode.WFDB missing");
check('upload.js · validateFile function',           upload.includes('function validateFile'),               'validateFile missing');
check('upload.js · validateWFDBPair function',       upload.includes('function validateWFDBPair'),           'validateWFDBPair missing');
check('upload.js · MAX_FILE_SIZE_BYTES check',       upload.includes('MAX_FILE_SIZE_BYTES'),                 'MAX_FILE_SIZE_BYTES not checked');
check('upload.js · MAX_TOTAL_UPLOAD_BYTES check',    upload.includes('MAX_TOTAL_UPLOAD_BYTES'),              'MAX_TOTAL_UPLOAD_BYTES not checked');
check('upload.js · API.uploadECGcsv call',           upload.includes('API.uploadECGcsv'),                   'API.uploadECGcsv not called');
check('upload.js · API.uploadECGwfdb call',          upload.includes('API.uploadECGwfdb'),                  'API.uploadECGwfdb not called');
check('upload.js · redirects to results.html',       upload.includes('results.html?prediction_id'),         'redirect to results.html missing');
check('upload.js · showLoader called',               upload.includes('showLoader('),                         'showLoader not called');
check('upload.js · hideLoader called',               upload.includes('hideLoader('),                         'hideLoader not called');
check('upload.js · wireDropZone for drag-and-drop',  upload.includes('wireDropZone'),                       'wireDropZone missing');

// ── upload.html ───────────────────────────────────────────────────────────────
const uHtml = read('upload.html');
check('upload.html · <title> contains Upload ECG',        uHtml.includes('Upload ECG'),                      'title missing Upload ECG');
check('upload.html · id="app-shell"',                      uHtml.includes('id="app-shell"'),                  '#app-shell missing');
check('upload.html · id="nav-container"',                  uHtml.includes('id="nav-container"'),             '#nav-container missing');
check('upload.html · CSV mode button',                     uHtml.includes('data-mode="csv"'),                 'CSV mode button missing');
check('upload.html · WFDB mode button',                    uHtml.includes('data-mode="wfdb"'),                'WFDB mode button missing');
check('upload.html · id="panel-csv"',                      uHtml.includes('id="panel-csv"'),                  '#panel-csv missing');
check('upload.html · id="panel-wfdb"',                     uHtml.includes('id="panel-wfdb"'),                 '#panel-wfdb missing');
check('upload.html · id="drop-zone-csv"',                  uHtml.includes('id="drop-zone-csv"'),              '#drop-zone-csv missing');
check('upload.html · id="input-csv"',                      uHtml.includes('id="input-csv"'),                  '#input-csv missing');
check('upload.html · id="drop-zone-dat"',                  uHtml.includes('id="drop-zone-dat"'),              '#drop-zone-dat missing');
check('upload.html · id="input-dat"',                      uHtml.includes('id="input-dat"'),                  '#input-dat missing');
check('upload.html · id="drop-zone-hea"',                  uHtml.includes('id="drop-zone-hea"'),              '#drop-zone-hea missing');
check('upload.html · id="input-hea"',                      uHtml.includes('id="input-hea"'),                  '#input-hea missing');
check('upload.html · id="csv-file-info"',                  uHtml.includes('id="csv-file-info"'),              '#csv-file-info missing');
check('upload.html · id="dat-file-info"',                  uHtml.includes('id="dat-file-info"'),              '#dat-file-info missing');
check('upload.html · id="hea-file-info"',                  uHtml.includes('id="hea-file-info"'),              '#hea-file-info missing');
check('upload.html · id="error-csv"',                      uHtml.includes('id="error-csv"'),                  '#error-csv missing');
check('upload.html · id="error-dat"',                      uHtml.includes('id="error-dat"'),                  '#error-dat missing');
check('upload.html · id="error-hea"',                      uHtml.includes('id="error-hea"'),                  '#error-hea missing');
check('upload.html · id="error-wfdb-pair"',                uHtml.includes('id="error-wfdb-pair"'),            '#error-wfdb-pair missing');
check('upload.html · id="input-patient-id"',               uHtml.includes('id="input-patient-id"'),           '#input-patient-id missing');
check('upload.html · id="btn-submit-upload" disabled',     uHtml.includes('id="btn-submit-upload"') && uHtml.includes('disabled'), '#btn-submit-upload or disabled attr missing');
check('upload.html · imports initUploadPage',              uHtml.includes('initUploadPage'),                  'initUploadPage not called');
check('upload.html · imports injectNav',                   uHtml.includes('injectNav'),                       'injectNav not called');
check('upload.html · calls requireAuth',                   uHtml.includes('requireAuth'),                     'requireAuth not called');
check('upload.html · <meta description>',                  uHtml.includes('name="description"'),              'meta description missing');

// ── vendor/plotly.min.js ──────────────────────────────────────────────────────
check('plotly.min.js · file exists',                       exists('vendor/plotly.min.js'),                    'vendor/plotly.min.js not found');
if (exists('vendor/plotly.min.js')) {
  check('plotly.min.js · size > 1 MB (real download)',     sizeKB('vendor/plotly.min.js') > 1000,             `File too small (${sizeKB('vendor/plotly.min.js').toFixed(0)} KB) — may be incomplete`);
}

// ── js/waveform.js ────────────────────────────────────────────────────────────
const wf = read('js/waveform.js');
check('waveform.js · exports renderWaveform',              wf.includes('export function renderWaveform'),     'renderWaveform not exported');
check('waveform.js · exports destroyWaveform',             wf.includes('export function destroyWaveform'),    'destroyWaveform not exported');
check('waveform.js · imports CONFIG',                      wf.includes("from './config.js'"),                  'config.js not imported');
check('waveform.js · uses DISPLAY_POINTS_PER_LEAD',        wf.includes('DISPLAY_POINTS_PER_LEAD'),            'DISPLAY_POINTS_PER_LEAD not used');
check('waveform.js · downsampleSignal function',           wf.includes('function downsampleSignal'),          'downsampleSignal not defined');
check('waveform.js · calls Plotly.newPlot',                wf.includes('Plotly.newPlot'),                     'Plotly.newPlot not called');
check('waveform.js · calls Plotly.purge in destroyWaveform',wf.includes('Plotly.purge'),                     'Plotly.purge not called');
check('waveform.js · renderFallback on error',             wf.includes('renderFallback'),                     'renderFallback not defined');
check('waveform.js · guard against missing Plotly global', wf.includes("typeof Plotly"),                      'Plotly undefined guard missing');
check('waveform.js · ECG signal colour #2ea043',           wf.includes('#2ea043'),                            'ECG signal colour missing');
check('waveform.js · stacked leads (offset -i * 2)',       wf.includes('-i * 2'),                             'lead offset calculation missing');
check('waveform.js · try/catch around Plotly.newPlot',     wf.includes('try {') && wf.includes('Plotly.newPlot'), 'no try/catch around Plotly.newPlot');

// ── results.html ──────────────────────────────────────────────────────────────
const res = read('results.html');
check('results.html · <title> contains Results',           res.includes('Results'),                            'Results in title missing');
check('results.html · id="app-shell"',                     res.includes('id="app-shell"'),                    '#app-shell missing');
check('results.html · id="nav-container"',                 res.includes('id="nav-container"'),                '#nav-container missing');
check('results.html · id="waveform-container"',            res.includes('id="waveform-container"'),           '#waveform-container missing');
check('results.html · id="waveform-meta"',                 res.includes('id="waveform-meta"'),                '#waveform-meta missing');
check('results.html · id="primary-label"',                 res.includes('id="primary-label"'),                '#primary-label missing');
check('results.html · id="confidence"',                    res.includes('id="confidence"'),                   '#confidence missing');
check('results.html · id="confidence-bar-fill"',           res.includes('id="confidence-bar-fill"'),          '#confidence-bar-fill missing');
check('results.html · id="secondary-labels"',              res.includes('id="secondary-labels"'),             '#secondary-labels missing');
check('results.html · id="meta-prediction-id"',            res.includes('id="meta-prediction-id"'),           '#meta-prediction-id missing');
check('results.html · id="meta-patient-id"',               res.includes('id="meta-patient-id"'),              '#meta-patient-id missing');
check('results.html · id="meta-timestamp"',                res.includes('id="meta-timestamp"'),               '#meta-timestamp missing');
check('results.html · id="lead-tabs"',                     res.includes('id="lead-tabs"'),                    '#lead-tabs missing');
check('results.html · id="btn-back-dashboard"',            res.includes('id="btn-back-dashboard"'),           '#btn-back-dashboard missing');
check('results.html · id="result-status-badge"',           res.includes('id="result-status-badge"'),          '#result-status-badge missing');
check('results.html · loads plotly.min.js',                res.includes('plotly.min.js'),                     'plotly.min.js not loaded');
check('results.html · imports renderWaveform',             res.includes('renderWaveform'),                    'renderWaveform not imported');
check('results.html · calls API.getPrediction',            res.includes('API.getPrediction'),                 'API.getPrediction not called');
check('results.html · reads prediction_id query param',    res.includes('prediction_id'),                     'prediction_id param not read');
check('results.html · calls setState (currentPrediction)', res.includes('setState'),                          'setState not called');
check('results.html · calls requireAuth',                  res.includes('requireAuth'),                       'requireAuth not called');
check('results.html · calls injectNav',                    res.includes('injectNav'),                         'injectNav not called');
check('results.html · <meta description>',                 res.includes('name="description"'),                'meta description missing');
check('results.html · skeleton loading states',            res.includes('skeleton'),                          'skeleton loading state missing');

// ── styles.css has Sprint 3 CSS ───────────────────────────────────────────────
const css = read('css/styles.css');
check('styles.css · .upload-page class',                   css.includes('.upload-page'),                      '.upload-page missing');
check('styles.css · .drop-zone class',                     css.includes('.drop-zone'),                        '.drop-zone missing');
check('styles.css · .upload-mode-toggle class',            css.includes('.upload-mode-toggle'),               '.upload-mode-toggle missing');
check('styles.css · .waveform-section class',              css.includes('.waveform-section'),                 '.waveform-section missing');
check('styles.css · .waveform-container class',            css.includes('.waveform-container'),               '.waveform-container missing');
check('styles.css · .waveform-fallback class',             css.includes('.waveform-fallback'),                '.waveform-fallback missing');
check('styles.css · .results-layout class',                css.includes('.results-layout'),                   '.results-layout missing');
check('styles.css · .diagnosis-panel class',               css.includes('.diagnosis-panel'),                  '.diagnosis-panel missing');
check('styles.css · .confidence-bar class',                css.includes('.confidence-bar'),                   '.confidence-bar missing');
check('styles.css · .secondary-label class',               css.includes('.secondary-label'),                  '.secondary-label missing');
check('styles.css · .skeleton animation',                  css.includes('skeleton-shimmer'),                  '.skeleton animation missing');

// ── Print ─────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ECG Triage — Sprint 3 Static Check Results');
console.log('═══════════════════════════════════════════════════════════\n');

let currentFile = '';
let passed = 0, failed = 0;

for (const c of checks) {
  const [file] = c.name.split(' · ');
  if (file !== currentFile) { currentFile = file; console.log(`  ${file}`); }
  if (c.status === 'PASS') {
    passed++;
    console.log(`    ✓  ${c.name.split(' · ')[1]}`);
  } else {
    failed++;
    console.log(`    ✗  ${c.name.split(' · ')[1]}`);
    console.log(`       → ${c.reason}`);
  }
}

console.log('\n───────────────────────────────────────────────────────────');
const total = passed + failed;
if (failed === 0) {
  console.log(`  ✓ All ${total} checks passed`);
} else {
  console.log(`  ${passed}/${total} passed   |   ${failed} FAILED`);
}
console.log('───────────────────────────────────────────────────────────\n');

process.exit(failed > 0 ? 1 : 0);

/**
 * waveform.js
 * ECG Triage — Plotly Waveform Rendering
 *
 * Exposes:
 *   renderWaveform(containerId, waveformData)  — render stacked 12-lead ECG
 *   destroyWaveform(containerId)               — purge Plotly instance
 *
 * Plotly must be loaded as a global (via <script src="./vendor/plotly.min.js">)
 * BEFORE this module runs. Do not import Plotly as an ES module.
 *
 * Signal format assumed from mock-api / blueprint (Section 7):
 *   waveformData = {
 *     leads:          string[]    // e.g. ['I','II',...,'V6']
 *     signals:        number[][]  // [leadIndex][timeIndex] in mV
 *     sampling_rate:  number      // Hz
 *   }
 *
 * Sprint 3, Step 16 of 25.
 */

import { CONFIG } from './config.js';

// ─── Signal downsampling ──────────────────────────────────────────────────────

/**
 * Downsample a signal array to targetPoints using min-max decimation.
 * Preserves peak morphology (clinically critical) at the cost of exact
 * sample timing — acceptable for display purposes only.
 *
 * @param {number[]} signal
 * @param {number}   targetPoints
 * @returns {number[]}
 */
function downsampleSignal(signal, targetPoints) {
  if (signal.length <= targetPoints) return signal;
  const factor = Math.floor(signal.length / targetPoints);
  const result = [];
  for (let i = 0; i < targetPoints; i++) {
    const chunk = signal.slice(i * factor, (i + 1) * factor);
    // Keep the sample with the largest absolute value to preserve peaks
    result.push(chunk.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0));
  }
  return result;
}

// ─── Waveform rendering ───────────────────────────────────────────────────────

/**
 * Render a stacked multi-lead ECG waveform using Plotly.
 *
 * Each lead is a separate trace, offset vertically by 2 mV so they do not
 * overlap. Lead labels appear on the Y-axis tick marks.
 *
 * @param {string} containerId  ID of the DOM element to render into
 * @param {Object} waveformData  { leads, signals, sampling_rate }
 */
export function renderWaveform(containerId, waveformData) {
  // Guard: Plotly must be available as a global
  if (typeof Plotly === 'undefined') {
    renderFallback(containerId, 'Waveform library not loaded. Ensure plotly.min.js is included.');
    return;
  }

  if (!waveformData) {
    renderFallback(containerId, 'No waveform data available for this recording.');
    return;
  }

  const { leads, signals, sampling_rate } = waveformData;

  if (!leads || !signals || leads.length !== signals.length) {
    renderFallback(containerId, 'Waveform data is incomplete or malformed.');
    return;
  }

  const targetPoints = CONFIG.DISPLAY_POINTS_PER_LEAD;
  const timeAxis     = Array.from(
    { length: targetPoints },
    (_, i) => i / (sampling_rate || 500)
  );

  // Each lead is offset downward by 2 mV to create the stacked view
  const traces = leads.map((leadLabel, i) => {
    const raw    = signals[i] || [];
    const signal = downsampleSignal(raw, targetPoints);
    const offset = -i * 2;

    return {
      x: timeAxis,
      y: signal.map(v => v + offset),
      customdata: signal,                 // used in hovertemplate for raw mV
      type: 'scatter',
      mode: 'lines',
      name: leadLabel,
      line: {
        width: 1.2,
        color: '#2ea043',                 // --color-ecg-signal
      },
      hovertemplate:
        `<b>${leadLabel}</b><br>` +
        `t: %{x:.3f}s<br>` +
        `mV: %{customdata:.3f}<extra></extra>`,
    };
  });

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor:  '#0d1117',              // --color-bg
    font: {
      color:  '#8b949e',                   // --color-text-secondary
      family: 'IBM Plex Mono, monospace',
      size:   11,
    },
    margin: { t: 20, b: 40, l: 60, r: 20 },
    height: leads.length * 80 + 60,
    xaxis: {
      title:     'Time (s)',
      color:     '#30363d',
      gridcolor: '#21262d',
      zeroline:  false,
      tickfont:  { size: 10 },
    },
    yaxis: {
      tickvals:  leads.map((_, i) => -i * 2),
      ticktext:  leads,
      color:     '#30363d',
      gridcolor: '#21262d',
      zeroline:  false,
      tickfont:  { size: 10, family: 'IBM Plex Mono, monospace' },
    },
    showlegend:  false,
    hovermode:   'x unified',
    dragmode:    'pan',
  };

  const config = {
    responsive:              true,
    displayModeBar:          true,
    modeBarButtonsToRemove:  ['select2d', 'lasso2d', 'autoScale2d'],
    displaylogo:             false,
    scrollZoom:              true,
  };

  try {
    // eslint-disable-next-line no-undef
    Plotly.newPlot(containerId, traces, layout, config);
  } catch (err) {
    console.error('[waveform] Plotly.newPlot failed:', err);
    renderFallback(
      containerId,
      'Waveform rendering failed. Raw data is available for download.'
    );
  }
}

// ─── Destroy ──────────────────────────────────────────────────────────────────

/**
 * Purge the Plotly instance in a container (call before re-rendering to avoid
 * memory leaks on the patient history page where the waveform reloads).
 *
 * @param {string} containerId
 */
export function destroyWaveform(containerId) {
  if (typeof Plotly === 'undefined') return;
  const el = document.getElementById(containerId);
  // _fullLayout is set by Plotly on elements it has rendered into
  if (el && el._fullLayout) {
    // eslint-disable-next-line no-undef
    Plotly.purge(containerId);
  }
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

/**
 * Render a user-friendly error message inside the waveform container.
 * Used when Plotly is unavailable or data is malformed.
 *
 * @param {string} containerId
 * @param {string} message
 */
function renderFallback(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="waveform-fallback">
      <span class="icon-warning">⚠</span>
      <p>${message}</p>
    </div>
  `;
}

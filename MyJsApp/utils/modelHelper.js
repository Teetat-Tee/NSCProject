// ============================================================
// modelHelper.js — OSA Detection Engine
// ใช้ @tensorflow/tfjs (pure JS) + DSP fallback
// ไม่ใช้ tfjs-react-native เพราะ incompatible กับ Expo SDK 55
// ============================================================

import * as tf from '@tensorflow/tfjs';

// ============================================================
// Preprocessing config (ต้อง match กับ Colab notebook)
// ============================================================
export const SAMPLE_RATE     = 16000;
export const CLIP_DURATION   = 30.0;
export const N_MELS          = 64;
export const HOP_LENGTH      = 512;
export const N_FFT           = 1024;
export const SAMPLE_INTERVAL = 200;

const CLASS_NORMAL  = 0;
const CLASS_SNORING = 1;
const CLASS_APNEA   = 2;

export const AHI_NORMAL   = 5;
export const AHI_MILD     = 15;
export const AHI_MODERATE = 30;

// ============================================================
// TF Model state
// ============================================================
let _model     = null;
let _modelReady = false;

// ============================================================
// โหลด model จาก osa_model_bundle.json (pure JS — ไม่ต้องใช้ native module)
// ============================================================
export async function loadOSAModel() {
  if (_modelReady) return true;

  try {
    await tf.ready();
    console.log('TF version:', tf.version.tfjs);
    console.log('TF backend:', tf.getBackend());

    const bundle      = require('../assets/models/osa_model_bundle.json');
    const modelJson   = bundle.modelJson;
    const weightSpecs = modelJson.weightsManifest[0].weights;

    // decode base64 → Uint8Array โดยใช้ DataView
    // หลีกเลี่ยง ArrayBuffer.isView / isTypedArray bug บน Hermes
    const b64    = bundle.weightsB64;
    const binary = atob(b64);
    const len    = binary.length;
    const buffer = new ArrayBuffer(len);
    const view   = new DataView(buffer);
    for (let i = 0; i < len; i++) {
      view.setUint8(i, binary.charCodeAt(i));
    }

    console.log('weightSpecs:', weightSpecs.length);
    console.log('buffer:', len, 'bytes');

    // custom IOHandler ที่ return buffer โดยตรง
    const ioHandler = {
      load: async () => ({
        modelTopology: modelJson.modelTopology,
        weightSpecs,
        weightData:    buffer,
        format:        modelJson.format      ?? 'graph-model',
        generatedBy:   modelJson.generatedBy ?? '',
        convertedBy:   modelJson.convertedBy ?? '',
        signature:     modelJson.signature   ?? null,
      }),
    };

    _model      = await tf.loadGraphModel(ioHandler);
    _modelReady = true;
    console.log('✅ โหลด model สำเร็จ');
    return true;
  } catch (err) {
    console.error('❌ โหลด model ไม่สำเร็จ:', err.message);
    console.error('Stack:', err.stack?.slice(0, 500));
    return false;
  }
}

// ============================================================
// Log-Mel Spectrogram (pure JS)
// ============================================================
function hannWindow(n) {
  return 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N_FFT - 1)));
}

function computePowerSpectrum(frame) {
  const N    = frame.length;
  const half = Math.floor(N / 2) + 1;
  const power = new Float32Array(half);

  for (let k = 0; k < half; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += frame[n] * Math.cos(angle);
      im -= frame[n] * Math.sin(angle);
    }
    power[k] = re * re + im * im;
  }
  return power;
}

function buildMelFilterbank(nMels, nFft, sr) {
  const hzToMel  = (hz) => 2595 * Math.log10(1 + hz / 700);
  const melToHz  = (mel) => 700 * (Math.pow(10, mel / 2595) - 1);
  const melMin   = hzToMel(0);
  const melMax   = hzToMel(sr / 2);
  const melPts   = Array.from({ length: nMels + 2 }, (_, i) =>
    melToHz(melMin + (i / (nMels + 1)) * (melMax - melMin))
  );
  const fftFreqs = Array.from({ length: Math.floor(nFft / 2) + 1 }, (_, i) =>
    (i * sr) / nFft
  );

  return Array.from({ length: nMels }, (_, m) => {
    const filter = new Float32Array(fftFreqs.length);
    for (let k = 0; k < fftFreqs.length; k++) {
      const f = fftFreqs[k];
      if (f >= melPts[m] && f <= melPts[m + 1]) {
        filter[k] = (f - melPts[m]) / (melPts[m + 1] - melPts[m]);
      } else if (f > melPts[m + 1] && f <= melPts[m + 2]) {
        filter[k] = (melPts[m + 2] - f) / (melPts[m + 2] - melPts[m + 1]);
      }
    }
    return filter;
  });
}

export function computeLogMelSpectrogram(audioSamples) {
  const filters  = buildMelFilterbank(N_MELS, N_FFT, SAMPLE_RATE);
  const nFrames  = Math.floor((audioSamples.length - N_FFT) / HOP_LENGTH) + 1;
  const spectrogram = [];

  for (let t = 0; t < nFrames; t++) {
    const start = t * HOP_LENGTH;
    const frame = new Float32Array(N_FFT);
    for (let i = 0; i < N_FFT && start + i < audioSamples.length; i++) {
      frame[i] = audioSamples[start + i] * hannWindow(i);
    }

    const power   = computePowerSpectrum(frame);
    const melFrame = new Float32Array(N_MELS);
    for (let m = 0; m < N_MELS; m++) {
      let sum = 0;
      for (let k = 0; k < power.length; k++) {
        sum += filters[m][k] * power[k];
      }
      melFrame[m] = Math.log(Math.max(sum, 1e-10));
    }
    spectrogram.push(melFrame);
  }
  return spectrogram;
}

// ============================================================
// AI Inference
// ============================================================
export async function inferAudio(audioSamples) {
  if (!_modelReady || !_model) return null;

  try {
    const spec    = computeLogMelSpectrogram(audioSamples);
    const nFrames = spec.length;

    // สร้าง input [1, 1, N_MELS, nFrames]
    const inputData = new Float32Array(N_MELS * nFrames);
    for (let t = 0; t < nFrames; t++) {
      for (let m = 0; m < N_MELS; m++) {
        inputData[m * nFrames + t] = spec[t][m];
      }
    }

    // Normalize [0, 1]
    let min = Infinity, max = -Infinity;
    for (const v of inputData) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min + 1e-8;
    for (let i = 0; i < inputData.length; i++) {
      inputData[i] = (inputData[i] - min) / range;
    }

    const inputTensor  = tf.tensor4d(inputData, [1, 1, N_MELS, nFrames]);
    const outputTensor = _model.predict(inputTensor);
    const logits       = await outputTensor.data();

    inputTensor.dispose();
    outputTensor.dispose();

    // Softmax
    const expLogits = Array.from(logits).map(Math.exp);
    const sumExp    = expLogits.reduce((a, b) => a + b, 0);
    const probs     = expLogits.map(v => v / sumExp);

    return {
      normal:    probs[CLASS_NORMAL],
      snoring:   probs[CLASS_SNORING],
      apnea:     probs[CLASS_APNEA],
      predicted: probs.indexOf(Math.max(...probs)),
    };
  } catch (err) {
    console.error('Inference error:', err);
    return null;
  }
}

// ============================================================
// AHI Calculation
// ============================================================
export function calculateAHI(apneaCount, durationSeconds) {
  if (durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  return Math.round((apneaCount / hours) * 10) / 10;
}

export function classifyRisk(ahi) {
  const num = Number(ahi);
  if (num < AHI_NORMAL)   return { label: 'ปกติ',    color: '#4F9D69' };
  if (num < AHI_MILD)     return { label: 'เล็กน้อย', color: '#D6A23C' };
  if (num < AHI_MODERATE) return { label: 'ปานกลาง', color: '#D17A3D' };
  return                          { label: 'รุนแรง',  color: '#C1564E' };
}

// ============================================================
// DSP Fallback — ใช้เมื่อ AI model โหลดไม่ได้
// ============================================================
const CALIBRATION_DURATION = 8;

export class CalibrationEngine {
  constructor() {
    this._samples   = [];
    this._startTime = Date.now();
  }

  addSample(db) { this._samples.push(db); }

  progress() {
    const elapsed = (Date.now() - this._startTime) / 1000;
    return Math.min(elapsed / CALIBRATION_DURATION, 1.0);
  }

  isDone() { return this.progress() >= 1.0; }

  finalize() {
    const sorted = [...this._samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? -50;
    const p20    = sorted[Math.floor(sorted.length * 0.2)] ?? median;
    return {
      baseline:         median,
      noiseFloor:       p20,
      snoreThreshold:   median + 12,
      loudThreshold:    median + 20,
      silenceThreshold: median + 4,
    };
  }
}

export class OSADetector {
  constructor(calibration, onEvent) {
    this._cal       = calibration;
    this._onEvent   = onEvent;
    this._state     = 'QUIET';
    this._loudStart      = null;
    this._silentStart    = null;
    this._loudBeforeSilence = 0;
    this._startTime = Date.now();
  }

  _now() { return (Date.now() - this._startTime) / 1000; }

  _formatTime(sec) {
    const absTime = new Date(this._startTime + sec * 1000);
    const h = String(absTime.getHours()).padStart(2, '0');
    const m = String(absTime.getMinutes()).padStart(2, '0');
    const s = String(absTime.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  addSample(db) {
    const { snoreThreshold, loudThreshold, silenceThreshold } = this._cal;
    const t = this._now();

    if (db >= loudThreshold) {
      if (this._state === 'SILENT_GAP') {
        const silentDuration = t - (this._silentStart ?? t);
        if (silentDuration >= 8 && this._loudBeforeSilence >= 3) {
          this._onEvent({
            type: 'apnea',
            time: this._formatTime(this._silentStart),
            msg:  `⚠️ หยุดหายใจ ${silentDuration.toFixed(0)}วิ`,
          });
        }
      }
      if (this._state !== 'LOUD') this._loudStart = t;
      this._state       = 'LOUD';
      this._silentStart = null;

    } else if (db < silenceThreshold) {
      if (this._state === 'LOUD') {
        this._loudBeforeSilence = t - (this._loudStart ?? t);
        this._silentStart       = t;
        this._state             = 'SILENT_GAP';
      }

    } else if (db >= snoreThreshold) {
      if (this._state === 'QUIET') {
        this._loudStart = t;
        this._state     = 'LOUD';
      }
      if (this._state === 'SILENT_GAP') {
        this._state       = 'QUIET';
        this._silentStart = null;
      }
      if (this._state === 'LOUD') {
        const loudDuration = t - (this._loudStart ?? t);
        if (loudDuration >= 1.5) {
          this._onEvent({
            type: 'snore',
            time: this._formatTime(this._loudStart),
            msg:  '🔊 เสียงกรน',
          });
          this._loudStart = t;
        }
      }
    } else {
      if (this._state !== 'SILENT_GAP') this._state = 'QUIET';
    }
  }

  flush() {}
}
// utils/modelHelper.js
import * as tflite from '@tensorflow/tfjs-tflite';
import { Asset } from 'expo-asset';

let model = null;

export async function loadModel() {
  if (model) return model;

  // โหลดไฟล์ .tflite จาก assets
  const asset = Asset.fromModule(require('../assets/snore_classifier.tflite'));
  await asset.downloadAsync();

  model = await tflite.loadTFLiteModel(asset.localUri);
  console.log('TFLite model loaded!');
  return model;
}

export async function analyzeChunk(wavUri) {
  try {
    const m = await loadModel();

    // อ่านไฟล์ WAV
    const response = await fetch(wavUri);
    const arrayBuffer = await response.arrayBuffer();

    // ข้าม WAV header 44 bytes แปลงเป็น float32
    const int16 = new Int16Array(arrayBuffer, 44);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // ตัดให้เหลือ 16000 samples (1 วินาที)
    const input = float32.slice(0, 16000);
    const padded = new Float32Array(16000);
    padded.set(input);

    // สร้าง tensor และยิง model
    const inputTensor = tflite.input(padded, [1, 16000]);
    const output = m.predict(inputTensor);
    const probs = output.dataSync();

    // probs = [p_not_snoring, p_snoring]
    const label = probs[1] > probs[0] ? 'snore' : 'normal';
    const confidence = Math.max(...probs);

    return { label, confidence, probabilities: Array.from(probs) };

  } catch (err) {
    console.error('analyzeChunk error:', err);
    // fallback mock ถ้า error
    return { label: 'normal', confidence: 0.5, probabilities: [0.5, 0.5] };
  }
}
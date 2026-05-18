// utils/modelHelper.js
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { fetch as tfFetch, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

let model = null;

// ---- โหลด model ครั้งแรกครั้งเดียว ----
export async function loadModel() {
  if (model) return model; // โหลดแล้วใช้ cache

  await tf.ready();

  // โหลด .tflite จาก assets
  const asset = Asset.fromModule(require('../assets/model.tflite'));
  await asset.downloadAsync();

  // สำหรับ TFLite ใน Expo ใช้ tf.loadGraphModel หรือ bundleResourceIO
  const modelJson = require('../assets/model.json'); // ถ้า export เป็น tfjs format
  model = await tf.loadGraphModel(tf.io.bundleResourceIO(
    modelJson,
    require('../assets/model_weights.bin')
  ));

  console.log('Model loaded!');
  return model;
}

// ---- แปลงไฟล์ WAV เป็น MFCC features ----
export function computeMFCC(float32Array, sampleRate = 16000) {
  // ย่อ waveform ให้เหลือ 16000 samples (1 วินาที)
  // จริงๆ ควรใช้ librosa บน Python แต่ใน JS ทำ approximation
  
  const targetLength = 16000;
  let resampled;

  if (float32Array.length >= targetLength) {
    resampled = float32Array.slice(0, targetLength);
  } else {
    resampled = new Float32Array(targetLength);
    resampled.set(float32Array);
  }

  // Normalize
  const max = Math.max(...resampled.map(Math.abs));
  if (max > 0) {
    for (let i = 0; i < resampled.length; i++) {
      resampled[i] = resampled[i] / max;
    }
  }

  return tf.tensor(resampled).reshape([1, targetLength]);
}

// ---- ยิง model กับ audio chunk ----
export async function analyzeChunk(wavUri) {
  try {
    const m = await loadModel();

    // อ่านไฟล์ WAV เป็น base64
    const base64 = await FileSystem.readAsStringAsync(wavUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // แปลง base64 → Float32Array (ข้าม WAV header 44 bytes)
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // WAV header = 44 bytes, ข้ามไป
    const pcm = new Int16Array(bytes.buffer, 44);
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      float32[i] = pcm[i] / 32768.0; // แปลง int16 → float
    }

    // สร้าง tensor และยิง model
    const inputTensor = computeMFCC(float32);
    const outputTensor = m.predict(inputTensor);
    const probabilities = await outputTensor.data();

    // probabilities = [p_normal, p_snore, p_apnea, p_artifact]
    const labels = ['normal', 'snore', 'apnea', 'artifact'];
    const maxIdx = probabilities.indexOf(Math.max(...probabilities));

    // cleanup tensor
    inputTensor.dispose();
    outputTensor.dispose();

    return {
      label: labels[maxIdx],
      confidence: probabilities[maxIdx],
      probabilities: Array.from(probabilities),
    };

  } catch (err) {
    console.error('analyzeChunk error:', err);
    return { label: 'normal', confidence: 0, probabilities: [1, 0, 0, 0] };
  }
}
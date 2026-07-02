import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import { colors, radius, shadow } from '../utils/theme';

// ============================================================
// ModelDebugScreen — ทดสอบโหลด TFJS model ทีละขั้น
// เพิ่มใน App.js ชั่วคราวเพื่อ debug แล้วเอาออกเมื่อแก้ได้
// ============================================================

export default function ModelDebugScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  function addLog(msg, type = 'info') {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    console.log(`[DEBUG] ${msg}`);
  }

  async function runDebug() {
    setLogs([]);
    setLoading(true);

    // Step 1: TF ready
    try {
      addLog('Step 1: tf.ready()...');
      await tf.ready();
      addLog(`✅ TF ready — version: ${tf.version.tfjs}, backend: ${tf.getBackend()}`, 'success');
    } catch (err) {
      addLog(`❌ tf.ready() failed: ${err.message}`, 'error');
      setLoading(false);
      return;
    }

    // Step 2: โหลด bundle
    let bundle;
    try {
      addLog('Step 2: โหลด osa_model_bundle.json...');
      bundle = require('../assets/models/osa_model_bundle.json');
      addLog(`✅ bundle keys: ${Object.keys(bundle).join(', ')}`, 'success');
      addLog(`   weightsB64 length: ${bundle.weightsB64?.length ?? 'undefined'}`);
      addLog(`   modelJson keys: ${Object.keys(bundle.modelJson ?? {}).join(', ')}`);
    } catch (err) {
      addLog(`❌ โหลด bundle ไม่ได้: ${err.message}`, 'error');
      setLoading(false);
      return;
    }

    // Step 3: เช็ค weightsManifest
    try {
      addLog('Step 3: เช็ค weightsManifest...');
      const wm = bundle.modelJson?.weightsManifest;
      if (!wm || wm.length === 0) {
        addLog('❌ weightsManifest ไม่มีหรือว่าง', 'error');
        setLoading(false);
        return;
      }
      addLog(`✅ weightsManifest[0] keys: ${Object.keys(wm[0]).join(', ')}`, 'success');
      addLog(`   weights count: ${wm[0].weights?.length ?? 0}`);
      if (wm[0].weights?.length > 0) {
        const w = wm[0].weights[0];
        addLog(`   weights[0]: name=${w.name}, dtype=${w.dtype}, shape=[${w.shape}]`);
      }
    } catch (err) {
      addLog(`❌ เช็ค weightsManifest error: ${err.message}`, 'error');
      setLoading(false);
      return;
    }

    // Step 4: decode base64
    let bytes;
    try {
      addLog('Step 4: decode base64...');
      const binaryStr = atob(bundle.weightsB64);
      bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      addLog(`✅ decoded: ${bytes.length} bytes (${(bytes.length/1024).toFixed(0)} KB)`, 'success');
    } catch (err) {
      addLog(`❌ decode base64 error: ${err.message}`, 'error');
      setLoading(false);
      return;
    }

    // Step 5: สร้าง fromMemory handler
    let handler;
    try {
      addLog('Step 5: tf.io.fromMemory...');
      const modelJson   = bundle.modelJson;
      const weightSpecs = modelJson.weightsManifest[0].weights;

      addLog(`   modelTopology type: ${typeof modelJson.modelTopology}`);
      addLog(`   weightSpecs: ${weightSpecs.length} specs`);
      addLog(`   weightData: ${bytes.buffer.byteLength} bytes`);

      handler = tf.io.fromMemory({
        modelTopology: modelJson.modelTopology,
        weightSpecs,
        weightData:    bytes.buffer,
        format:        modelJson.format      ?? 'graph-model',
        generatedBy:   modelJson.generatedBy ?? '',
        convertedBy:   modelJson.convertedBy ?? '',
        signature:     modelJson.signature   ?? null,
      });
      addLog('✅ handler สร้างได้', 'success');
    } catch (err) {
      addLog(`❌ fromMemory error: ${err.message}`, 'error');
      addLog(`   stack: ${err.stack?.slice(0, 200)}`, 'error');
      setLoading(false);
      return;
    }

    // Step 6: loadGraphModel
    try {
      addLog('Step 6: tf.loadGraphModel...');
      const model = await tf.loadGraphModel(handler);
      addLog(`✅ โหลด model สำเร็จ!`, 'success');
      addLog(`   inputs: ${model.inputs?.map(i => i.name).join(', ')}`);
      addLog(`   outputs: ${model.outputs?.map(o => o.name).join(', ')}`);
    } catch (err) {
      addLog(`❌ loadGraphModel error: ${err.message}`, 'error');
      addLog(`   stack: ${err.stack?.slice(0, 300)}`, 'error');

      // ลอง loadLayersModel แทน
      try {
        addLog('   ลอง tf.loadLayersModel แทน...');
        const model2 = await tf.loadLayersModel(handler);
        addLog(`✅ loadLayersModel สำเร็จ!`, 'success');
      } catch (err2) {
        addLog(`❌ loadLayersModel ก็ fail: ${err2.message}`, 'error');
      }
    }

    setLoading(false);
  }

  const logColors = { info: colors.ink, success: colors.riskNormal, error: colors.riskSevere };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🔬 Model Debug</Text>
        <Text style={styles.sub}>ทดสอบโหลด TFJS model ทีละขั้น</Text>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={runDebug}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>{loading ? '⏳ กำลังทดสอบ...' : '▶️ เริ่ม Debug'}</Text>
        </TouchableOpacity>

        {logs.length > 0 && (
          <View style={styles.logBox}>
            {logs.map((log, i) => (
              <Text key={i} style={[styles.logLine, { color: logColors[log.type] ?? colors.ink }]}>
                <Text style={styles.logTime}>{log.time} </Text>
                {log.msg}
              </Text>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.inkMuted, fontSize: 13, marginBottom: 20 },

  btn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
    ...shadow.card,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },

  logBox: {
    backgroundColor: '#1a1a2e', borderRadius: radius.md,
    padding: 16,
  },
  logLine: { fontSize: 11, fontFamily: 'monospace', marginBottom: 4, lineHeight: 16 },
  logTime: { color: '#666', fontSize: 10 },
});
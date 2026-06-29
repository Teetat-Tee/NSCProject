import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ResultExportScreen({ route, navigation }) {
  const {
    riskLevel = 'ไม่ทราบข้อมูล',
    ahiValue = 0,
    sleepDuration = '0 ชม. 0 น.',
    apneaCount = 0,
    snoreCount = 0,
    events = [],
  } = route.params || {};

  // FIX 1: Safely handle events — ensure it's always an array
  const safeEvents = Array.isArray(events) ? events : [];

  const generateHTML = () => {
    // FIX 2: Guard against undefined fields in each event
    const eventsRows = safeEvents.length > 0
      ? safeEvents.map(ev => {
          const color =
            ev.type === 'apnea' ? '#ef4444' :
            ev.type === 'snore' ? '#f59e0b' : '#38bdf8';
          return `
            <tr>
              <td style="text-align: center; padding: 10px; border: 1px solid #cbd5e1;">${ev.time || '-'}</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: ${color}; font-weight: bold;">${ev.msg || '-'}</td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="2" style="text-align:center; padding:16px; color:#94a3b8; border:1px solid #cbd5e1;">ไม่มีเหตุการณ์ที่บันทึกไว้</td></tr>`;

    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const riskColor =
      Number(ahiValue) >= 30 ? '#ef4444' :
      Number(ahiValue) >= 15 ? '#f97316' : '#f59e0b';

    // FIX 3: Use Google Fonts (Sarabun) for Thai character support
    // FIX 4: Replace display:flex rows with HTML <table> layout for reliable PDF rendering
    return `
      <html>
        <head>
          <meta charset="UTF-8"/>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
          <style>
            body {
              font-family: 'Sarabun', 'Arial Unicode MS', Arial, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.7;
              font-size: 14px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 28px;
            }
            .title { font-size: 26px; color: #0f172a; font-weight: bold; margin: 0; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 6px; }

            /* FIX 4: Use table for two-column layout instead of flexbox */
            .info-box {
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 28px;
            }
            .info-table { width: 100%; border-collapse: collapse; border: none; }
            .info-table td { border: none; padding: 10px 8px; vertical-align: top; width: 50%; }
            .stat-title { font-size: 13px; color: #64748b; margin-bottom: 4px; }
            .stat-value { font-size: 17px; font-weight: bold; color: #0f172a; }
            .highlight { color: #ef4444; font-size: 22px; }

            h3 { color: #0f172a; margin-bottom: 10px; }

            /* Event timeline table */
            .event-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            .event-table th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: bold;
              text-align: center;
              padding: 10px;
              border: 1px solid #cbd5e1;
            }

            .footer {
              margin-top: 50px;
              font-size: 12px;
              color: #94a3b8;
              text-align: center;
              font-style: italic;
              border-top: 1px solid #e2e8f0;
              padding-top: 18px;
              line-height: 1.8;
            }
          </style>
        </head>
        <body>

          <div class="header">
            <h1 class="title">รายงานผลการคัดกรองการนอนหลับ</h1>
            <p class="subtitle">OSA-Detect Application (ฉบับประเมินความเสี่ยงเบื้องต้น)</p>
          </div>

          <div class="info-box">
            <table class="info-table">
              <tr>
                <td>
                  <div class="stat-title">วันที่ตรวจประเมิน</div>
                  <div class="stat-value">${today}</div>
                </td>
                <td>
                  <div class="stat-title">ระยะเวลาการนอนหลับ</div>
                  <div class="stat-value">${sleepDuration}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="stat-title">ค่าดัชนีการหยุดหายใจ (Pseudo-AHI)</div>
                  <div class="stat-value highlight">${ahiValue} <span style="font-size:13px; color:#333;">ครั้ง/ชั่วโมง</span></div>
                </td>
                <td>
                  <div class="stat-title">ระดับความเสี่ยง (Risk Level)</div>
                  <div class="stat-value" style="color: ${riskColor};">${riskLevel}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="stat-title">จำนวนภาวะหยุดหายใจที่ตรวจพบ</div>
                  <div class="stat-value" style="color: #ef4444;">${apneaCount} ครั้ง</div>
                </td>
                <td>
                  <div class="stat-title">จำนวนเสียงกรนที่ตรวจพบ</div>
                  <div class="stat-value" style="color: #f59e0b;">${snoreCount} ครั้ง</div>
                </td>
              </tr>
            </table>
          </div>

          <h3>ประวัติและไทม์ไลน์ความผิดปกติ (Event Timeline)</h3>
          <table class="event-table">
            <thead>
              <tr>
                <th style="width: 30%;">เวลา (Time)</th>
                <th style="width: 70%;">เหตุการณ์ (Event / Details)</th>
              </tr>
            </thead>
            <tbody>
              ${eventsRows}
            </tbody>
          </table>

          <div class="footer">
            * เอกสารฉบับนี้ถูกสร้างขึ้นโดยระบบประมวลผลสัญญาณ (DSP) จากแอปพลิเคชัน OSA-Detect<br/>
            ผลการวิเคราะห์นี้ใช้สำหรับการคัดกรองเบื้องต้นเท่านั้น ไม่สามารถใช้ทดแทนการวินิจฉัยทางการแพทย์โดยแพทย์ผู้เชี่ยวชาญได้<br/>
            หากท่านมีความเสี่ยงระดับปานกลาง-สูง โปรดนำรายงานฉบับนี้ไปปรึกษาแพทย์เฉพาะทาง
          </div>

        </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({
        html: generateHTML(),
        base64: false,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('แจ้งเตือน', 'อุปกรณ์ของคุณไม่รองรับฟังก์ชันการแชร์');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'ส่งออกรายงาน OSA-Detect (PDF)',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถสร้างไฟล์ PDF ได้\n${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>📄</Text>
        <Text style={styles.title}>ข้อมูลพร้อมส่งออก</Text>
        <Text style={styles.subtitle}>
          รายงานของคุณจะถูกจัดทำในรูปแบบเอกสาร PDF อย่างเป็นทางการ
          พร้อมตารางสรุปผลและไทม์ไลน์โดยละเอียด
        </Text>

        {/* Preview summary before export */}
        <View style={styles.previewBox}>
          <Text style={styles.previewRow}>🛏️ ระยะเวลา: <Text style={styles.previewVal}>{sleepDuration}</Text></Text>
          <Text style={styles.previewRow}>📊 AHI: <Text style={styles.previewVal}>{ahiValue} ครั้ง/ชม.</Text></Text>
          <Text style={styles.previewRow}>⚠️ หยุดหายใจ: <Text style={styles.previewVal}>{apneaCount} ครั้ง</Text></Text>
          <Text style={styles.previewRow}>🔊 เสียงกรน: <Text style={styles.previewVal}>{snoreCount} ครั้ง</Text></Text>
          <Text style={styles.previewRow}>📋 เหตุการณ์: <Text style={styles.previewVal}>{safeEvents.length} รายการ</Text></Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
          <Text style={styles.exportBtnText}>สร้างไฟล์ PDF และแชร์</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>ย้อนกลับ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  icon: { fontSize: 50, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 10 },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  previewBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    marginBottom: 24,
    gap: 6,
  },
  previewRow: { color: '#64748b', fontSize: 13 },
  previewVal: { color: '#f1f5f9', fontWeight: '600' },
  exportBtn: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  exportBtnText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
  backBtn: { paddingVertical: 10 },
  backBtnText: { color: '#64748b', fontSize: 16 },
});
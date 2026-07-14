import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, radius, shadow } from '../utils/theme';

export default function ResultExportScreen({ route, navigation }) {
  const {
    ahi        = 0,
    riskLabel  = 'ไม่ทราบ',
    duration   = 0,       // หน่วยวินาที
    events     = [],
    wellnessPct = 0,
  } = route.params || {};

  const safeEvents  = Array.isArray(events) ? events : [];
  const apneaCount  = safeEvents.filter(e => e.type === 'apnea').length;
  const hours       = Math.floor(duration / 3600);
  const mins        = Math.floor((duration % 3600) / 60);
  const sleepDuration = `${hours} ชม. ${mins} น.`;

  const riskColor =
    riskLabel === 'รุนแรง'  ? '#C1564E' :
    riskLabel === 'ปานกลาง' ? '#D17A3D' :
    riskLabel === 'เล็กน้อย' ? '#D6A23C' : '#4F9D69';

  const generateHTML = () => {
    const eventsRows = safeEvents.length > 0
      ? safeEvents.map(ev => `
          <tr>
            <td style="text-align:center;padding:10px;border:1px solid #E8E2D5;">${ev.time ?? ev.time_str ?? '-'}</td>
            <td style="padding:10px;border:1px solid #E8E2D5;color:#C1564E;font-weight:bold;">${ev.msg || '-'}</td>
          </tr>`).join('')
      : `<tr><td colspan="2" style="text-align:center;padding:16px;color:#A4A29C;border:1px solid #E8E2D5;">ไม่มีเหตุการณ์ที่บันทึกไว้</td></tr>`;

    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    return `
      <html>
        <head>
          <meta charset="UTF-8"/>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet"/>
          <style>
            body { font-family:'Sarabun','Arial Unicode MS',Arial,sans-serif; padding:40px; color:#2B2B2E; line-height:1.7; font-size:14px; background:#FAF8F4; }
            .header { text-align:center; border-bottom:3px solid #5B7FA6; padding-bottom:12px; margin-bottom:28px; }
            .title { font-size:26px; color:#2B2B2E; font-weight:bold; margin:0; }
            .subtitle { font-size:14px; color:#6B6B70; margin-top:6px; }
            .info-box { background:#FFFFFF; padding:20px; border-radius:12px; border:1px solid #E8E2D5; margin-bottom:28px; }
            .info-table { width:100%; border-collapse:collapse; border:none; }
            .info-table td { border:none; padding:10px 8px; vertical-align:top; width:50%; }
            .stat-title { font-size:13px; color:#6B6B70; margin-bottom:4px; }
            .stat-value { font-size:17px; font-weight:bold; color:#2B2B2E; }
            .highlight { color:#C1564E; font-size:22px; }
            h3 { color:#2B2B2E; margin-bottom:10px; }
            .event-table { width:100%; border-collapse:collapse; margin-top:6px; }
            .event-table th { background:#F1EDE4; color:#6B6B70; font-weight:bold; text-align:center; padding:10px; border:1px solid #E8E2D5; }
            .footer { margin-top:50px; font-size:12px; color:#A4A29C; text-align:center; font-style:italic; border-top:1px solid #E8E2D5; padding-top:18px; line-height:1.8; }
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
                  <div class="stat-title">ค่าดัชนีการหยุดหายใจ (AHI)</div>
                  <div class="stat-value highlight">${ahi} <span style="font-size:13px;color:#2B2B2E;">ครั้ง/ชั่วโมง</span></div>
                </td>
                <td>
                  <div class="stat-title">ระดับความเสี่ยง</div>
                  <div class="stat-value" style="color:${riskColor};">${riskLabel}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="stat-title">จำนวนภาวะหยุดหายใจที่ตรวจพบ</div>
                  <div class="stat-value" style="color:#C1564E;">${apneaCount} ครั้ง</div>
                </td>
                ${wellnessPct > 0 ? `
                <td>
                  <div class="stat-title">คะแนนความสดชื่นหลังตื่นนอน</div>
                  <div class="stat-value" style="color:#5B7FA6;">${wellnessPct}%</div>
                </td>` : '<td></td>'}
              </tr>
            </table>
          </div>

          <h3>ไทม์ไลน์ความผิดปกติ (Event Timeline)</h3>
          <table class="event-table">
            <thead>
              <tr>
                <th style="width:30%;">เวลา</th>
                <th style="width:70%;">เหตุการณ์</th>
              </tr>
            </thead>
            <tbody>${eventsRows}</tbody>
          </table>

          <div class="footer">
            * เอกสารฉบับนี้ถูกสร้างขึ้นโดยระบบ AI จากแอปพลิเคชัน OSA-Detect<br/>
            ผลการวิเคราะห์นี้ใช้สำหรับการคัดกรองเบื้องต้นเท่านั้น ไม่สามารถใช้ทดแทนการวินิจฉัยทางการแพทย์โดยแพทย์ผู้เชี่ยวชาญได้<br/>
            หากท่านมีความเสี่ยงระดับปานกลาง-สูง โปรดนำรายงานฉบับนี้ไปปรึกษาแพทย์เฉพาะทาง
          </div>
        </body>
      </html>`;
  };

  const handleExportPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML(), base64: false });
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
        <View style={styles.iconBox}>
          <Text style={styles.icon}>📄</Text>
        </View>
        <Text style={styles.title}>ข้อมูลพร้อมส่งออก</Text>
        <Text style={styles.subtitle}>
          รายงานจะถูกจัดทำในรูปแบบ PDF พร้อมตารางสรุปผลและไทม์ไลน์
        </Text>

        <View style={styles.previewBox}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>🛏️ ระยะเวลานอน</Text>
            <Text style={styles.previewVal}>{sleepDuration}</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>📊 AHI</Text>
            <Text style={styles.previewVal}>{ahi} ครั้ง/ชม.</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>🎯 ระดับความเสี่ยง</Text>
            <Text style={[styles.previewVal, { color: riskColor }]}>{riskLabel}</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>⚠️ หยุดหายใจ</Text>
            <Text style={styles.previewVal}>{apneaCount} ครั้ง</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>📋 เหตุการณ์ทั้งหมด</Text>
            <Text style={styles.previewVal}>{safeEvents.length} รายการ</Text>
          </View>
          {wellnessPct > 0 && (
            <>
              <View style={styles.previewDivider} />
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>😊 ความสดชื่น</Text>
                <Text style={styles.previewVal}>{wellnessPct}%</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.85} onPress={handleExportPDF}>
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
  container:      { flex:1, backgroundColor:colors.bg, justifyContent:'center', alignItems:'center', padding:20 },
  card:           { backgroundColor:colors.surface, padding:28, borderRadius:radius.xl, alignItems:'center', width:'100%', maxWidth:400, ...shadow.raised },
  iconBox:        { width:64, height:64, borderRadius:radius.lg, backgroundColor:colors.primarySoft, alignItems:'center', justifyContent:'center', marginBottom:14 },
  icon:           { fontSize:28 },
  title:          { fontSize:21, fontWeight:'700', color:colors.ink, marginBottom:8 },
  subtitle:       { fontSize:13, color:colors.inkMuted, textAlign:'center', marginBottom:22, lineHeight:20 },
  previewBox:     { backgroundColor:colors.surfaceMuted, borderRadius:radius.md, padding:6, width:'100%', marginBottom:24 },
  previewRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10, paddingHorizontal:10 },
  previewDivider: { height:1, backgroundColor:colors.border, marginHorizontal:10 },
  previewLabel:   { color:colors.inkMuted, fontSize:13 },
  previewVal:     { color:colors.ink, fontWeight:'700', fontSize:13 },
  exportBtn:      { backgroundColor:colors.primary, paddingVertical:16, paddingHorizontal:20, borderRadius:radius.lg, width:'100%', alignItems:'center', marginBottom:14, shadowColor:colors.primaryDeep, shadowOffset:{width:0,height:6}, shadowOpacity:0.22, shadowRadius:12, elevation:4 },
  exportBtnText:  { color:colors.onPrimary, fontSize:16, fontWeight:'700' },
  backBtn:        { paddingVertical:10 },
  backBtnText:    { color:colors.inkFaint, fontSize:15 },
});
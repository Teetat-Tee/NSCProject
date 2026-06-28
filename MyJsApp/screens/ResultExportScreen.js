import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// 🟢 เพิ่มรับ props route (เพื่อรับข้อมูล) และ navigation (เพื่อกดย้อนกลับ)
export default function ResultExportScreen({ route, navigation }) {
  const viewShotRef = useRef();

  // 🟢 ดึงข้อมูลที่ส่งมาจากหน้า ResultScreen (ถ้าไม่มีให้ใช้ค่าเริ่มต้น)
  const { 
    riskLevel = 'สูง (High Risk)', 
    ahiValue = 22, 
    sleepDuration = '6 ชั่วโมง 45 นาที',
    riskColor = 'red' // สีของข้อความความเสี่ยง
  } = route.params || {};

  const handleExportAndShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (!isSharingAvailable) {
        Alert.alert('แจ้งเตือน', 'อุปกรณ์ของคุณไม่รองรับฟังก์ชันการแชร์');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'ส่งออกผลการคัดกรอง OSA-Detect',
        UTI: 'public.jpeg',
      });
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการ Export:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกหรือแชร์ผลลัพธ์ได้');
    }
  };

  return (
    <View style={styles.container}>
      
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <View style={styles.reportCard}>
          <Text style={styles.headerText}>รายงานผลการนอนหลับ</Text>
          <Text style={styles.appName}>OSA-Detect App</Text>
          
          <View style={styles.divider} />
          
          {/* 🟢 นำตัวแปรที่รับมา มาแสดงผลแทนข้อความตายตัว */}
          <Text style={styles.resultText}>
            ความเสี่ยง: <Text style={{ color: riskColor, fontWeight: 'bold' }}>{riskLevel}</Text>
          </Text>
          <Text style={styles.resultText}>ค่า Pseudo-AHI: {ahiValue} ครั้ง/ชั่วโมง</Text>
          <Text style={styles.resultText}>ระยะเวลาการนอน: {sleepDuration}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.noteText}>
            * นี่คือผลการคัดกรองเบื้องต้น โปรดนำข้อมูลนี้ไปปรึกษาแพทย์ผู้เชี่ยวชาญ
          </Text>
        </View>
      </ViewShot>

      {/* ปุ่มกดสำหรับ Export */}
      <TouchableOpacity style={styles.exportButton} onPress={handleExportAndShare}>
        <Text style={styles.buttonText}>📤 Export & Share</Text>
      </TouchableOpacity>

      {/* 🟢 ปุ่มกดย้อนกลับ */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>ย้อนกลับ</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  appName: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginBottom: 15,
  },
  resultText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#444',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 15,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 30,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 🟢 สไตล์ของปุ่มย้อนกลับ
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 15,
  },
  backButtonText: {
    color: '#888',
    fontSize: 16,
  }
});
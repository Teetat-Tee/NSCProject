// screens/HomeScreen.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* โลโก้ / ชื่อแอป */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🫁</Text>
        <Text style={styles.title}>OSA Detect</Text>
        <Text style={styles.subtitle}>
          ตรวจจับภาวะหยุดหายใจขณะหลับ{'\n'}ด้วย AI ผ่านสมาร์ทโฟน
        </Text>
      </View>

      {/* คำเตือน */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ แอปนี้ใช้เพื่อคัดกรองเบื้องต้นเท่านั้น{'\n'}
          ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>
      </View>

      {/* วิธีใช้ */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionTitle}>วิธีใช้งาน</Text>
        <Text style={styles.instruction}>1. วางมือถือไว้ข้างหมอน</Text>
        <Text style={styles.instruction}>2. กดเริ่มบันทึกก่อนนอน</Text>
        <Text style={styles.instruction}>3. ดูผลตอนตื่นนอน</Text>
      </View>

      {/* ปุ่มหลัก */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Record')}
      >
        <Text style={styles.startButtonText}>🌙 เริ่มบันทึกการนอน</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e0e0ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9090bb',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#2a1a1a',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  warningText: {
    color: '#ff9999',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionBox: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
  },
  instructionTitle: {
    color: '#e0e0ff',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 15,
  },
  instruction: {
    color: '#9090bb',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
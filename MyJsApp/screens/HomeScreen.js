import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.appName}>OSA Detect</Text>
          <Text style={styles.alarm}>07:00 ⏰</Text>
        </View>

        <View style={styles.logoArea}>
          <Text style={styles.logo}>🫁</Text>
          <Text style={styles.zzz}>z z Z</Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}
            onPress={() => navigation.navigate('Result', { demo: true })}>
            <Text style={styles.gridIcon}>▶️</Text>
            <Text style={styles.gridLabel}>ผลลัพธ์</Text>
            <Text style={styles.gridSub}>0 เดือนนี้</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridIcon}>🛏️</Text>
            <Text style={styles.gridLabel}>เวลานอน</Text>
            <Text style={styles.gridSub}>ยังไม่ได้บันทึก</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridIcon}>💊</Text>
            <Text style={styles.gridLabel}>วิธีรักษา</Text>
            <Text style={styles.gridSub}>ยังไม่ได้ตั้ง</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridIcon}>👃</Text>
            <Text style={styles.gridLabel}>ปัจจัย</Text>
            <Text style={styles.gridSub}>ยังไม่ได้ตั้ง</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.startBtn}
          onPress={() => navigation.navigate('Record')}>
          <Text style={styles.startText}>เริ่ม</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  appName: { color: '#f1f5f9', fontSize: 22, fontWeight: 'bold' },
  alarm: { color: '#38bdf8', fontSize: 16 },
  logoArea: { alignItems: 'center', marginVertical: 24 },
  logo: { fontSize: 72 },
  zzz: { color: '#38bdf8', fontSize: 20, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 32 },
  gridItem: { width: '48%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  gridIcon: { fontSize: 32, marginBottom: 8 },
  gridLabel: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  gridSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
  startBtn: { backgroundColor: '#38bdf8', borderRadius: 14, paddingVertical: 18, width: '100%', alignItems: 'center' },
  startText: { color: '#0f172a', fontSize: 20, fontWeight: 'bold' },
});
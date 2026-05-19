import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';

export default function SettingsScreen() {
  const [smartAlarm, setSmartAlarm] = useState(true);
  const [sensitivity, setSensitivity] = useState('Medium');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSub}>Customize your sleep tracking</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileEmoji}>😴</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Sleep Tracker User</Text>
            <Text style={styles.profileBadge}>Premium Member</Text>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLbl}>Nights</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0h</Text>
              <Text style={styles.statLbl}>Avg Sleep</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLbl}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Sleep Settings */}
        <Text style={styles.sectionTitle}>Sleep Settings</Text>
        <View style={styles.section}>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowIcon}><Text>🔔</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Smart Alarm</Text>
              <Text style={styles.rowSub}>6:30 AM</Text>
            </View>
            <Switch
              value={smartAlarm}
              onValueChange={setSmartAlarm}
              trackColor={{ true: '#38bdf8' }}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowIcon}><Text>🌙</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Sleep Goal</Text>
              <Text style={styles.rowSub}>8 hours</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              const opts = ['Low', 'Medium', 'High'];
              const next = opts[(opts.indexOf(sensitivity) + 1) % opts.length];
              setSensitivity(next);
            }}
          >
            <View style={styles.rowIcon}><Text>🔊</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Sound Sensitivity</Text>
              <Text style={styles.rowSub}>{sensitivity}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowIcon}><Text>👤</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Profile</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowIcon}><Text>ℹ️</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>About</Text>
              <Text style={styles.rowSub}>Version 1.0</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          * แอปนี้ใช้เพื่อคัดกรองเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20 },
  pageTitle: { color: '#f1f5f9', fontSize: 28, fontWeight: 'bold' },
  pageSub: { color: '#64748b', fontSize: 14, marginBottom: 20 },
  profileCard: {
    backgroundColor: '#6366f1', borderRadius: 20,
    padding: 20, marginBottom: 24,
  },
  profileEmoji: { fontSize: 40, marginBottom: 8 },
  profileInfo: { marginBottom: 16 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileBadge: { color: '#c7d2fe', fontSize: 13 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  statLbl: { color: '#c7d2fe', fontSize: 12 },
  sectionTitle: { color: '#64748b', fontSize: 13, marginBottom: 8, marginTop: 4 },
  section: { backgroundColor: '#1e293b', borderRadius: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#0f172a', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: { color: '#f1f5f9', fontSize: 15 },
  rowSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
  arrow: { color: '#475569', fontSize: 22 },
  divider: { height: 1, backgroundColor: '#0f172a', marginLeft: 64 },
  disclaimer: { color: '#475569', fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
});
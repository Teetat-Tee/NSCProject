import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Switch, Modal, TextInput, Alert,
} from 'react-native';
import { useState, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../AuthContext';
import { getOverallStats } from '../utils/sessionStorage';
import { getPreferences, updatePreferences } from '../utils/preferencesStorage';
import { colors, radius, shadow } from '../utils/theme';

const SLEEP_GOAL_OPTIONS = [6, 6.5, 7, 7.5, 8, 8.5, 9];
const ALARM_TIME_OPTIONS = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00'];

export default function SettingsScreen({ navigation }) {
  const { userData, logout, updateProfile } = useContext(AuthContext);

  const [stats, setStats] = useState({ totalNights: 0, avgSleepHours: 0, streak: 0 });
  const [prefs, setPrefs] = useState({ smartAlarmEnabled: true, smartAlarmTime: '06:30', sleepGoalHours: 8 });

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [alarmTimeModalVisible, setAlarmTimeModalVisible] = useState(false);
  const [sleepGoalModalVisible, setSleepGoalModalVisible] = useState(false);

  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', age: '', conditions: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getOverallStats().then(setStats);
      getPreferences().then(setPrefs);
    }, [])
  );

  function openProfileModal() {
    setEditForm({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      age: userData?.age || '',
      conditions: userData?.conditions || '',
    });
    setProfileModalVisible(true);
  }

  async function saveProfile() {
    if (!editForm.firstName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อ');
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile(editForm);
    setSavingProfile(false);

    if (result.success) {
      setProfileModalVisible(false);
    } else {
      Alert.alert('เกิดข้อผิดพลาด', result.error || 'บันทึกไม่สำเร็จ');
    }
  }

  async function toggleSmartAlarm(value) {
    const updated = await updatePreferences({ smartAlarmEnabled: value });
    setPrefs(updated);
  }

  async function selectAlarmTime(time) {
    const updated = await updatePreferences({ smartAlarmTime: time });
    setPrefs(updated);
    setAlarmTimeModalVisible(false);
  }

  async function selectSleepGoal(hours) {
    const updated = await updatePreferences({ sleepGoalHours: hours });
    setPrefs(updated);
    setSleepGoalModalVisible(false);
  }

  function confirmLogout() {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบใช่หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ออกจากระบบ', style: 'destructive', onPress: logout },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>การตั้งค่า</Text>
        <Text style={styles.pageSub}>ปรับแต่งการติดตามการนอนของคุณ</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileGlow} />
          <Text style={styles.profileEmoji}>😴</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userData?.firstName ? `${userData.firstName} ${userData.lastName}` : 'Sleep Tracker User'}
            </Text>
            <Text style={styles.profileBadge}>
              {userData?.age ? `${userData.age} ปี` : 'Member'} {userData?.gender ? `· ${userData.gender}` : ''}
            </Text>
            {userData?.conditions ? (
              <Text style={styles.profileConditions}>โรคประจำตัว: {userData.conditions}</Text>
            ) : null}
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.totalNights}</Text>
              <Text style={styles.statLbl}>คืน</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.avgSleepHours}h</Text>
              <Text style={styles.statLbl}>เฉลี่ย</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.streak}</Text>
              <Text style={styles.statLbl}>ติดต่อกัน</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>การนอนหลับ</Text>
        <View style={styles.section}>

          <View style={styles.row}>
            <View style={styles.rowIcon}><Text>🔔</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>ปลุกอัจฉริยะ</Text>
              <Text style={styles.rowSub}>
                {prefs.smartAlarmEnabled ? `${prefs.smartAlarmTime} · ยังไม่รองรับการปลุกจริง` : 'ปิดอยู่'}
              </Text>
            </View>
            <Switch
              value={prefs.smartAlarmEnabled}
              onValueChange={toggleSmartAlarm}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.row, !prefs.smartAlarmEnabled && styles.rowDisabled]}
            activeOpacity={0.7}
            onPress={() => prefs.smartAlarmEnabled && setAlarmTimeModalVisible(true)}
            disabled={!prefs.smartAlarmEnabled}
          >
            <View style={styles.rowIcon}><Text>⏰</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>เวลาปลุก</Text>
              <Text style={styles.rowSub}>{prefs.smartAlarmTime}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setSleepGoalModalVisible(true)}>
            <View style={styles.rowIcon}><Text>🌙</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>เป้าหมายการนอน</Text>
              <Text style={styles.rowSub}>{prefs.sleepGoalHours} ชั่วโมง</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.sectionTitle}>เครื่องมือนักพัฒนา</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home', { screen: 'AccuracyTest' })}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}><Text>🧪</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>ทดสอบความแม่นยำ</Text>
              <Text style={styles.rowSub}>วัด Precision / Recall ของระบบ DSP</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>บัญชี</Text>
        <View style={styles.section}>

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openProfileModal}>
            <View style={styles.rowIcon}><Text>👤</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>ข้อมูลโปรไฟล์</Text>
              <Text style={styles.rowSub}>{userData?.email}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setAboutModalVisible(true)}>
            <View style={styles.rowIcon}><Text>ℹ️</Text></View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>เกี่ยวกับแอป</Text>
              <Text style={styles.rowSub}>เวอร์ชัน 1.0</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={confirmLogout}>
            <View style={[styles.rowIcon, { backgroundColor: colors.riskSevereSoft }]}><Text>🚪</Text></View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.riskSevere, fontWeight: '700' }]}>ออกจากระบบ</Text>
            </View>
          </TouchableOpacity>

        </View>

        <Text style={styles.disclaimer}>
          * แอปนี้ใช้เพื่อคัดกรองเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent onRequestClose={() => setProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>แก้ไขโปรไฟล์</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="ชื่อ"
              placeholderTextColor={colors.inkFaint}
              value={editForm.firstName}
              onChangeText={(t) => setEditForm({ ...editForm, firstName: t })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="นามสกุล"
              placeholderTextColor={colors.inkFaint}
              value={editForm.lastName}
              onChangeText={(t) => setEditForm({ ...editForm, lastName: t })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="อายุ"
              placeholderTextColor={colors.inkFaint}
              keyboardType="numeric"
              value={String(editForm.age)}
              onChangeText={(t) => setEditForm({ ...editForm, age: t })}
            />
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="โรคประจำตัว (ถ้ามี)"
              placeholderTextColor={colors.inkFaint}
              multiline
              value={editForm.conditions}
              onChangeText={(t) => setEditForm({ ...editForm, conditions: t })}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setProfileModalVisible(false)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveProfile} disabled={savingProfile}>
                <Text style={styles.modalSaveText}>{savingProfile ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alarm Time Modal */}
      <Modal visible={alarmTimeModalVisible} animationType="fade" transparent onRequestClose={() => setAlarmTimeModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAlarmTimeModalVisible(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>เลือกเวลาปลุก</Text>
            {ALARM_TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.optionRow, prefs.smartAlarmTime === time && styles.optionRowActive]}
                onPress={() => selectAlarmTime(time)}
              >
                <Text style={[styles.optionRowText, prefs.smartAlarmTime === time && styles.optionRowTextActive]}>
                  {time}
                </Text>
                {prefs.smartAlarmTime === time && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sleep Goal Modal */}
      <Modal visible={sleepGoalModalVisible} animationType="fade" transparent onRequestClose={() => setSleepGoalModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSleepGoalModalVisible(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>เป้าหมายชั่วโมงการนอน</Text>
            {SLEEP_GOAL_OPTIONS.map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.optionRow, prefs.sleepGoalHours === h && styles.optionRowActive]}
                onPress={() => selectSleepGoal(h)}
              >
                <Text style={[styles.optionRowText, prefs.sleepGoalHours === h && styles.optionRowTextActive]}>
                  {h} ชั่วโมง
                </Text>
                {prefs.sleepGoalHours === h && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutModalVisible} animationType="slide" transparent onRequestClose={() => setAboutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.aboutEmoji}>🫁</Text>
            <Text style={styles.modalTitle}>OSA Detect</Text>
            <Text style={styles.aboutVersion}>เวอร์ชัน 1.0.0</Text>
            <Text style={styles.aboutText}>
              แอปคัดกรองความเสี่ยงภาวะหยุดหายใจขณะหลับเบื้องต้น
              โดยใช้การประมวลผลสัญญาณเสียง (DSP) วิเคราะห์รูปแบบเสียงกรน
              และการหยุดหายใจระหว่างการนอน
            </Text>
            <View style={styles.aboutDisclaimerBox}>
              <Text style={styles.aboutDisclaimer}>
                ผลลัพธ์จากแอปนี้เป็นเพียงการคัดกรองเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์
                หากพบความเสี่ยง ควรปรึกษาแพทย์ผู้เชี่ยวชาญด้านการนอนหลับ
              </Text>
            </View>

            <TouchableOpacity style={styles.modalSaveBtnFull} onPress={() => setAboutModalVisible(false)}>
              <Text style={styles.modalSaveText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20 },
  pageTitle: { color: colors.ink, fontSize: 27, fontWeight: '700' },
  pageSub: { color: colors.inkMuted, fontSize: 14, marginBottom: 22 },

  profileCard: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: 22, marginBottom: 26, overflow: 'hidden',
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 6,
  },
  profileGlow: {
    position: 'absolute', top: -50, right: -30, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  profileEmoji: { fontSize: 36, marginBottom: 10 },
  profileInfo: { marginBottom: 18 },
  profileName: { color: colors.onPrimary, fontSize: 19, fontWeight: '700' },
  profileBadge: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 3 },
  profileConditions: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  profileStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, paddingVertical: 14,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  statNum: { color: colors.onPrimary, fontSize: 21, fontWeight: '700' },
  statLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  sectionTitle: { color: colors.inkFaint, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: 22, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowDisabled: { opacity: 0.4 },
  rowIcon: {
    width: 38, height: 38, borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted, alignItems: 'center',
    justifyContent: 'center', marginRight: 13,
  },
  rowContent: { flex: 1 },
  rowLabel: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  rowSub: { color: colors.inkFaint, fontSize: 12.5, marginTop: 2 },
  arrow: { color: colors.inkFaint, fontSize: 22 },
  divider: { height: 1, backgroundColor: colors.surfaceMuted, marginLeft: 67 },
  disclaimer: { color: colors.inkFaint, fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(43,43,46,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: colors.bg, borderRadius: radius.xl, padding: 24 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.md,
    padding: 14, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surfaceMuted },
  modalCancelText: { color: colors.inkMuted, fontWeight: '600' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.primary },
  modalSaveBtnFull: { paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center', backgroundColor: colors.primary, marginTop: 4 },
  modalSaveText: { color: colors.onPrimary, fontWeight: '700' },

  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted,
  },
  optionRowActive: {},
  optionRowText: { color: colors.inkMuted, fontSize: 16 },
  optionRowTextActive: { color: colors.primary, fontWeight: '700' },
  checkmark: { color: colors.primary, fontSize: 16, fontWeight: '700' },

  aboutEmoji: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  aboutVersion: { color: colors.inkFaint, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  aboutText: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginBottom: 16, textAlign: 'center' },
  aboutDisclaimerBox: { backgroundColor: colors.riskSevereSoft, borderRadius: radius.md, padding: 13, marginBottom: 20 },
  aboutDisclaimer: { color: colors.riskSevere, fontSize: 11, fontStyle: 'italic', lineHeight: 17, textAlign: 'center' },
});
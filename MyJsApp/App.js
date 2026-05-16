import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, SafeAreaView, Dimensions, Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function App() {
  // --- States ควบคุม Flow ของแอป ---
  // 'profile' -> 'assessment' -> 'main'
  const [appStep, setAppStep] = useState('profile');
  const [activeTab, setActiveTab] = useState('Record'); // สำหรับหน้า Main

  // --- Profile States ---
  const [profile, setProfile] = useState({
    name: '', age: '', height: '', weight: '', activity: 'Sedentary'
  });

  const activityLevels = [
    { id: 'Sedentary', label: 'นั่งเป็นหลัก', sub: 'ไม่ค่อยออกกำลังกาย' },
    { id: 'Lightly', label: 'Lightly Active', sub: 'ออกกำลังเบา 1–3 วัน/สัปดาห์' },
    { id: 'Moderately', label: 'Moderately Active', sub: 'ออกกำลังปานกลาง 3–5 วัน/สัปดาห์' },
    { id: 'Very', label: 'Very Active', sub: 'ออกกำลังหนัก 6–7 วัน/สัปดาห์' },
    { id: 'Extra', label: 'Extra Active', sub: 'นักกีฬา / ใช้แรงงานหนักมาก' },
  ];

  // --- Assessment States ---
  const [snoring, setSnoring] = useState(false);
  const [tired, setTired] = useState(false);
  const [observed, setObserved] = useState(false);
  const [bloodPressure, setBloodPressure] = useState(false);

  // --- Record & Summary States ---
  const [isRecording, setIsRecording] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState('Weekly'); // Daily, Weekly, Monthly

  // --- Navigation Functions ---
  const goToAssessment = () => {
    if (!profile.name || !profile.age || !profile.height || !profile.weight) {
      alert('กรุณากรอกข้อมูลพื้นฐานให้ครบถ้วนก่อนครับ');
      return;
    }
    setAppStep('assessment');
  };

  const finishAssessment = () => {
    // ในอนาคตสามารถนำคะแนนไปประมวลผลความเสี่ยงได้ตรงนี้
    setAppStep('main');
  };

  // ==========================================
  // 1. หน้ากรอกข้อมูลส่วนตัว (Onboarding 1)
  // ==========================================
  const ProfileSetupScreen = () => (
    <ScrollView style={styles.screenBody} contentContainerStyle={{paddingBottom: 40}}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Welcome</Text>
        <Text style={styles.headerSub}>กรุณากรอกข้อมูลเพื่อเริ่มต้นใช้งาน</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <TextInput 
          style={styles.darkInput} 
          placeholder="ชื่อ-นามสกุล" 
          placeholderTextColor="#7F8C8D"
          value={profile.name}
          onChangeText={(t) => setProfile({...profile, name: t})}
        />
        <View style={styles.row}>
          <TextInput style={[styles.darkInput, {flex: 1, marginRight: 10}]} placeholder="อายุ (ปี)" keyboardType="numeric" placeholderTextColor="#7F8C8D" value={profile.age} onChangeText={(t) => setProfile({...profile, age: t})}/>
          <TextInput style={[styles.darkInput, {flex: 1, marginRight: 10}]} placeholder="ส่วนสูง (ซม.)" keyboardType="numeric" placeholderTextColor="#7F8C8D" value={profile.height} onChangeText={(t) => setProfile({...profile, height: t})}/>
          <TextInput style={[styles.darkInput, {flex: 1}]} placeholder="น้ำหนัก (กก.)" keyboardType="numeric" placeholderTextColor="#7F8C8D" value={profile.weight} onChangeText={(t) => setProfile({...profile, weight: t})}/>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ระดับกิจกรรม / การออกกำลังกาย</Text>
      {activityLevels.map((item) => (
        <TouchableOpacity 
          key={item.id}
          style={[styles.activityCard, profile.activity === item.id && styles.activityCardActive]}
          onPress={() => setProfile({...profile, activity: item.id})}
        >
          <View>
            <Text style={styles.activityLabel}>{item.label}</Text>
            <Text style={styles.activitySub}>{item.sub}</Text>
          </View>
          {profile.activity === item.id && <Ionicons name="checkmark-circle" size={24} color="#3498DB" />}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.mainBtn} onPress={goToAssessment}>
        <Text style={styles.mainBtnText}>ถัดไป ➔</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ==========================================
  // 2. หน้าแบบประเมิน (Onboarding 2)
  // ==========================================
  const AssessmentSetupScreen = () => (
    <ScrollView style={styles.screenBody}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>แบบประเมินความเสี่ยง</Text>
        <Text style={styles.headerSub}>คุณ {profile.name} โปรดตอบคำถามต่อไปนี้</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.questionRow}>
          <Text style={styles.questionText}>1. นอนกรนเสียงดังเป็นประจำ?</Text>
          <Switch value={snoring} onValueChange={setSnoring} trackColor={{ false: "#333", true: "#3498DB" }} thumbColor={"#FFF"} />
        </View>
        <View style={styles.questionRow}>
          <Text style={styles.questionText}>2. อ่อนเพลียหรือง่วงนอนตอนกลางวัน?</Text>
          <Switch value={tired} onValueChange={setTired} trackColor={{ false: "#333", true: "#3498DB" }} thumbColor={"#FFF"} />
        </View>
        <View style={styles.questionRow}>
          <Text style={styles.questionText}>3. เคยมีคนเห็นว่าหยุดหายใจขณะหลับ?</Text>
          <Switch value={observed} onValueChange={setObserved} trackColor={{ false: "#333", true: "#3498DB" }} thumbColor={"#FFF"} />
        </View>
        <View style={styles.questionRow}>
          <Text style={styles.questionText}>4. มีโรคประจำตัวเป็นความดันโลหิตสูง?</Text>
          <Switch value={bloodPressure} onValueChange={setBloodPressure} trackColor={{ false: "#333", true: "#3498DB" }} thumbColor={"#FFF"} />
        </View>
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={[styles.mainBtn, styles.btnOutline]} onPress={() => setAppStep('profile')}>
          <Text style={styles.btnOutlineText}>ย้อนกลับ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainBtn, {flex: 1, marginLeft: 10}]} onPress={finishAssessment}>
          <Text style={styles.mainBtnText}>เริ่มใช้งานแอป</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ==========================================
  // 3. หน้าบันทึกเสียง (Main - Record Tab)
  // ==========================================
  const RecordScreen = () => (
    <View style={styles.screenBody}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Sleep Recording</Text>
        <Text style={styles.headerSub}>เตรียมพร้อมวิเคราะห์เสียงกรนและหยุดหายใจ</Text>
      </View>
      
      <View style={styles.micCardMain}>
        <TouchableOpacity 
          style={[styles.micCircle, isRecording && styles.micCircleActive]}
          onPress={() => setIsRecording(!isRecording)}
        >
          <Ionicons name="mic" size={60} color="white" />
        </TouchableOpacity>
        <Text style={styles.startText}>{isRecording ? 'กำลังบันทึกเสียง...' : 'กดเพื่อเริ่มบันทึก'}</Text>
        <Text style={styles.subStartText}>กรุณาวางโทรศัพท์ไว้ใกล้ตัวขณะนอนหลับ</Text>
      </View>

      {isRecording && (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.sectionTitle}>คลื่นเสียงแบบเรียลไทม์</Text>
          <View style={styles.mockChart}>
              {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
                <View key={i} style={[styles.chartBar, {height: h}]} />
              ))}
          </View>
        </View>
      )}
    </View>
  );

  // ==========================================
  // 4. หน้าสรุปผล (Main - Summary Tab)
  // ==========================================
  const SummaryScreen = () => {
    // ข้อมูลจำลองสำหรับกราฟการหยุดหายใจ (จำนวนรอบ)
    const chartData = {
      Daily: [1, 0, 3, 2, 5, 1, 0], // รายชั่วโมงใน 1 คืน
      Weekly: [15, 12, 18, 10, 8, 14, 11], // 7 วัน
      Monthly: [50, 45, 60, 42] // 4 สัปดาห์
    };

    const labels = {
      Daily: ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00'],
      Weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      Monthly: ['Wk1', 'Wk2', 'Wk3', 'Wk4']
    };

    const currentData = chartData[summaryFilter];
    const currentLabels = labels[summaryFilter];
    const maxVal = Math.max(...currentData) || 1;

    return (
      <View style={styles.screenBody}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Apnea Summary</Text>
          <Text style={styles.headerSub}>สถิติภาวะหยุดหายใจขณะหลับ (จำนวนรอบ)</Text>
        </View>

        {/* ปุ่มสลับช่วงเวลา */}
        <View style={styles.filterContainer}>
          {['Daily', 'Weekly', 'Monthly'].map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterBtn, summaryFilter === filter && styles.filterBtnActive]}
              onPress={() => setSummaryFilter(filter)}
            >
              <Text style={[styles.filterText, summaryFilter === filter && styles.filterTextActive]}>
                {filter === 'Daily' ? 'รายวัน' : filter === 'Weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* กราฟแท่ง */}
        <View style={styles.chartContainer}>
          <View style={styles.barArea}>
            {currentData.map((val, index) => {
              const heightPercent = (val / maxVal) * 100;
              return (
                <View key={index} style={styles.barColumn}>
                  <Text style={styles.barValue}>{val}</Text>
                  <View style={[styles.bar, { height: `${heightPercent}%`, backgroundColor: val > (maxVal*0.7) ? '#E74C3C' : '#3498DB' }]} />
                  <Text style={styles.barLabel}>{currentLabels[index]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* สถิติสรุป */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>หยุดหายใจรวม</Text>
            <Text style={styles.statValue}>{currentData.reduce((a,b)=>a+b,0)} <Text style={{fontSize: 14}}>รอบ</Text></Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>เฉลี่ยต่อ{summaryFilter === 'Weekly' ? 'วัน' : 'ช่วง'}</Text>
            <Text style={styles.statValue}>{(currentData.reduce((a,b)=>a+b,0)/currentData.length).toFixed(1)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ==========================================
  // RENDER MAIN
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      {/* ส่วนของ Onboarding Flow */}
      {appStep === 'profile' && <ProfileSetupScreen />}
      {appStep === 'assessment' && <AssessmentSetupScreen />}

      {/* ส่วนของ Main App Flow */}
      {appStep === 'main' && (
        <>
          {activeTab === 'Record' && <RecordScreen />}
          {activeTab === 'Summary' && <SummaryScreen />}
          
          {/* Bottom Tab Bar */}
          <View style={styles.tabBar}>
            <TabItem icon="mic" label="บันทึก" active={activeTab === 'Record'} onPress={() => setActiveTab('Record')} />
            <TabItem icon="bar-chart" label="สถิติผล" active={activeTab === 'Summary'} onPress={() => setActiveTab('Summary')} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// Component สำหรับ Tab
const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Ionicons name={icon} size={28} color={active ? '#3498DB' : '#7F8C8D'} />
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  screenBody: { flex: 1, paddingHorizontal: 20 },
  
  // Header
  headerContainer: { marginTop: 30, marginBottom: 25 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 14, color: '#95A5A6', marginTop: 5 },

  // Inputs & Cards
  inputGroup: { marginBottom: 10 },
  darkInput: { 
    backgroundColor: '#1C1C1E', color: '#FFF', padding: 15, 
    borderRadius: 12, marginBottom: 15, fontSize: 16 
  },
  row: { flexDirection: 'row' },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  
  activityCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1C1C1E', padding: 15, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'transparent'
  },
  activityCardActive: { borderColor: '#3498DB', backgroundColor: '#1C2A35' },
  activityLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  activitySub: { color: '#7F8C8D', fontSize: 12 },

  card: { backgroundColor: '#1C1C1E', borderRadius: 15, padding: 20, marginBottom: 20 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  questionText: { fontSize: 16, color: '#FFF', flex: 1, paddingRight: 10 },

  // Buttons
  navButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 10 },
  mainBtn: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#3498DB', flex: 0.5 },
  btnOutlineText: { color: '#3498DB', fontSize: 16, fontWeight: 'bold' },

  // Record Screen
  micCardMain: { backgroundColor: '#1C1C1E', padding: 40, borderRadius: 30, alignItems: 'center', marginBottom: 20 },
  micCircle: { 
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#3498DB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: '#3498DB', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10
  },
  micCircleActive: { backgroundColor: '#E74C3C', shadowColor: '#E74C3C' },
  startText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  subStartText: { color: '#95A5A6', fontSize: 14, marginTop: 5 },
  chartPlaceholder: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 20, flex: 1, marginBottom: 20 },
  mockChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', flex: 1, marginTop: 10 },
  chartBar: { width: 15, backgroundColor: '#3498DB', borderRadius: 10, opacity: 0.8 },

  // Summary Screen
  filterContainer: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 10, padding: 5, marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  filterBtnActive: { backgroundColor: '#3498DB' },
  filterText: { color: '#7F8C8D', fontWeight: 'bold' },
  filterTextActive: { color: '#FFF' },
  
  chartContainer: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 20, height: 250, marginBottom: 20 },
  barArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', flex: 1 },
  barColumn: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: 20, borderRadius: 10, minHeight: 5 },
  barValue: { color: '#FFF', fontSize: 12, marginBottom: 5 },
  barLabel: { color: '#7F8C8D', fontSize: 10, marginTop: 10 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#1C1C1E', width: '48%', padding: 20, borderRadius: 20, alignItems: 'center' },
  statLabel: { color: '#7F8C8D', fontSize: 14, marginBottom: 10 },
  statValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },

  // Tab Bar
  tabBar: { 
    flexDirection: 'row', height: 80, backgroundColor: '#1A1A1A', 
    borderTopWidth: 1, borderTopColor: '#2C2C2E', justifyContent: 'space-around', alignItems: 'center',
    paddingBottom: 15
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { fontSize: 12, color: '#7F8C8D', marginTop: 4 },
  tabLabelActive: { color: '#3498DB', fontWeight: 'bold' }
});
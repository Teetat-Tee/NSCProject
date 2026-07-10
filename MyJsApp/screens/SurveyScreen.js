import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, StatusBar,
} from 'react-native';
import {
  Smile, Meh, Frown, AlertCircle,
  Zap, Moon, Brain, ThumbsUp,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme, radius, shadow } from '../utils/theme';
import { saveSession } from '../utils/sessionStorage';

const QUESTIONS = [
  {
    id: 1, question: 'รู้สึกอย่างไรหลังตื่นนอน?',
    options: [
      { label: 'สดชื่นมาก', Icon: Smile, score: 4 },
      { label: 'ปกติ', Icon: Meh, score: 3 },
      { label: 'เพลียนิดหน่อย', Icon: Frown, score: 2 },
      { label: 'เพลียมาก', Icon: AlertCircle, score: 1 },
    ],
  },
  {
    id: 2, question: 'มีอาการปวดหัวหลังตื่นนอนไหม?',
    options: [
      { label: 'ไม่ปวดเลย', Icon: ThumbsUp, score: 4 },
      { label: 'ปวดนิดหน่อย', Icon: Meh, score: 3 },
      { label: 'ปวดพอสมควร', Icon: Frown, score: 2 },
      { label: 'ปวดมาก', Icon: AlertCircle, score: 1 },
    ],
  },
  {
    id: 3, question: 'มีอาการเจ็บคอหรือปากแห้งไหม?',
    options: [
      { label: 'ไม่มีเลย', Icon: ThumbsUp, score: 4 },
      { label: 'นิดหน่อย', Icon: Meh, score: 3 },
      { label: 'ค่อนข้างมี', Icon: Frown, score: 2 },
      { label: 'มีมาก', Icon: AlertCircle, score: 1 },
    ],
  },
  {
    id: 4, question: 'ยังรู้สึกง่วงหลังตื่นนอนไหม?',
    options: [
      { label: 'ไม่ง่วงเลย', Icon: Zap, score: 4 },
      { label: 'ง่วงนิดหน่อย', Icon: Meh, score: 3 },
      { label: 'ง่วงมาก', Icon: Moon, score: 2 },
      { label: 'แทบลืมตาไม่ขึ้น', Icon: AlertCircle, score: 1 },
    ],
  },
  {
    id: 5, question: 'ความจำและสมาธิเป็นอย่างไร?',
    options: [
      { label: 'ดีมาก', Icon: Brain, score: 4 },
      { label: 'ปกติ', Icon: ThumbsUp, score: 3 },
      { label: 'ลืมง่ายนิดหน่อย', Icon: Meh, score: 2 },
      { label: 'สมาธิสั้นมาก', Icon: AlertCircle, score: 1 },
    ],
  },
];

export default function SurveyScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { duration = 0, events = [], engine = 'dsp', ahi, riskLabel } = route.params ?? {};
  const [answers, setAnswers] = useState({});
  const [saving, setSaving]   = useState(false);

  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);
  const wellnessPct = allAnswered
    ? Math.round((Object.values(answers).reduce((s, v) => s + v, 0) / (QUESTIONS.length * 4)) * 100)
    : 0;

  async function handleSubmit() {
    if (!allAnswered) { Alert.alert('กรุณาตอบทุกข้อ'); return; }
    setSaving(true);
    try {
      const apneaCount = events.filter(e => e.type === 'apnea').length;
      const snoreCount = events.filter(e => e.type === 'snore').length;
      const moveCount  = events.filter(e => e.type === 'movement').length;
      const session = await saveSession({
        duration, events, engine,
        ahi: ahi ?? 0, riskLabel: riskLabel ?? 'ปกติ',
        apneaCount, snoreCount, moveCount,
        survey: { wellnessPercent: wellnessPct, answers },
      });
      navigation.replace('Result', { session, duration, events, engine, ahi, riskLabel, wellnessPct });
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.ink }]}>แบบสอบถาม</Text>
        <Text style={[styles.sub, { color: colors.inkMuted }]}>ประเมินอาการหลังตื่นนอน</Text>

        {QUESTIONS.map(q => (
          <View key={q.id} style={[styles.card, { backgroundColor: colors.surface }, !isDark && shadow.card]}>
            <View style={styles.qHeader}>
              <View style={[styles.qNum, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.qNumText, { color: colors.primary }]}>{q.id}</Text>
              </View>
              <Text style={[styles.qText, { color: colors.ink }]}>{q.question}</Text>
            </View>
            <View style={styles.options}>
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.score;
                const IconComp = opt.Icon;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.option, {
                      backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted,
                      borderColor:     selected ? colors.primary : 'transparent',
                      borderWidth:     selected ? 2 : 0,
                    }]}
                    activeOpacity={0.7}
                    onPress={() => setAnswers(p => ({ ...p, [q.id]: opt.score }))}
                  >
                    <IconComp color={selected ? colors.primary : colors.inkMuted} size={24} strokeWidth={2} />
                    <Text style={[styles.optLabel, { color: selected ? colors.primary : colors.inkMuted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {allAnswered && (
          <View style={[styles.scoreCard, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.scoreLabel, { color: colors.inkMuted }]}>คะแนนความสดชื่น</Text>
            <Text style={[styles.scoreVal, { color: colors.primary }]}>{wellnessPct}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: allAnswered ? colors.primary : colors.surfaceMuted, opacity: saving ? 0.7 : 1 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!allAnswered || saving}
        >
          <CheckCircle color={allAnswered ? colors.onPrimary : colors.inkFaint} size={20} strokeWidth={2} />
          <Text style={[styles.submitText, { color: allAnswered ? colors.onPrimary : colors.inkFaint }]}>
            {saving ? 'กำลังบันทึก...' : 'ดูผลการนอน'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { padding: 22 },
  title:   { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  sub:     { fontSize: 13, marginBottom: 22 },
  card:    { borderRadius: radius.lg, padding: 18, marginBottom: 16 },
  qHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  qNum:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  qNumText:{ fontSize: 13, fontWeight: '700' },
  qText:   { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option:  { width: '47%', borderRadius: radius.md, padding: 14, alignItems: 'center', gap: 8 },
  optLabel:{ fontSize: 12, fontWeight: '500', textAlign: 'center' },
  scoreCard: { borderRadius: radius.lg, padding: 20, alignItems: 'center', marginBottom: 16 },
  scoreLabel:{ fontSize: 13, marginBottom: 4 },
  scoreVal:  { fontSize: 40, fontWeight: '800' },
  submitBtn: { borderRadius: radius.lg, paddingVertical: 19, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  submitText:{ fontSize: 17, fontWeight: '700' },
});
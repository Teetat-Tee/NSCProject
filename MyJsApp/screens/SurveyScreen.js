import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { saveSession } from '../utils/sessionStorage';
import { colors, radius, shadow } from '../utils/theme';

const QUESTIONS = [
  {
    id: 'feeling',
    question: 'ตื่นมารู้สึกอย่างไร?',
    options: [
      { label: 'กระปรี้กระเปร่า', emoji: '😄', score: 3 },
      { label: 'สดชื่น', emoji: '🙂', score: 2 },
      { label: 'เหนื่อย', emoji: '😐', score: 1 },
      { label: 'หมดแรง', emoji: '😩', score: 0 },
    ],
  },
  {
    id: 'headache',
    question: 'มีอาการปวดหัวช่วงเช้าไหม?',
    options: [
      { label: 'ไม่มีเลย', emoji: '✅', score: 3 },
      { label: 'นิดหน่อย', emoji: '🤏', score: 2 },
      { label: 'ปานกลาง', emoji: '😣', score: 1 },
      { label: 'ปวดมาก', emoji: '🤕', score: 0 },
    ],
  },
  {
    id: 'throat',
    question: 'มีอาการเจ็บคอหรือปากแห้งไหม?',
    options: [
      { label: 'ไม่มี', emoji: '✅', score: 3 },
      { label: 'เล็กน้อย', emoji: '🤏', score: 2 },
      { label: 'พอสมควร', emoji: '😣', score: 1 },
      { label: 'มากมาย', emoji: '🥵', score: 0 },
    ],
  },
  {
    id: 'sleepy',
    question: 'ยังรู้สึกง่วงหลังตื่นนอนไหม?',
    options: [
      { label: 'ไม่ง่วงเลย', emoji: '⚡', score: 3 },
      { label: 'ง่วงนิดหน่อย', emoji: '😴', score: 2 },
      { label: 'ง่วงมาก', emoji: '💤', score: 1 },
      { label: 'แทบลืมตาไม่ขึ้น', emoji: '😵', score: 0 },
    ],
  },
  {
    id: 'memory',
    question: 'ความจำและสมาธิเป็นอย่างไร?',
    options: [
      { label: 'ดีมาก', emoji: '🧠', score: 3 },
      { label: 'ปกติ', emoji: '👍', score: 2 },
      { label: 'ลืมง่ายนิดหน่อย', emoji: '🤔', score: 1 },
      { label: 'สมาธิสั้นมาก', emoji: '😵‍💫', score: 0 },
    ],
  },
];

export default function SurveyScreen({ route, navigation }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const recordData = route?.params || {};

  function selectAnswer(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0);
      const maxScore = QUESTIONS.length * 3;
      const wellnessPercent = Math.round((totalScore / maxScore) * 100);
      const survey = { answers, wellnessPercent };

      const savedSession = await saveSession({
        duration: recordData.duration || 0,
        events: recordData.events || [],
        survey,
      });

      navigation.navigate('Result', { sessionId: savedSession.id });
    } catch (err) {
      console.error('Failed to save session:', err);
      navigation.navigate('Result', {
        duration: recordData.duration,
        events: recordData.events,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const answered = Object.keys(answers).length;
  const allAnswered = answered === QUESTIONS.length;
  const progressPct = (answered / QUESTIONS.length) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>แบบสอบถามหลังตื่นนอน</Text>
        <Text style={styles.sub}>กรุณาตอบให้ครบทุกข้อ</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{answered}/{QUESTIONS.length} ข้อ</Text>

        {QUESTIONS.map((q, qi) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionNumBadge}>
              <Text style={styles.questionNumText}>{qi + 1}</Text>
            </View>
            <Text style={styles.questionText}>{q.question}</Text>
            <View style={styles.optionsGrid}>
              {q.options.map((opt, oi) => {
                const selected = answers[q.id]?.label === opt.label;
                return (
                  <TouchableOpacity
                    key={oi}
                    style={[styles.optionBtn, selected && styles.optionSelected]}
                    activeOpacity={0.7}
                    onPress={() => selectAnswer(q.id, opt)}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, (!allAnswered || submitting) && styles.submitDisabled]}
          activeOpacity={0.85}
          onPress={allAnswered && !submitting ? submit : null}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.submitText, !allAnswered && styles.submitTextDisabled]}>
              {allAnswered ? '✅ ดูผลการนอน' : `กรุณาตอบให้ครบ (${answered}/${QUESTIONS.length})`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 20 },
  title: { color: colors.ink, fontSize: 23, fontWeight: '700', marginBottom: 4 },
  sub: { color: colors.inkMuted, fontSize: 14, marginBottom: 14 },

  progressTrack: { height: 6, backgroundColor: colors.surfaceMuted, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressLabel: { color: colors.inkFaint, fontSize: 12, marginBottom: 22 },

  questionCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 18, marginBottom: 14, ...shadow.card,
  },
  questionNumBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  questionNumText: { color: colors.primaryDeep, fontSize: 12, fontWeight: '700' },
  questionText: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: {
    width: '47%', backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md, padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionEmoji: { fontSize: 26, marginBottom: 6 },
  optionLabel: { color: colors.inkMuted, fontSize: 12, textAlign: 'center', fontWeight: '500' },
  optionLabelSelected: { color: colors.primaryDeep, fontWeight: '700' },

  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    padding: 19, alignItems: 'center',
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22, shadowRadius: 14, elevation: 5,
  },
  submitDisabled: { backgroundColor: colors.surfaceMuted, shadowOpacity: 0 },
  submitText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  submitTextDisabled: { color: colors.inkFaint },
});
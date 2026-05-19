import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';

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
  const recordData = route?.params || {};

  function selectAnswer(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }

  function submit() {
    const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0);
    const maxScore = QUESTIONS.length * 3;
    const wellnessPercent = Math.round((totalScore / maxScore) * 100);

    navigation.navigate('Result', {
      ...recordData,
      survey: { answers, wellnessPercent },
    });
  }

  const answered = Object.keys(answers).length;
  const allAnswered = answered === QUESTIONS.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        <Text style={styles.title}>แบบสอบถามหลังตื่นนอน</Text>
        <Text style={styles.sub}>กรุณาตอบให้ครบทุกข้อ ({answered}/{QUESTIONS.length})</Text>

        {QUESTIONS.map((q, qi) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionNum}>ข้อ {qi + 1}</Text>
            <Text style={styles.questionText}>{q.question}</Text>
            <View style={styles.optionsGrid}>
              {q.options.map((opt, oi) => {
                const selected = answers[q.id]?.label === opt.label;
                return (
                  <TouchableOpacity
                    key={oi}
                    style={[styles.optionBtn, selected && styles.optionSelected]}
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
          style={[styles.submitBtn, !allAnswered && styles.submitDisabled]}
          onPress={allAnswered ? submit : null}
        >
          <Text style={styles.submitText}>
            {allAnswered ? '✅ ดูผลการนอน' : `กรุณาตอบให้ครบ (${answered}/${QUESTIONS.length})`}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 20 },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  sub: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  questionCard: {
    backgroundColor: '#1e293b', borderRadius: 16,
    padding: 16, marginBottom: 16,
  },
  questionNum: { color: '#38bdf8', fontSize: 12, marginBottom: 4 },
  questionText: { color: '#f1f5f9', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    width: '47%', backgroundColor: '#0f172a',
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#1e293b',
  },
  optionSelected: { borderColor: '#38bdf8', backgroundColor: '#0c2a3d' },
  optionEmoji: { fontSize: 28, marginBottom: 6 },
  optionLabel: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  optionLabelSelected: { color: '#38bdf8' },
  submitBtn: {
    backgroundColor: '#38bdf8', borderRadius: 14,
    padding: 18, alignItems: 'center',
  },
  submitDisabled: { backgroundColor: '#1e293b' },
  submitText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
});
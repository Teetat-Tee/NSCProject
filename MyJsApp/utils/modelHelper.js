export async function analyzeAudio(audioBase64) {
  // Mock 100% — ลบออกเมื่อ API พร้อม
  await new Promise(r => setTimeout(r, 500)); // จำลอง delay
  const rand = Math.random();
  if (rand < 0.25) return { label: 'snore', confidence: 0.82 };
  if (rand < 0.35) return { label: 'apnea', confidence: 0.76 };
  return { label: 'normal', confidence: 0.91 };
}
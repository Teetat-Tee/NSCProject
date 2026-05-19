// ====================================================
// ช่องรอ API — เพื่อนใส่ endpoint ตรงนี้เมื่อพร้อม
// ====================================================
const API_ENDPOINT = 'https://your-api-here.com/analyze';
const API_KEY = 'YOUR_API_KEY_HERE';

export async function analyzeAudio(audioBase64) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ audio: audioBase64 }),
    });
    return await res.json();
  } catch {
    // Mock ถ้า API ยังไม่พร้อม
    const rand = Math.random();
    if (rand < 0.25) return { label: 'snore', confidence: 0.82 };
    if (rand < 0.35) return { label: 'apnea', confidence: 0.76 };
    return { label: 'normal', confidence: 0.91 };
  }
}
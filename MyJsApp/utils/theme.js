// ============================================================
// theme.js — โทเค็นดีไซน์กลางของแอป (ทิศทางใหม่: calm clinical)
// ============================================================
// เปลี่ยนจาก dark navy + ฟ้าสด ไปเป็นโทนขาวนวล-ฟ้าหม่น
// อบอุ่นกว่า สงบกว่า เหมาะกับแอปสุขภาพ/การนอนหลับ
// ใช้ไฟล์นี้เป็นแหล่งสีเดียวเพื่อให้ทุกหน้าจอสอดคล้องกัน
// ============================================================

export const colors = {
  // พื้นหลัง
  bg: '#FAF8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EDE4',
  border: '#E8E2D5',

  // ข้อความ
  ink: '#2B2B2E',
  inkMuted: '#6B6B70',
  inkFaint: '#A4A29C',
  onPrimary: '#FFFFFF',

  // สีหลัก (dusk blue — สงบ ไม่ฉูดฉาด)
  primary: '#5B7FA6',
  primarySoft: '#E8EEF4',
  primaryDeep: '#3D5A78',

  // ระดับความเสี่ยง (desaturated เข้ากับโทนอุ่น)
  riskNormal: '#4F9D69',
  riskNormalSoft: '#E7F3EA',
  riskMild: '#D6A23C',
  riskMildSoft: '#FBF1DF',
  riskModerate: '#D17A3D',
  riskModerateSoft: '#FAEEE1',
  riskSevere: '#C1564E',
  riskSevereSoft: '#F8E7E5',

  // สีของแต่ละประเภทเหตุการณ์
  apnea: '#C1564E',
  snore: '#D6A23C',
  movement: '#5B7FA6',

  // อื่นๆ
  shadow: 'rgba(91, 74, 52, 0.08)',
};

export function riskTokens(label) {
  switch (label) {
    case 'ปกติ': return { color: colors.riskNormal, soft: colors.riskNormalSoft };
    case 'เล็กน้อย': return { color: colors.riskMild, soft: colors.riskMildSoft };
    case 'ปานกลาง': return { color: colors.riskModerate, soft: colors.riskModerateSoft };
    case 'รุนแรง': return { color: colors.riskSevere, soft: colors.riskSevereSoft };
    default: return { color: colors.primary, soft: colors.primarySoft };
  }
}

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#5B4A34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#5B4A34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
};

export const eventColor = (type) => {
  if (type === 'apnea') return colors.apnea;
  if (type === 'snore') return colors.snore;
  return colors.movement;
};
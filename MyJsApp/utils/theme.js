// ============================================================
// theme.js — Light Mode Only
// ============================================================

const light = {
  bg:           '#FAF8F4',
  surface:      '#FFFFFF',
  surfaceMuted: '#F1EDE4',
  border:       '#E8E2D5',
  ink:          '#2B2B2E',
  inkMuted:     '#6B6B70',
  inkFaint:     '#A4A29C',
  onPrimary:    '#FFFFFF',
  primary:      '#5B7FA6',
  primarySoft:  '#E8EEF4',
  primaryDeep:  '#3D5A78',
  riskNormal:      '#4F9D69',
  riskNormalSoft:  '#E7F3EA',
  riskMild:        '#D6A23C',
  riskMildSoft:    '#FBF1DF',
  riskModerate:    '#D17A3D',
  riskModerateSoft:'#FAEEE1',
  riskSevere:      '#C1564E',
  riskSevereSoft:  '#F8E7E5',
  apnea:    '#C1564E',
  snore:    '#D6A23C',
  movement: '#5B7FA6',
  shadow:   'rgba(91, 74, 52, 0.08)',
  tabBar:       '#FFFFFF',
  tabBorder:    '#E8E2D5',
  tabActive:    '#5B7FA6',
  tabInactive:  '#A4A29C',
};

// useTheme — always light
export function useTheme() {
  return { colors: light, isDark: false };
}

export const colors = light;

export const radius = {
  sm:   12,
  md:   16,
  lg:   22,
  xl:   28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor:   '#5B4A34',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     2,
  },
  raised: {
    shadowColor:   '#5B4A34',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius:  20,
    elevation:     4,
  },
  float: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius:  24,
    elevation:     12,
  },
};

export function riskTokens(label) {
  switch (label) {
    case 'ปกติ':     return { color: light.riskNormal,   soft: light.riskNormalSoft };
    case 'เล็กน้อย': return { color: light.riskMild,     soft: light.riskMildSoft };
    case 'ปานกลาง':  return { color: light.riskModerate, soft: light.riskModerateSoft };
    case 'รุนแรง':   return { color: light.riskSevere,   soft: light.riskSevereSoft };
    default:         return { color: light.primary,      soft: light.primarySoft };
  }
}

export function eventColor(type) {
  if (type === 'apnea') return light.apnea;
  if (type === 'snore') return light.snore;
  return light.movement;
}
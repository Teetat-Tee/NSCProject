// ============================================================
// modelHelper.js — DSP Engine for OSA Screening (no AI, no mock)
// ============================================================
//
// แนวคิดหลัก (ตาม feedback กรรมการ: "DSP อาจเพียงพอ ไม่จำเป็นต้องใช้ AI"):
//
// 1. CALIBRATION (8 วินาทีแรก)
//    วัดระดับเสียงพื้นฐานของห้อง (ambient noise) เพื่อตั้ง threshold
//    แบบ "สัมพัทธ์" (relative) แทนการใช้ค่า dB ตายตัว
//    -> ห้องเงียบ vs ห้องมีเสียงแอร์/พัดลม จะได้ threshold ต่างกันอัตโนมัติ
//
// 2. CLASSIFICATION (state machine บนหน้าต่างเวลาเลื่อน/rolling window)
//    ใช้ "รูปแบบ" ของเสียงดัง-เงียบ ไม่ใช่แค่ความดังขณะนั้น:
//      - ขยับตัว   = peak สั้น ๆ ไม่สม่ำเสมอ
//      - กรน       = เสียงดังต่อเนื่องเป็นจังหวะ (rhythmic)
//      - หยุดหายใจ = เสียงดัง/กรน -> เงียบสนิทกะทันหัน -> (มักตามด้วยเสียงหอบ/กรนดัง)
//      ซึ่งเป็น pattern ทางคลินิกที่ใช้จริงในการคัดกรอง OSA ด้วยเสียง
//
// 3. AHI = จำนวนครั้งที่ตรวจพบ apnea / ชั่วโมงการนอน (คำนวณใน ResultScreen.js)
//
// ขอบเขต: ใช้ dB metering จาก expo-av (ไม่ใช้ raw PCM/FFT) เนื่องจาก
// Expo managed workflow ไม่ expose raw audio buffer แบบ real-time
// การใช้ raw PCM + FFT ต้องเขียน native module (Swift/Kotlin) ซึ่งอยู่
// นอกขอบเขตของโปรเจกต์นี้ — งานวิจัย/แอปเชิงพาณิชย์ด้าน snore tracking
// ส่วนใหญ่ก็ใช้แนวทาง dB-pattern เช่นกัน
// ============================================================

// ---------- ค่าคงที่ปรับแต่งได้ ----------
const CALIBRATION_DURATION_MS = 8000;      // ระยะเวลา calibrate (8 วิ)
const SAMPLE_INTERVAL_MS = 150;            // sample ทุก 150ms
const ROLLING_WINDOW_SIZE = 15;            // ~2.25 วิ ของ sample ล่าสุด (15 * 150ms)

// threshold แบบสัมพัทธ์กับ baseline (dB)
const SNORE_OFFSET_DB = 12;                // baseline + 12dB = เริ่มถือว่าดัง (กรน)
const LOUD_OFFSET_DB = 20;                 // baseline + 20dB = ดังมาก (อาจเป็นกรนดัง/หอบ)
const SILENCE_OFFSET_DB = 4;               // baseline + 4dB = ถือว่ากลับสู่ความเงียบ

// เกณฑ์เวลา (วินาที) สำหรับแยกประเภทเหตุการณ์
const MOVEMENT_MAX_DURATION_S = 1.5;       // peak สั้น ๆ = ขยับตัว
const SNORE_MIN_DURATION_S = 1.5;          // เสียงดังต่อเนื่องอย่างน้อยเท่านี้ = กรน
const APNEA_SILENCE_MIN_S = 8;             // เงียบกะทันหันอย่างน้อยเท่านี้ (clinical: >=10s ตามมาตรฐาน
                                            // แต่ลดเป็น 8s เพื่อความไวในการคัดกรองเบื้องต้นบนมือถือ)
const APNEA_PRECEDING_LOUD_MIN_S = 3;      // ต้องมีเสียงดัง/กรนนำหน้าอย่างน้อยเท่านี้ก่อนเงียบ

// dB ต่ำสุดที่ระบบจะรับรู้ (เงียบสนิท / ไม่มีสัญญาณ)
const MIN_VALID_DB = -160;

/**
 * คำนวณ percentile ของ array ตัวเลข
 */
function percentile(arr, p) {
  if (arr.length === 0) return MIN_VALID_DB;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

function median(arr) {
  return percentile(arr, 50);
}

/**
 * ============================================================
 * CalibrationEngine
 * ใช้ตอนเริ่มบันทึก — เก็บ sample dB เป็นเวลา CALIBRATION_DURATION_MS
 * แล้วคำนวณ baseline + threshold ทั้งหมด
 * ============================================================
 */
export class CalibrationEngine {
  constructor() {
    this.samples = [];
    this.startTime = Date.now();
  }

  /** ป้อนค่า dB ระหว่าง calibrate */
  addSample(db) {
    if (typeof db === 'number' && db > MIN_VALID_DB) {
      this.samples.push(db);
    }
  }

  isDone() {
    return Date.now() - this.startTime >= CALIBRATION_DURATION_MS;
  }

  progress() {
    return Math.min(1, (Date.now() - this.startTime) / CALIBRATION_DURATION_MS);
  }

  /**
   * คืนค่า threshold profile สำหรับใช้ในการบันทึกจริง
   * ถ้าไม่มี sample เลย (เช่น mic error) ใช้ค่า fallback มาตรฐาน
   */
  finalize() {
    if (this.samples.length < 5) {
      // fallback: ห้องเงียบทั่วไปประมาณ -50dB เป็น baseline มาตรฐาน
      return {
        baselineDb: -50,
        noiseFloorDb: -60,
        snoreThreshold: -50 + SNORE_OFFSET_DB,
        loudThreshold: -50 + LOUD_OFFSET_DB,
        silenceThreshold: -50 + SILENCE_OFFSET_DB,
        sampleCount: 0,
        reliable: false,
      };
    }

    const baselineDb = median(this.samples);
    const noiseFloorDb = percentile(this.samples, 10);

    return {
      baselineDb,
      noiseFloorDb,
      snoreThreshold: baselineDb + SNORE_OFFSET_DB,
      loudThreshold: baselineDb + LOUD_OFFSET_DB,
      silenceThreshold: baselineDb + SILENCE_OFFSET_DB,
      sampleCount: this.samples.length,
      reliable: true,
    };
  }
}

/**
 * ============================================================
 * OSADetector
 * State machine วิเคราะห์เสียงแบบ real-time ระหว่างการบันทึก
 * เรียก .addSample(db, timestamp) ทุกครั้งที่มีค่า metering ใหม่
 * เมื่อพบ pattern ที่เข้าเกณฑ์ จะ trigger callback onEvent(event)
 * ============================================================
 */
export class OSADetector {
  /**
   * @param {object} calibration - ผลลัพธ์จาก CalibrationEngine.finalize()
   * @param {function} onEvent - callback เมื่อพบ event ใหม่ ({type, msg, time, confidence})
   */
  constructor(calibration, onEvent) {
    this.calibration = calibration;
    this.onEvent = onEvent;

    // rolling window ของ sample ล่าสุด: { db, t }
    this.window = [];

    // สถานะปัจจุบันของ state machine
    // 'quiet' | 'loud' | 'silent_gap'
    this.state = 'quiet';
    this.stateStartTime = Date.now();
    this.loudPeakDb = MIN_VALID_DB;
    this.loudDurationBeforeSilence = 0;

    // กันการแจ้งเตือนซ้ำในช่วงเวลาใกล้กัน
    this.lastEventTime = 0;
    this.MIN_EVENT_GAP_MS = 2000;
  }

  /**
   * ป้อนค่า dB ใหม่เข้า detector
   * @param {number} db - ค่า metering (dBFS, มักเป็นค่าลบ เช่น -40)
   */
  addSample(db) {
    const now = Date.now();
    if (typeof db !== 'number' || db <= MIN_VALID_DB) return;

    this.window.push({ db, t: now });
    if (this.window.length > ROLLING_WINDOW_SIZE) this.window.shift();

    this._updateStateMachine(db, now);
  }

  _updateStateMachine(db, now) {
    const { snoreThreshold, loudThreshold, silenceThreshold } = this.calibration;
    const isLoud = db >= snoreThreshold;
    const isSilent = db <= silenceThreshold;

    switch (this.state) {
      case 'quiet': {
        if (isLoud) {
          this.state = 'loud';
          this.stateStartTime = now;
          this.loudPeakDb = db;
        }
        break;
      }

      case 'loud': {
        this.loudPeakDb = Math.max(this.loudPeakDb, db);
        const loudDuration = (now - this.stateStartTime) / 1000;

        if (isSilent) {
          // เสียงดังเพิ่งหยุดกะทันหัน -> อาจเป็นจุดเริ่ม apnea หรือแค่ขยับตัว/กรนจบ
          this.loudDurationBeforeSilence = loudDuration;
          this.state = 'silent_gap';
          this.stateStartTime = now;
        } else if (!isLoud) {
          // เสียงค่อย ๆ ลดลงแต่ยังไม่เงียบสนิท -> จบ episode ปกติ
          this._resolveLoudEpisode(loudDuration, now);
          this.state = 'quiet';
        }
        // ถ้ายัง isLoud อยู่ -> คงสถานะ 'loud' ต่อไป (กำลังกรน/เสียงดังต่อเนื่อง)
        break;
      }

      case 'silent_gap': {
        const silentDuration = (now - this.stateStartTime) / 1000;

        if (isLoud) {
          // เสียงดังกลับมาหลังเงียบ -> ตรวจว่าเข้าเกณฑ์ apnea หรือไม่
          this._evaluateApneaCandidate(silentDuration, now);
          // เริ่ม episode ดังใหม่
          this.state = 'loud';
          this.stateStartTime = now;
          this.loudPeakDb = db;
        } else if (silentDuration > APNEA_SILENCE_MIN_S * 1.5) {
          // เงียบนานเกินไปโดยไม่มีเสียงดังตามมา -> อาจเป็นแค่ตื่น/หยุดกรนจริง ๆ
          // ไม่ trigger apnea (ต้องมีเสียงดัง/หอบตามมาถึงจะถือว่าเป็น apnea pattern)
          this.state = 'quiet';
        }
        break;
      }
    }
  }

  /** จบ episode เสียงดังโดยไม่มีช่วงเงียบตามมา -> จัดเป็นกรน หรือ ขยับตัว */
  _resolveLoudEpisode(durationS, now) {
    if (durationS >= SNORE_MIN_DURATION_S) {
      const confidence = Math.min(0.95, 0.6 + (durationS / 10) * 0.3);
      this._emit('snore', `เสียงกรน ${(confidence * 100).toFixed(0)}%`, now, confidence);
    } else if (durationS <= MOVEMENT_MAX_DURATION_S) {
      this._emit('movement', 'ขยับตัว', now, 0.7);
    }
    // duration ระหว่าง MOVEMENT_MAX กับ SNORE_MIN ถือว่าไม่ชัดเจนพอ -> ไม่บันทึก (ลด false positive)
  }

  /** ประเมินว่าช่วงเงียบที่ตามมาด้วยเสียงดังเข้าเกณฑ์ apnea หรือไม่ */
  _evaluateApneaCandidate(silentDurationS, now) {
    const hadEnoughLoudBefore = this.loudDurationBeforeSilence >= APNEA_PRECEDING_LOUD_MIN_S;
    const hadEnoughSilence = silentDurationS >= APNEA_SILENCE_MIN_S;

    if (hadEnoughLoudBefore && hadEnoughSilence) {
      // คำนวณ confidence จากความยาวของช่วงเงียบ + ความดังของเสียงก่อนเงียบ
      const silenceFactor = Math.min(1, silentDurationS / (APNEA_SILENCE_MIN_S * 2));
      const loudnessFactor = Math.min(
        1,
        Math.max(0, (this.loudPeakDb - this.calibration.snoreThreshold) / 15)
      );
      const confidence = Math.min(0.97, 0.55 + silenceFactor * 0.25 + loudnessFactor * 0.2);

      this._emit(
        'apnea',
        `⚠️ หยุดหายใจ ${(confidence * 100).toFixed(0)}%`,
        now,
        confidence
      );
    } else if (this.loudDurationBeforeSilence >= SNORE_MIN_DURATION_S) {
      // มีเสียงดังพอที่จะนับเป็นกรน แต่ช่วงเงียบไม่นานพอจะเป็น apnea
      const confidence = 0.65;
      this._emit('snore', `เสียงกรน ${(confidence * 100).toFixed(0)}%`, now, confidence);
    }
  }

  _emit(type, msg, now, confidence) {
    if (now - this.lastEventTime < this.MIN_EVENT_GAP_MS) return; // กันแจ้งซ้ำถี่เกินไป
    this.lastEventTime = now;

    const time = new Date(now).toLocaleTimeString('th-TH');
    const event = { type, msg, time, confidence, timestamp: now };

    if (typeof this.onEvent === 'function') {
      this.onEvent(event);
    }
  }

  /**
   * เรียกตอนหยุดบันทึก เพื่อ flush episode ที่ค้างอยู่ใน state 'loud'
   * (ป้องกันกรณีอัดเสียงจบขณะกำลังกรน/เสียงดังพอดี)
   */
  flush() {
    if (this.state === 'loud') {
      const durationS = (Date.now() - this.stateStartTime) / 1000;
      this._resolveLoudEpisode(durationS, Date.now());
    }
  }
}

/**
 * ============================================================
 * Utility: คำนวณ AHI จากจำนวน apnea events และระยะเวลานอน (วินาที)
 * ============================================================
 */
export function calculateAHI(apneaCount, sleepDurationSeconds) {
  const hours = Math.max(sleepDurationSeconds / 3600, 0.1); // กัน /0
  return Number((apneaCount / hours).toFixed(1));
}

/**
 * ============================================================
 * Utility: แปลงค่า AHI เป็นระดับความเสี่ยง (ใช้ร่วมกับ ResultScreen.js)
 * ============================================================
 */
export function classifyRisk(ahi) {
  const v = Number(ahi);
  if (v < 5) return { label: 'ปกติ', color: '#22c55e' };
  if (v < 15) return { label: 'เล็กน้อย', color: '#f59e0b' };
  if (v < 30) return { label: 'ปานกลาง', color: '#f97316' };
  return { label: 'รุนแรง', color: '#ef4444' };
}

export const SAMPLE_INTERVAL = SAMPLE_INTERVAL_MS;
export const CALIBRATION_DURATION = CALIBRATION_DURATION_MS;
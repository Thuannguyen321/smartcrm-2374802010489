/**
 * QT-04 - Tinh han cam ket SLA theo GIO LAM VIEC.
 * Cau hinh doc tu src/config/sla.config.json (NFR6: doi gio SLA chi sua file cau hinh).
 * Gio lam viec tinh theo mui gio cua trung tam (utcOffsetMinutes, Viet Nam = +420).
 * Ham thuan: nhan `from` (Date) va `config`, tra ve Date -> test duoc khong can CSDL.
 */
const defaultConfig = require('../config/sla.config.json');

const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const MINUTE = 60 * 1000;

function parseHm(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Cong `hours` gio lam viec vao thoi diem `from`.
 * Neu `from` nam ngoai gio lam viec thi bat dau dem tu dau ca lam viec ke tiep.
 */
function addBusinessHours(from, hours, config = defaultConfig) {
  const offset = config.utcOffsetMinutes || 0;
  const startMin = parseHm(config.workStart);
  const endMin = parseHm(config.workEnd);
  const workingDays = new Set(config.workingDays);
  if (endMin <= startMin || workingDays.size === 0) {
    throw new Error('Cau hinh SLA khong hop le: workEnd phai sau workStart va co it nhat 1 ngay lam viec');
  }

  // Lam viec tren "gio dia phuong" bieu dien bang Date UTC da dich offset.
  let local = new Date(from.getTime() + offset * MINUTE);
  let remaining = Math.round(hours * 60);

  while (remaining > 0) {
    const dayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
    const minuteOfDay = local.getUTCHours() * 60 + local.getUTCMinutes();
    const isWorkingDay = workingDays.has(local.getUTCDay());

    if (!isWorkingDay || minuteOfDay >= endMin) {
      local = new Date(dayStart + 24 * 60 * MINUTE + startMin * MINUTE); // dau ca ngay hom sau
      continue;
    }
    if (minuteOfDay < startMin) {
      local = new Date(dayStart + startMin * MINUTE);
      continue;
    }
    const available = endMin - minuteOfDay;
    const used = Math.min(available, remaining);
    local = new Date(local.getTime() + used * MINUTE);
    remaining -= used;
  }
  return new Date(local.getTime() - offset * MINUTE);
}

function computeDueDate(receivedAt, priority, config = defaultConfig) {
  if (!PRIORITIES.includes(priority)) {
    throw new Error(`Mức ưu tiên không hợp lệ: ${priority}`);
  }
  return addBusinessHours(receivedAt, config.hoursByPriority[priority], config);
}

/** Trang thai SLA de loc danh sach: TRE_HAN / SAP_TRE / TRONG_HAN. */
function slaState(dueDate, now, config = defaultConfig) {
  const due = new Date(dueDate).getTime();
  const t = now.getTime();
  if (t > due) return 'TRE_HAN';
  if (due - t <= (config.nearDueHours || 4) * 60 * MINUTE) return 'SAP_TRE';
  return 'TRONG_HAN';
}

module.exports = { addBusinessHours, computeDueDate, slaState, PRIORITIES };

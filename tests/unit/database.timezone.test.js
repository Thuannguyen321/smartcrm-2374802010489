// BUG-08: mui gio phien CSDL phai trung mui gio cua tien trinh Node (POSIX dao dau).
const { sessionTimeZone } = require('../../src/config/database');

const voiOffset = (phut) => ({ getTimezoneOffset: () => -phut });

describe('sessionTimeZone (BUG-08)', () => {
  test('[luong dung] gio Viet Nam UTC+7 -> "<+07>-07"', () => {
    expect(sessionTimeZone(voiOffset(420))).toBe('<+07>-07');
  });
  test('[bien] UTC -> "<+00>-00"', () => {
    expect(sessionTimeZone(voiOffset(0))).toBe('<+00>-00');
  });
  test('[bien] mui gio le phut (UTC+5:30) va mui gio am (UTC-3)', () => {
    expect(sessionTimeZone(voiOffset(330))).toBe('<+0530>-05:30');
    expect(sessionTimeZone(voiOffset(-180))).toBe('<-03>+03');
  });
});

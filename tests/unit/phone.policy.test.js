const { normalizePhone, maskPhone } = require('../../src/policies/phone.policy');

describe('normalizePhone — QT-02', () => {
  test.each([
    ['0901234567', '0901234567'],
    ['090 123 4567', '0901234567'],
    ['090.123.4567', '0901234567'],
    ['+84 901 234 567', '0901234567'],
    ['84901234567', '0901234567'],
  ])('[luong dung] "%s" -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  test.each([
    ['090123456', '9 chu so'],
    ['09012345678', '11 chu so'],
    ['1901234567', 'khong bat dau bang 0'],
    ['09012abc67', 'co chu cai'],
    ['', 'chuoi rong'],
  ])('[du lieu sai/bien] "%s" (%s) -> null', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  test('NFR4: che SDT dang 090****567', () => {
    expect(maskPhone('0901234567')).toBe('090****567');
  });
});

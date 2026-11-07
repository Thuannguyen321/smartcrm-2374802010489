// BUG-09: id vuot pham vi so nguyen -> phai bi chan o lop nghiep vu (400), khong de CSDL bao 500.
const { toPositiveInt, MAX_INT4 } = require('../../src/utils/validate');

describe('toPositiveInt (BUG-09)', () => {
  test('[luong dung] "15" -> 15', () => expect(toPositiveInt('15')).toBe(15));
  test('[du lieu sai] 0, -1, "abc", 1.5 -> null', () => {
    for (const v of [0, -1, 'abc', 1.5]) expect(toPositiveInt(v)).toBeNull();
  });
  test('[bien] 9007199254740991 nhan, 99999999999999999999 -> null', () => {
    expect(toPositiveInt('9007199254740991')).toBe(9007199254740991);
    expect(toPositiveInt('99999999999999999999')).toBeNull();
  });
  test('[bien] cot INT: 2147483647 nhan, 2147483648 -> null', () => {
    expect(toPositiveInt(2147483647, MAX_INT4)).toBe(2147483647);
    expect(toPositiveInt(2147483648, MAX_INT4)).toBeNull();
  });
});

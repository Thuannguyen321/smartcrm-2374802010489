const { createCustomerService } = require('../../src/services/customer.service');
const { buildFakes } = require('../helpers/fakeRepos');

function setup() {
  const f = buildFakes();
  return { f, service: createCustomerService({ db: {}, customerRepo: f.customerRepo }) };
}

describe('CustomerService — FR1, FR2', () => {
  test('[luong dung] tra cuu SDT co khoang trang van tim dung khach (QT-02)', async () => {
    const { service } = setup();
    const c = await service.findByPhone(' 090 123 4567 ');
    expect(c.full_name).toBe('Nguyen Van An');
  });

  test('[luong dung] tao khach moi voi SDT +84 -> luu dang 0xxxxxxxxx', async () => {
    const { service } = setup();
    const c = await service.create({ fullName: 'Le Thi Hoa', phone: '+84 933 444 555' });
    expect(c.phone).toBe('0933444555');
  });

  test('[du lieu sai] SDT da ton tai -> XUNG_DOT (QT-01)', async () => {
    const { service } = setup();
    await expect(service.create({ fullName: 'Trung SDT', phone: '0901234567' })).rejects.toMatchObject({ code: 'XUNG_DOT' });
  });

  test('[du lieu sai] SDT 9 chu so -> DU_LIEU_KHONG_HOP_LE', async () => {
    const { service } = setup();
    await expect(service.create({ fullName: 'Sai SDT', phone: '090123456' })).rejects.toMatchObject({
      code: 'DU_LIEU_KHONG_HOP_LE',
      details: { phone: expect.any(String) },
    });
  });

  test('[bien] khong xoa duoc khach dang co thiet bi', async () => {
    const { service } = setup();
    await expect(service.remove(1)).rejects.toMatchObject({ code: 'XUNG_DOT' });
  });
});

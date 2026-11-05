const { createTicketService } = require('../../src/services/ticket.service');
const { buildFakes } = require('../helpers/fakeRepos');

const slaConfig = {
  utcOffsetMinutes: 420, workingDays: [1, 2, 3, 4, 5, 6], workStart: '08:00', workEnd: '17:30',
  hoursByPriority: { CAO: 24, TRUNG_BINH: 72, THAP: 120 }, nearDueHours: 4,
};
const NOW = new Date('2026-11-02T02:00:00Z'); // T2 09:00 gio VN
const receptionist = { employeeId: 1, role: 'RECEPTIONIST', centerId: 1 };
const manager = { employeeId: 2, role: 'MANAGER', centerId: 1 };

function setup() {
  const f = buildFakes();
  const service = createTicketService({ db: {}, ...f, slaConfig, clock: () => NOW });
  return { f, service };
}

const validInput = { phone: '090 123 4567', serialNo: 'sn-ip15-2026-88', categoryId: 1, issueDesc: 'Man hinh chop nhay' };

describe('TicketService.createTicket — UC04', () => {
  test('[luong dung] tao phieu MOI, ma BH-xxxxxx/2026, uu tien theo nhom, co 1 dong log', async () => {
    const { f, service } = setup();
    const r = await service.createTicket(validInput, receptionist);
    expect(r.ticketCode).toBe('BH-100001/2026');
    expect(r.status).toBe('MOI');
    expect(r.priority).toBe('CAO'); // QT-A1: mac dinh theo nhom "Man hinh"
    expect(r.warrantyResult).toBe('CON_BAO_HANH');
    expect(r.dueDate).toBe('2026-11-04T07:00:00.000Z'); // T4 14:00 gio VN
    expect(f.state.logs).toHaveLength(1);
    expect(f.state.logs[0]).toMatchObject({ fromStatus: null, toStatus: 'MOI', changedBy: 1 });
  });

  test('[luong dung] nhan vien doi muc uu tien thi dung muc da chon', async () => {
    const { service } = setup();
    const r = await service.createTicket({ ...validInput, priority: 'THAP' }, receptionist);
    expect(r.priority).toBe('THAP');
  });

  test('[ngoai le 4a] thiet bi thieu ngay mua -> CHO_XAC_MINH', async () => {
    const { service } = setup();
    const r = await service.createTicket(
      { phone: '0912345678', serialNo: 'SN-NODATE-0001', categoryId: 4, issueDesc: 'Treo logo' },
      receptionist
    );
    expect(r.status).toBe('CHO_XAC_MINH');
    expect(r.warrantyResult).toBe('CHUA_XAC_MINH_BAO_HANH');
  });

  test('[luong dung] thiet bi het bao hanh -> MOI nhung is_warranty = false (sua tinh phi)', async () => {
    const { service } = setup();
    const r = await service.createTicket({ ...validInput, serialNo: 'SN-OLD-2023-01' }, receptionist);
    expect(r.status).toBe('MOI');
    expect(r.isWarranty).toBe(false);
  });

  test('[du lieu sai] thieu mo ta va SDT sai -> DU_LIEU_KHONG_HOP_LE, khong ghi gi vao CSDL', async () => {
    const { f, service } = setup();
    await expect(service.createTicket({ phone: '123', serialNo: '', issueDesc: '' }, receptionist)).rejects.toMatchObject({
      code: 'DU_LIEU_KHONG_HOP_LE',
      details: expect.objectContaining({ phone: expect.any(String), issueDesc: expect.any(String) }),
    });
    expect(f.state.tickets).toHaveLength(0);
  });

  test('[ngoai le 3a] Serial/IMEI thuoc khach khac -> XUNG_DOT (QT-03)', async () => {
    const { service } = setup();
    await expect(
      service.createTicket({ ...validInput, phone: '0912345678' }, receptionist)
    ).rejects.toMatchObject({ code: 'XUNG_DOT' });
  });

  test('[ngoai le 5a / NFR5] loi giua chung khi ghi log -> ROLLBACK, khong con phieu do dang', async () => {
    const { f, service } = setup();
    f.ticketRepo.insertStatusLog = async () => {
      throw new Error('mat ket noi CSDL');
    };
    await expect(service.createTicket(validInput, receptionist)).rejects.toThrow('mat ket noi CSDL');
    expect(f.state.tickets).toHaveLength(0);
    expect(f.state.transactions.rolledBack).toBe(1);
  });
});

describe('TicketService.reviewTicket — UC07 / QT-A3', () => {
  async function pendingTicket() {
    const ctx = setup();
    const r = await ctx.service.createTicket(
      { phone: '0912345678', serialNo: 'SN-NODATE-0001', categoryId: 4, issueDesc: 'Treo logo' },
      receptionist
    );
    return { ...ctx, id: r.ticketId };
  }

  test('[luong dung] quan ly CHAP_NHAN -> MOI, is_warranty = true, them dong log co ghi chu', async () => {
    const { f, service, id } = await pendingTicket();
    await service.reviewTicket(id, { decision: 'CHAP_NHAN', note: 'Khach co hoa don mua hang' }, manager);
    expect(f.state.tickets[0]).toMatchObject({ status: 'MOI', isWarranty: true });
    expect(f.state.logs[1].note).toBe('CHAP_NHAN: Khach co hoa don mua hang');
  });

  test('[du lieu sai] thieu ghi chu xet duyet -> DU_LIEU_KHONG_HOP_LE', async () => {
    const { service, id } = await pendingTicket();
    await expect(service.reviewTicket(id, { decision: 'TU_CHOI', note: '' }, manager)).rejects.toMatchObject({
      code: 'DU_LIEU_KHONG_HOP_LE',
    });
  });

  test('[phan quyen] nhan vien tiep nhan khong duoc xet duyet -> KHONG_DU_QUYEN', async () => {
    const { service, id } = await pendingTicket();
    await expect(service.reviewTicket(id, { decision: 'CHAP_NHAN', note: 'Dong y bao hanh' }, receptionist)).rejects.toMatchObject({
      code: 'KHONG_DU_QUYEN',
    });
  });

  test('[bien] xet duyet lan thu hai -> SAI_TRANG_THAI (khong ghi de quyet dinh da luu)', async () => {
    const { service, id } = await pendingTicket();
    await service.reviewTicket(id, { decision: 'TU_CHOI', note: 'Khong co chung tu mua' }, manager);
    await expect(service.reviewTicket(id, { decision: 'CHAP_NHAN', note: 'Doi y kien' }, manager)).rejects.toMatchObject({
      code: 'SAI_TRANG_THAI',
    });
  });

  test('[phan quyen] quan ly trung tam khac -> KHONG_DU_QUYEN', async () => {
    const { service, id } = await pendingTicket();
    await expect(
      service.reviewTicket(id, { decision: 'CHAP_NHAN', note: 'Dong y bao hanh' }, { ...manager, centerId: 2 })
    ).rejects.toMatchObject({ code: 'KHONG_DU_QUYEN' });
  });
});

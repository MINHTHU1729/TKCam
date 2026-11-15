const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const eth = (s) => ethers.parseEther(s);
const MOT_NGAY = 24 * 60 * 60;

describe("TKCam – thuê theo báo giá có chữ ký", () => {
  let hopDong, chu, khach, khac;
  const SERI = "CN-G7X2-0003";
  const GIA = eth("0.003");
  const COC = eth("0.03");

  // Chủ cửa hàng ký báo giá (miễn phí, không phải giao dịch)
  async function kyBaoGia(nguoiKy, maMay = 1, seri = SERI, gia = GIA, coc = COC, hetHan = null) {
    hetHan ??= (await time.latest()) + 365 * MOT_NGAY;
    const bam = await hopDong.bamBaoGia(maMay, seri, gia, coc, hetHan);
    const chuKy = await nguoiKy.signMessage(ethers.getBytes(bam));
    return { maMay, seri, gia, coc, hetHan, chuKy };
  }
  const thue = (ai, bg, soNgay = 2, giaTri = null) =>
    hopDong.connect(ai).rent(bg.maMay, bg.seri, bg.gia, bg.coc, bg.hetHan, soNgay, bg.chuKy, {
      value: giaTri ?? bg.gia * BigInt(soNgay) + bg.coc,
    });

  beforeEach(async () => {
    [chu, khach, khac] = await ethers.getSigners();
    hopDong = await (await ethers.getContractFactory("TKCam")).deploy();
  });

  it("Báo giá đúng chữ ký chủ thì hợp lệ, ký bởi người khác thì không", async () => {
    const dung = await kyBaoGia(chu);
    expect(await hopDong.kiemTraBaoGia(dung.maMay, dung.seri, dung.gia, dung.coc, dung.hetHan, dung.chuKy)).to.equal(true);
    const gia = await kyBaoGia(khach);
    expect(await hopDong.kiemTraBaoGia(gia.maMay, gia.seri, gia.gia, gia.coc, gia.hetHan, gia.chuKy)).to.equal(false);
  });

  it("Thuê: đúng tiền thì thành công, máy bận; sai tiền / sửa giá / chữ ký giả / hết hạn đều bị chặn", async () => {
    const bg = await kyBaoGia(chu);
    await expect(thue(khach, bg, 2, eth("0.01"))).to.be.revertedWith("So tien gui khong dung");
    // Khách tự hạ giá nhưng giữ chữ ký cũ
    await expect(thue(khach, { ...bg, gia: eth("0.000001") })).to.be.revertedWith("Bao gia khong hop le");
    await expect(thue(khach, await kyBaoGia(khach))).to.be.revertedWith("Bao gia khong hop le");
    const hetHan = await kyBaoGia(chu, 1, SERI, GIA, COC, (await time.latest()) + 10);
    await time.increase(20);
    await expect(thue(khach, hetHan)).to.be.revertedWith("Bao gia het han");

    await expect(thue(khach, bg)).to.emit(hopDong, "Rented");
    expect(await hopDong.donHienTai(1)).to.equal(1n);
    await expect(thue(khac, bg)).to.be.revertedWith("May chua san sang");
    const d = await hopDong.getRental(1);
    expect(d.tienThue).to.equal(GIA * 2n);
    expect(d.giaNgay).to.equal(GIA);
  });

  it("Trả đúng hạn: hoàn đủ cọc cho khách, chủ nhận tiền thuê, máy rảnh lại", async () => {
    await thue(khach, await kyBaoGia(chu));
    await expect(hopDong.confirmReturn(1, SERI, 0)).to.changeEtherBalances([khach, chu], [COC, GIA * 2n]);
    expect(await hopDong.donHienTai(1)).to.equal(0n);
    expect((await hopDong.getRental(1)).trangThai).to.equal(1n);
  });

  it("Trả trễ 2 ngày: trừ 2 ngày phí vào cọc", async () => {
    await thue(khach, await kyBaoGia(chu));
    await time.increase(4 * MOT_NGAY - 60);
    await expect(hopDong.confirmReturn(1, SERI, 0)).to.changeEtherBalance(khach, COC - GIA * 2n);
    expect((await hopDong.getRental(1)).phiTre).to.equal(GIA * 2n);
  });

  it("Hư hỏng: khấu trừ cọc, không vượt quá số cọc còn lại", async () => {
    await thue(khach, await kyBaoGia(chu));
    await expect(hopDong.confirmReturn(1, SERI, eth("1"))).to.changeEtherBalance(khach, 0);
    expect((await hopDong.getRental(1)).tienHuHong).to.equal(COC);
  });

  it("Sai seri thì không hoàn cọc; người khác không xác nhận trả được", async () => {
    await thue(khach, await kyBaoGia(chu));
    await expect(hopDong.confirmReturn(1, "SAI-SERI", 0)).to.be.revertedWith("Seri khong khop, sai may");
    await expect(hopDong.connect(khach).confirmReturn(1, SERI, 0)).to.be.revertedWith("Chi chu cua hang duoc thuc hien");
  });

  it("Hủy trong 1 giờ: hoàn toàn bộ; quá 1 giờ thì không hủy được", async () => {
    const bg = await kyBaoGia(chu);
    await thue(khach, bg);
    await expect(hopDong.connect(khach).cancelRental(1)).to.changeEtherBalance(khach, GIA * 2n + COC);
    expect(await hopDong.donHienTai(1)).to.equal(0n);
    await thue(khach, bg);
    await time.increase(2 * 60 * 60);
    await expect(hopDong.connect(khach).cancelRental(2)).to.be.revertedWith("Qua thoi gian huy (1 gio)");
  });

  it("Một ví vừa là chủ vừa thuê được (dùng 1 tài khoản)", async () => {
    await expect(thue(chu, await kyBaoGia(chu))).to.emit(hopDong, "Rented");
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const eth = (x) => ethers.parseEther(String(x));
const NGAY = 24 * 60 * 60;

describe("TKCam", function () {
  let hopDong, chu, khach, khach2;

  beforeEach(async () => {
    [chu, khach, khach2] = await ethers.getSigners();
    hopDong = await ethers.deployContract("TKCam");
    await hopDong.listCamera("CN-G7X2-0003", "Canon G7X", eth("0.003"), eth("0.03"));
  });

  it("Admin đăng máy, không cho trùng seri, người khác không đăng được", async () => {
    expect(await hopDong.cameraCount()).to.equal(1n);
    await expect(hopDong.listCamera("CN-G7X2-0003", "X", 1, 1)).to.be.revertedWith("Seri da ton tai");
    await expect(hopDong.connect(khach).listCamera("A", "B", 1, 1)).to.be.revertedWith("Chi chu cua hang duoc thuc hien");
  });

  it("Thuê máy: phải gửi đúng số tiền, máy chuyển sang đang thuê", async () => {
    await expect(hopDong.connect(khach).rent(1, 2, { value: eth("0.01") })).to.be.revertedWith("So tien gui khong dung");
    await expect(hopDong.connect(khach).rent(1, 2, { value: eth("0.036") }))
      .to.emit(hopDong, "Rented").withArgs(1, 1, khach.address, 2, eth("0.036"));
    const may = await hopDong.getCamera(1);
    expect(may.status).to.equal(1); // DangThue
    await expect(hopDong.connect(khach2).rent(1, 1, { value: eth("0.033") })).to.be.revertedWith("May chua san sang");
    expect(await hopDong.getRentalsOf(khach.address)).to.deep.equal([1n]);
  });

  it("Trả đúng hạn: hoàn đủ cọc cho khách, chủ nhận tiền thuê", async () => {
    await hopDong.connect(khach).rent(1, 2, { value: eth("0.036") });
    await time.increase(NGAY);
    const tx = hopDong.confirmReturn(1, "CN-G7X2-0003", 0);
    await expect(tx).to.changeEtherBalances([khach, chu, hopDong], [eth("0.03"), eth("0.006"), eth("-0.036")]);
    expect((await hopDong.getCamera(1)).status).to.equal(0);
  });

  it("Trả trễ 2 ngày: trừ 2 ngày phí vào cọc", async () => {
    await hopDong.connect(khach).rent(1, 1, { value: eth("0.033") });
    await time.increase(NGAY + NGAY + 3600); // trễ 1 ngày 1 giờ -> làm tròn 2 ngày
    await expect(hopDong.confirmReturn(1, "CN-G7X2-0003", 0))
      .to.emit(hopDong, "Returned").withArgs(1, eth("0.024"), eth("0.006"), 0);
  });

  it("Hư hỏng: khấu trừ cọc, không vượt quá số cọc còn lại", async () => {
    await hopDong.connect(khach).rent(1, 1, { value: eth("0.033") });
    await expect(hopDong.confirmReturn(1, "CN-G7X2-0003", eth("0.01")))
      .to.emit(hopDong, "Returned").withArgs(1, eth("0.02"), 0, eth("0.01"));
  });

  it("Sai seri thì không hoàn cọc", async () => {
    await hopDong.connect(khach).rent(1, 1, { value: eth("0.033") });
    await expect(hopDong.confirmReturn(1, "SAI-SERI", 0)).to.be.revertedWith("Seri khong khop, sai may");
  });

  it("Hủy trong 1 giờ: hoàn toàn bộ, quá 1 giờ thì không hủy được", async () => {
    await hopDong.connect(khach).rent(1, 1, { value: eth("0.033") });
    await expect(hopDong.connect(khach).cancelRental(1)).to.changeEtherBalance(khach, eth("0.033"));
    await hopDong.connect(khach).rent(1, 1, { value: eth("0.033") });
    await time.increase(2 * 3600);
    await expect(hopDong.connect(khach).cancelRental(2)).to.be.revertedWith("Qua thoi gian huy (1 gio)");
  });

  it("Máy bảo trì thì không thuê được", async () => {
    await hopDong.setMaintenance(1, true);
    await expect(hopDong.connect(khach).rent(1, 1, { value: eth("0.033") })).to.be.revertedWith("May chua san sang");
  });

  it("Một ví vừa là chủ vừa thuê được (dùng 1 tài khoản)", async () => {
    await expect(hopDong.rent(1, 1, { value: eth("0.033") })).to.emit(hopDong, "Rented");
    await expect(hopDong.confirmReturn(1, "CN-G7X2-0003", 0)).to.emit(hopDong, "Returned").withArgs(1, eth("0.03"), 0, 0);
  });
});

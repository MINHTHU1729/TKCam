// Bật / tắt bảo trì cho một máy ảnh trên hợp đồng (chỉ ví chủ cửa hàng chạy được).
// PowerShell:
//   $env:MA_MAY=5; $env:BAO_TRI="false"; npx hardhat run scripts/doiTrangThai.js --network sepolia
//   MA_MAY  = mã máy (id trong mayanh.json)
//   BAO_TRI = "true" để đưa vào bảo trì, "false" để mở cho thuê lại
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

// Đọc địa chỉ hợp đồng từ frontend/.env
function layDiaChiHopDong() {
  const fileEnv = path.join(__dirname, "..", "..", "frontend", ".env");
  const noiDung = fs.readFileSync(fileEnv, "utf8");
  const khop = noiDung.match(/^VITE_CONTRACT_ADDRESS=(0x[0-9a-fA-F]{40})/m);
  if (!khop) throw new Error("Không tìm thấy VITE_CONTRACT_ADDRESS trong frontend/.env");
  return khop[1];
}

async function main() {
  const maMay = Number(process.env.MA_MAY);
  const baoTri = process.env.BAO_TRI === "true";
  if (!maMay) throw new Error('Thiếu mã máy. Ví dụ: $env:MA_MAY=5; $env:BAO_TRI="false"');

  const diaChi = layDiaChiHopDong();
  const hopDong = await hre.ethers.getContractAt("TKCam", diaChi);
  const truoc = await hopDong.getCamera(maMay);
  const TEN = ["Sẵn sàng", "Đang cho thuê", "Bảo trì"];
  console.log(`Hợp đồng: ${diaChi}`);
  console.log(`Máy #${maMay} ${truoc.name}: ${TEN[Number(truoc.status)]}`);

  const gas = await hopDong.setMaintenance.estimateGas(maMay, baoTri);
  await (await hopDong.setMaintenance(maMay, baoTri, { gasLimit: (gas * 13n) / 10n })).wait();

  const sau = await hopDong.getCamera(maMay);
  console.log(`✅ Đã đổi thành: ${TEN[Number(sau.status)]}`);
}

main().catch((e) => {
  console.error(e.shortMessage || e.reason || e.message || e);
  process.exitCode = 1;
});

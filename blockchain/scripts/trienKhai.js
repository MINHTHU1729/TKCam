// Triển khai hợp đồng TKCam, đăng sẵn máy ảnh mẫu, rồi ghi địa chỉ + ABI sang frontend.
// Chạy:  npx hardhat run scripts/trienKhai.js --network localhost
//   hoặc npx hardhat run scripts/trienKhai.js --network sepolia
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const THU_MUC_FRONTEND = path.join(__dirname, "..", "..", "frontend");
const FILE_MAY_MAU = path.join(THU_MUC_FRONTEND, "src", "dulieu", "mayanh.json");
const FILE_ABI = path.join(THU_MUC_FRONTEND, "src", "hopdong", "TKCam.json");
const FILE_ENV = path.join(THU_MUC_FRONTEND, ".env");

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// Ghi / sửa một dòng KHOA=giatri trong file .env
function ghiEnv(khoa, giaTri) {
  let noiDung = fs.existsSync(FILE_ENV) ? fs.readFileSync(FILE_ENV, "utf8") : "";
  const dong = `${khoa}=${giaTri}`;
  const mau = new RegExp(`^${khoa}=.*$`, "m");
  noiDung = mau.test(noiDung) ? noiDung.replace(mau, dong) : `${noiDung.trimEnd()}\n${dong}\n`;
  fs.writeFileSync(FILE_ENV, noiDung);
}

// Chờ đến khi RPC thấy mã hợp đồng tại địa chỉ (RPC công cộng có nhiều máy chủ, có máy chậm)
async function choThayHopDong(diaChi) {
  for (let lan = 0; lan < 40; lan++) {
    const ma = await hre.ethers.provider.getCode(diaChi);
    if (ma && ma !== "0x") return;
    await ngu(3000);
  }
  throw new Error("Không thấy hợp đồng trên mạng sau 2 phút");
}

// Gửi giao dịch với gas ước lượng từ chính mạng đang dùng, cộng thêm 30% dự phòng.
// Nếu ước lượng quá thấp (máy chủ RPC chưa thấy hợp đồng) thì chờ rồi ước lượng lại.
async function guiGiaoDich(hamGoi, ...thamSo) {
  let gas = 0n;
  for (let lan = 0; lan < 10; lan++) {
    gas = await hamGoi.estimateGas(...thamSo);
    if (gas > 50000n) break;
    await ngu(3000);
  }
  const bienNhan = await (await hamGoi(...thamSo, { gasLimit: (gas * 13n) / 10n })).wait();
  if (bienNhan.status !== 1) throw new Error(`Giao dịch thất bại: ${bienNhan.hash}`);
  return bienNhan;
}

async function main() {
  const { ethers, network } = hre;
  const [chuCuaHang] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  console.log(`Mạng: ${network.name} (chainId ${chainId})`);
  console.log(`Ví chủ cửa hàng: ${chuCuaHang.address}`);
  console.log(`Số dư: ${ethers.formatEther(await ethers.provider.getBalance(chuCuaHang.address))} ETH`);

  // 1. Triển khai
  const hopDong = await ethers.deployContract("TKCam");
  await hopDong.waitForDeployment();
  const diaChi = await hopDong.getAddress();
  if (chainId !== 31337) {
    console.log("⏳ Chờ mạng xác nhận hợp đồng...");
    await hopDong.deploymentTransaction().wait(2);
    await choThayHopDong(diaChi);
  }
  console.log(`✅ Đã triển khai TKCam tại: ${diaChi}`);

  // 2. Đăng máy ảnh mẫu (mã máy trên hợp đồng = id trong mayanh.json)
  const danhSach = JSON.parse(fs.readFileSync(FILE_MAY_MAU, "utf8")).sort((a, b) => a.id - b.id);
  for (const may of danhSach) {
    const bn = await guiGiaoDich(
      hopDong.listCamera,
      may.seri,
      may.ten,
      ethers.parseEther(String(may.giaNgay)),
      ethers.parseEther(String(may.coc))
    );
    if (may.trangThai === "bao-tri") await guiGiaoDich(hopDong.setMaintenance, may.id, true);
    console.log(`   + Máy #${may.id} ${may.ten} (${may.seri}) – gas ${bn.gasUsed}`);
  }

  // 3. Mạng local: nạp sẵn ETH test cho ví của bạn (điền VI_NHAN_ETH trong blockchain/.env)
  if (chainId === 31337 && process.env.VI_NHAN_ETH) {
    await (await chuCuaHang.sendTransaction({ to: process.env.VI_NHAN_ETH, value: ethers.parseEther("100") })).wait();
    console.log(`💰 Đã nạp 100 ETH test cho ${process.env.VI_NHAN_ETH}`);
  }

  // 4. Ghi ABI + địa chỉ sang frontend
  const artifact = await hre.artifacts.readArtifact("TKCam");
  fs.writeFileSync(FILE_ABI, JSON.stringify({ contractName: "TKCam", address: diaChi, chainId, abi: artifact.abi }, null, 2));
  ghiEnv("VITE_CONTRACT_ADDRESS", diaChi);
  ghiEnv("VITE_CHAIN_ID", chainId);
  ghiEnv("VITE_CHAIN_NAME", chainId === 31337 ? "Hardhat Local" : "Sepolia");
  console.log("📝 Đã cập nhật frontend/src/hopdong/TKCam.json và frontend/.env");
  console.log("👉 Khởi động lại frontend (Ctrl + C rồi npm run dev) để nhận địa chỉ mới.");
}

main().catch((e) => {
  console.error(e.shortMessage || e.message || e);
  process.exitCode = 1;
});

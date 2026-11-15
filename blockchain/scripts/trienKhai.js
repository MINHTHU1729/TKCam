// Triển khai hợp đồng TKCam, ký sẵn báo giá cho máy ảnh mẫu (ký miễn phí, không tốn gas),
// rồi ghi địa chỉ + ABI sang frontend và API PHP.
// Chạy:  npx hardhat run scripts/trienKhai.js --network localhost
//   hoặc npx hardhat run scripts/trienKhai.js --network sepolia
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const THU_MUC_FRONTEND = path.join(__dirname, "..", "..", "frontend");
const FILE_MAY_MAU = path.join(THU_MUC_FRONTEND, "src", "dulieu", "mayanh.json");
const FILE_ABI = path.join(THU_MUC_FRONTEND, "src", "hopdong", "TKCam.json");
const FILE_ENV = path.join(THU_MUC_FRONTEND, ".env");
const FILE_BAO_GIA_MAU = path.join(__dirname, "..", "..", "api", "bao-gia-mau.json");

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

  // 2. Ký báo giá cho các máy mẫu (chữ ký của ví chủ, KHÔNG phải giao dịch nên không tốn gas).
  //    API PHP đọc file này để gắn báo giá vào máy trong CSDL khi chạy lần đầu.
  const danhSach = JSON.parse(fs.readFileSync(FILE_MAY_MAU, "utf8")).sort((a, b) => a.id - b.id);
  const hetHan = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // báo giá dùng được 1 năm
  const baoGia = [];
  for (const may of danhSach) {
    const giaNgay = ethers.parseEther(String(may.giaNgay));
    const tienCoc = ethers.parseEther(String(may.coc));
    const bam = await hopDong.bamBaoGia(may.id, may.seri, giaNgay, tienCoc, hetHan);
    const chuKy = await chuCuaHang.signMessage(ethers.getBytes(bam));
    baoGia.push({ id: may.id, seri: may.seri, giaNgayWei: giaNgay.toString(), tienCocWei: tienCoc.toString(), hetHan, chuKy });
    console.log(`   ✍️  Ký báo giá máy #${may.id} ${may.ten}`);
  }
  if (fs.existsSync(path.dirname(FILE_BAO_GIA_MAU))) {
    fs.writeFileSync(FILE_BAO_GIA_MAU, JSON.stringify({ hopDong: diaChi.toLowerCase(), chainId, baoGia }, null, 2));
    console.log("📝 Đã ghi api/bao-gia-mau.json");
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
  // Cổng đọc hợp đồng không cần ví: phải cùng mạng với hợp đồng vừa deploy
  ghiEnv("VITE_RPC_URL", chainId === 31337 ? "http://127.0.0.1:8545" : process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
  // Ghi địa chỉ hợp đồng + RPC cho API PHP (api/cauhinh.php) để API đọc được giao dịch trên đúng hợp đồng
  const fileCauHinhPhp = path.join(__dirname, "../../api/cauhinh.php");
  if (fs.existsSync(fileCauHinhPhp)) {
    const rpc = chainId === 31337 ? "http://127.0.0.1:8545" : process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
    const php = fs
      .readFileSync(fileCauHinhPhp, "utf8")
      .replace(/\$DIA_CHI_HOP_DONG\s*=\s*'[^']*';/, `$DIA_CHI_HOP_DONG = '${diaChi}';`)
      .replace(/\$RPC_URL\s*=\s*'[^']*';/, `$RPC_URL = '${rpc}';`);
    fs.writeFileSync(fileCauHinhPhp, php);
    console.log("📝 Đã cập nhật api/cauhinh.php (nhớ chép lại thư mục api vào htdocs)");
  }
  console.log("📝 Đã cập nhật frontend/src/hopdong/TKCam.json và frontend/.env");
  console.log("👉 Khởi động lại frontend (Ctrl + C rồi npm run dev) để nhận địa chỉ mới.");
}

main().catch((e) => {
  console.error(e.shortMessage || e.message || e);
  process.exitCode = 1;
});

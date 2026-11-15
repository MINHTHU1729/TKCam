import { BrowserProvider, Contract, JsonRpcProvider, formatEther } from "ethers";
import { DIA_CHI_HOP_DONG, ABI_HOP_DONG, MA_MANG, RPC_DOC } from "./cauhinh";

// Lấy đúng MetaMask khi trình duyệt cài nhiều ví (Phantom, Coinbase... cũng tạo window.ethereum)
export function layMetaMask() {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const ds = window.ethereum.providers;
  if (Array.isArray(ds) && ds.length) return ds.find((p) => p.isMetaMask) || ds[0];
  return window.ethereum;
}

// Kiểm tra đã cài MetaMask chưa
export function coMetaMask() {
  return Boolean(layMetaMask());
}

// Tạo kết nối tới blockchain qua MetaMask
export function layKetNoi() {
  if (!coMetaMask()) throw new Error("Chưa cài MetaMask");
  return new BrowserProvider(layMetaMask());
}

// Xin quyền kết nối ví, trả về địa chỉ ví.
// Nếu sau 60 giây MetaMask không phản hồi (bị treo) thì báo lỗi thay vì đứng im.
export async function ketNoiVi() {
  const cho = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("MetaMask không phản hồi. Bấm biểu tượng con cáo 🦊 để xem yêu cầu kết nối, hoặc tải lại MetaMask trong chrome://extensions rồi mở lại Chrome.")), 60000));
  const danhSachVi = await Promise.race([layMetaMask().request({ method: "eth_requestAccounts" }), cho]);
  return danhSachVi[0];
}

// Lấy số dư ETH của một địa chỉ
export async function laySoDu(diaChi) {
  const soDuWei = await layKetNoi().getBalance(diaChi);
  return formatEther(soDuWei);
}

// Lấy mã mạng hiện tại
export async function layMaMang() {
  const mang = await layKetNoi().getNetwork();
  return Number(mang.chainId);
}

// Kết nối chỉ để ĐỌC: ưu tiên cổng RPC trong .env (không cần ví), không có thì dùng MetaMask
let ketNoiDoc = null;
export function layKetNoiDoc() {
  if (RPC_DOC) {
    ketNoiDoc ??= new JsonRpcProvider(RPC_DOC, MA_MANG, { staticNetwork: true });
    return ketNoiDoc;
  }
  return layKetNoi();
}

// Hợp đồng chỉ đọc (gọi hàm xem, không tốn phí, không cần ví)
export function hopDongDoc() {
  return new Contract(DIA_CHI_HOP_DONG, ABI_HOP_DONG, layKetNoiDoc());
}

// Hợp đồng có ký (gọi hàm ghi, MetaMask hiện popup xác nhận)
export async function hopDongGhi() {
  const nguoiKy = await layKetNoi().getSigner();
  return new Contract(DIA_CHI_HOP_DONG, ABI_HOP_DONG, nguoiKy);
}

import { BrowserProvider, Contract, JsonRpcProvider, formatEther } from "ethers";
import { DIA_CHI_HOP_DONG, ABI_HOP_DONG, MA_MANG, RPC_DOC } from "./cauhinh";

// Kiểm tra đã cài MetaMask chưa
export function coMetaMask() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

// Tạo kết nối tới blockchain qua MetaMask
export function layKetNoi() {
  if (!coMetaMask()) throw new Error("Chưa cài MetaMask");
  return new BrowserProvider(window.ethereum);
}

// Xin quyền kết nối ví, trả về địa chỉ ví
export async function ketNoiVi() {
  const danhSachVi = await layKetNoi().send("eth_requestAccounts", []);
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

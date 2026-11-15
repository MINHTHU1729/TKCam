// Các hàm gọi smart contract TKCam cho phần NGƯỜI THUÊ (phần tiền: thuê, hủy).
// Giá và tiền cọc lấy từ BÁO GIÁ ĐÃ KÝ của chủ cửa hàng (lưu trong CSDL); hợp đồng kiểm tra chữ ký.
// Sau mỗi giao dịch, web gửi mã hash về API (ghiNhanGiaoDich) để lưu vào CSDL.
import { ZeroAddress } from "ethers";
import { hopDongDoc, hopDongGhi } from "./ketnoivi";
import { DIA_CHI_HOP_DONG } from "./cauhinh";

export const TRANG_THAI_DON = [
  { ten: "Đang thuê", lop: "vang" },
  { ten: "Đã trả", lop: "xanh" },
  { ten: "Đã hủy", lop: "xam" },
];

// Đã triển khai hợp đồng chưa (địa chỉ trong .env khác 0x000...)
export const daCoHopDong = () =>
  Boolean(DIA_CHI_HOP_DONG) && DIA_CHI_HOP_DONG.toLowerCase() !== ZeroAddress.toLowerCase();

// Đổi lỗi của ethers / hợp đồng sang câu tiếng Việt dễ hiểu
export function loiTiengViet(e) {
  if (e?.code === "ACTION_REJECTED" || e?.info?.error?.code === 4001) return "Bạn đã hủy thanh toán.";
  if (e?.code === "INSUFFICIENT_FUNDS") return "Ví không đủ ETH để thanh toán.";
  const lyDo = e?.reason || e?.shortMessage || e?.message || "";
  const BANG = {
    "May chua san sang": "Máy đang được thuê hoặc đang bảo trì.",
    "So tien gui khong dung": "Số tiền gửi không đúng, hãy tải lại trang.",
    "Qua thoi gian huy (1 gio)": "Đã quá 1 giờ kể từ lúc thuê nên không hủy được.",
    "Khong co may": "Máy này hiện chưa nhận đặt thuê.",
    "Bao gia het han": "Báo giá của máy đã hết hạn, cửa hàng cần cập nhật lại giá.",
    "Bao gia khong hop le": "Báo giá không hợp lệ, vui lòng tải lại trang.",
  };
  const khop = Object.keys(BANG).find((k) => lyDo.includes(k));
  if (khop) return BANG[khop];
  if (lyDo.includes("could not decode") || lyDo.includes("BAD_DATA")) {
    return "Không kết nối được hệ thống thanh toán. Hãy kiểm tra ví đang ở đúng mạng.";
  }
  console.error(e); // giữ lỗi gốc trong Console để lập trình viên xem
  if (/coalesce|network|fetch|timeout|ECONN|RPC/i.test(lyDo)) {
    return "Không kết nối được mạng thanh toán. Vui lòng kiểm tra ví và thử lại sau ít phút.";
  }
  return "Giao dịch chưa thực hiện được. Vui lòng thử lại.";
}

// Máy đang có đơn thuê trên hợp đồng không (đọc miễn phí): trả về mã đơn, 0 = rảnh
export async function layDonHienTai(maMay) {
  return Number(await hopDongDoc().donHienTai(maMay));
}

// Thuê máy theo báo giá đã ký: gửi đúng (giá × số ngày + cọc) vào hợp đồng
export async function thueMay(may, soNgay) {
  if (!may.chuKy) throw new Error("Máy này hiện chưa nhận đặt thuê.");
  const hopDong = await hopDongGhi();
  const giaNgay = BigInt(may.giaNgayWei);
  const tienCoc = BigInt(may.tienCocWei);
  const tong = giaNgay * BigInt(soNgay) + tienCoc;
  const giaoDich = await hopDong.rent(may.id, may.seri, giaNgay, tienCoc, may.hetHan, soNgay, may.chuKy, { value: tong });
  const bienNhan = await giaoDich.wait(); // chờ giao dịch được xác nhận

  // Lấy mã đơn từ sự kiện Rented
  const suKien = bienNhan.logs
    .map((log) => { try { return hopDong.interface.parseLog(log); } catch { return null; } })
    .find((s) => s?.name === "Rented");
  return { maDon: suKien ? Number(suKien.args.rentalId) : null, maGiaoDich: giaoDich.hash };
}

// Hủy đơn (trong 1 giờ đầu), trả về mã hash giao dịch
export async function huyDon(maDon) {
  const hopDong = await hopDongGhi();
  const giaoDich = await hopDong.cancelRental(maDon);
  await giaoDich.wait();
  return giaoDich.hash;
}

// Các hàm gọi smart contract TKCam cho phần NGƯỜI THUÊ
import { formatEther, ZeroAddress } from "ethers";
import { hopDongDoc, hopDongGhi } from "./ketnoivi";
import { DIA_CHI_HOP_DONG } from "./cauhinh";

export const TRANG_THAI_MAY = ["san-sang", "dang-thue", "bao-tri"]; // theo enum trên hợp đồng
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

// Đọc trạng thái + giá thật của máy trên hợp đồng
export async function layMayTrenChuoi(maMay) {
  const m = await hopDongDoc().getCamera(maMay);
  return {
    trangThai: TRANG_THAI_MAY[Number(m.status)],
    giaNgay: Number(formatEther(m.pricePerDay)),
    coc: Number(formatEther(m.deposit)),
    giaNgayWei: m.pricePerDay,
    cocWei: m.deposit,
  };
}

// Lịch sử thuê của một máy, đọc từ hợp đồng (mới nhất trước)
export async function layLichSuMay(maMay) {
  const hopDong = hopDongDoc();
  const danhSachMa = await hopDong.getRentalsOfCamera(maMay);
  const ngay = (giay) => new Date(Number(giay) * 1000).toLocaleDateString("vi-VN");
  const lichSu = await Promise.all(
    danhSachMa.map(async (ma) => {
      const d = await hopDong.getRental(ma);
      const tt = Number(d.trangThai);
      let ketQua = TRANG_THAI_DON[tt].ten;
      if (tt === 1) {
        ketQua = Number(d.phiTre) > 0 || Number(d.tienHuHong) > 0 ? "Trả máy, có khấu trừ cọc" : "Trả đúng hạn, hoàn cọc đủ";
      }
      return {
        maDon: Number(ma),
        nguoiThue: `${d.nguoiThue.slice(0, 6)}...${d.nguoiThue.slice(-4)}`,
        ngayThue: ngay(d.batDau),
        ngayTra: Number(d.ngayTra) ? ngay(d.ngayTra) : "—",
        ketQua,
      };
    })
  );
  return lichSu.sort((a, b) => b.maDon - a.maDon);
}

// Thuê máy: tính tiền từ giá trên hợp đồng (không dùng số trong JSON để tránh lệch)
export async function thueMay(maMay, soNgay) {
  const hopDong = await hopDongGhi();
  const may = await hopDong.getCamera(maMay);
  const tong = may.pricePerDay * BigInt(soNgay) + may.deposit;
  const giaoDich = await hopDong.rent(maMay, soNgay, { value: tong });
  const bienNhan = await giaoDich.wait(); // chờ giao dịch được xác nhận

  // Lấy mã đơn từ sự kiện Rented
  const suKien = bienNhan.logs
    .map((log) => { try { return hopDong.interface.parseLog(log); } catch { return null; } })
    .find((s) => s?.name === "Rented");
  return { maDon: suKien ? Number(suKien.args.rentalId) : null, maGiaoDich: giaoDich.hash };
}

// Hủy đơn (trong 1 giờ đầu)
export async function huyDon(maDon) {
  const hopDong = await hopDongGhi();
  await (await hopDong.cancelRental(maDon)).wait();
}

// Danh sách đơn thuê của một ví, mới nhất trước
export async function layDonCuaVi(diaChi) {
  const hopDong = hopDongDoc();
  const danhSachMa = await hopDong.getRentalsOf(diaChi);
  const don = await Promise.all(
    danhSachMa.map(async (ma) => {
      const d = await hopDong.getRental(ma);
      const may = await hopDong.getCamera(d.maMay);
      return {
        maDon: Number(ma),
        maMay: Number(d.maMay),
        tenMay: may.name,
        seri: may.serial,
        soNgay: Number(d.soNgay),
        tienThue: formatEther(d.tienThue),
        tienCoc: formatEther(d.tienCoc),
        batDau: new Date(Number(d.batDau) * 1000),
        hanTra: new Date(Number(d.hanTra) * 1000),
        ngayTra: Number(d.ngayTra) ? new Date(Number(d.ngayTra) * 1000) : null,
        phiTre: formatEther(d.phiTre),
        tienHuHong: formatEther(d.tienHuHong),
        tienHoan: formatEther(d.tienHoan),
        trangThai: Number(d.trangThai),
      };
    })
  );
  return don.sort((a, b) => b.maDon - a.maDon);
}

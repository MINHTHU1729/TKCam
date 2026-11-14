// Một chỗ duy nhất để lấy dữ liệu máy ảnh (không dùng CSDL).
// 1. Thông tin hiển thị (tên, mô tả, thông số, màu...) lấy từ file dulieu/mayanh.json.
// 2. Giá thuê, tiền cọc, trạng thái lấy từ smart contract (nguồn chính xác nhất),
//    nên admin chỉ cần đổi trên hợp đồng là mọi trang tự cập nhật.
import duLieuMay from "../dulieu/mayanh.json";
import { daCoHopDong, layMayTrenChuoi } from "./hopDongThue";

export async function layDanhSachMay() {
  if (!daCoHopDong()) return duLieuMay;
  return Promise.all(
    duLieuMay.map(async (may) => {
      try {
        const tren = await layMayTrenChuoi(may.id);
        return { ...may, trangThai: tren.trangThai, giaNgay: tren.giaNgay, coc: tren.coc, trenChuoi: true };
      } catch {
        return may; // máy chưa đăng lên hợp đồng hoặc không đọc được: giữ thông tin trong file JSON
      }
    })
  );
}

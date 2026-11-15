// Lấy danh sách máy ảnh từ API (bảng may_anh trong MySQL).
// API tự đồng bộ giá, tiền cọc, trạng thái với smart contract trước khi trả về.
// Không gọi được API (chưa bật XAMPP) thì dùng file mẫu dulieu/mayanh.json để web vẫn hiện.
import duLieuMau from "../dulieu/mayanh.json";
import { goiAPI } from "./api";

export async function layDanhSachMay() {
  try {
    return await goiAPI("/may-anh");
  } catch (e) {
    console.warn("Không tải được máy ảnh từ máy chủ, dùng dữ liệu mẫu:", e.message);
    return duLieuMau;
  }
}

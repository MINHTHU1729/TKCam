// Gọi API PHP (dữ liệu lưu trong MySQL của XAMPP)
// Địa chỉ API lấy từ VITE_API_URL trong frontend/.env
import { docLuuTru } from "./luuTru";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8181/tkcam-api/index.php";
export const KHOA_TOKEN = "tkcam_token";

// body: object (gửi JSON) hoặc FormData (gửi kèm file ảnh)
export async function goiAPI(duongDan, { method = "GET", body } = {}) {
  const token = docLuuTru(KHOA_TOKEN, null);
  const laForm = typeof FormData !== "undefined" && body instanceof FormData;
  let phanHoi;
  try {
    phanHoi = await fetch(`${API_URL}${duongDan}`, {
      method,
      headers: {
        ...(laForm ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}`, "X-Auth-Token": token } : {}),
      },
      body: body ? (laForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Hãy Start Apache và MySQL trong XAMPP.");
  }

  const duLieu = await phanHoi.json().catch(() => ({}));
  if (!phanHoi.ok) {
    const loi = new Error(duLieu.loi || "Máy chủ gặp lỗi. Kiểm tra XAMPP và thư mục tkcam-api trong htdocs.");
    loi.status = phanHoi.status;
    throw loi;
  }
  return duLieu;
}

// Sau khi giao dịch blockchain thành công: gửi mã hash về API để kiểm tra và lưu vào CSDL
//   loai: "thue" | "huy-don" | "tra-may" | "doi-gia" | "bao-tri"
export function ghiNhanGiaoDich(hash, loai, them = {}) {
  return goiAPI("/giao-dich", { method: "POST", body: { hash, loai, ...them } });
}

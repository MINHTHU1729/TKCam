import { useNavigate } from "react-router-dom";
import { dangMayMoi } from "../../tienich/hopDongAdmin";
import FormMay from "./FormMay";

// Trang "Thêm máy": lưu thông tin + ảnh vào CSDL, rồi ví chủ ký báo giá (đều không tốn gas)
export default function ThemMay({ taiLai }) {
  const dieuHuong = useNavigate();

  const luu = async (may, baoBuoc) => {
    try {
      await dangMayMoi(may, baoBuoc);
    } catch (e) {
      if (!e.daLuuMay) throw e;
      // Máy đã lưu vào CSDL nhưng chưa ký giá: về danh sách để ký lại ở trang Sửa
      await taiLai();
      dieuHuong("/admin/may-anh", { state: { thongBao: e.message } });
      return;
    }
    await taiLai();
    dieuHuong("/admin/may-anh", { state: { thongBao: `Đã thêm máy "${may.ten.trim()}".` } });
  };

  return <FormMay may={{}} luu={luu} huy={() => dieuHuong("/admin/may-anh")} chuNutLuu="Thêm máy" />;
}

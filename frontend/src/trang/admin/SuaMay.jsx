import { Link, useNavigate, useParams } from "react-router-dom";
import { doiGia, suaThongTinMay } from "../../tienich/hopDongAdmin";
import FormMay from "./FormMay";

// Trang "Sửa máy": tên, ảnh, mô tả, thông số lưu CSDL; đổi giá / cọc = ký báo giá mới trong MetaMask.
// Tất cả đều không tốn gas.
export default function SuaMay({ dsMay, dangTai, taiLai }) {
  const { id } = useParams();
  const dieuHuong = useNavigate();
  const may = dsMay.find((m) => m.id === Number(id));

  if (!may) {
    return dangTai ? (
      <p className="mo">Đang tải...</p>
    ) : (
      <section className="the-khung">
        <p>Không tìm thấy máy #{id}.</p>
        <Link to="/admin/may-anh" className="nut nut-phu nut-nho-vua">Về danh sách máy</Link>
      </section>
    );
  }

  const luu = async (moi, baoBuoc) => {
    const canKyGia = !may.coBaoGia || Number(moi.giaNgay) !== Number(may.giaNgay) || Number(moi.coc) !== Number(may.coc);

    baoBuoc("Đang lưu thông tin máy vào CSDL...");
    await suaThongTinMay(may.id, moi);
    if (canKyGia) {
      baoBuoc("Ký báo giá mới trong MetaMask (miễn phí, không tốn gas)...");
      await doiGia(may, moi.giaNgay, moi.coc);
    }
    await taiLai();
    dieuHuong("/admin/may-anh", { state: { thongBao: `Đã cập nhật máy #${may.id} "${moi.ten.trim()}".` } });
  };

  return (
    <FormMay key={may.id} may={may} laSua luu={luu}
      huy={() => dieuHuong("/admin/may-anh")} chuNutLuu="Lưu thay đổi" />
  );
}

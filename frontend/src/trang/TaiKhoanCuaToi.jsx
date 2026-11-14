import { Link, useNavigate } from "react-router-dom";
import ThongTinVi from "../thanhphan/ThongTinVi";
import DanhSachDonThue from "../thanhphan/DanhSachDonThue";
import BieuTuong from "../thanhphan/BieuTuong";
import { useTaiKhoan } from "../xuly/TaiKhoan";
import { chuCaiDau } from "../tienich/dinhdang";

export default function TaiKhoanCuaToi() {
  const { nguoiDung, dangXuat } = useTaiKhoan();
  const dieuHuong = useNavigate();
  const ngayTao = nguoiDung.ngayTao ? new Date(nguoiDung.ngayTao).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="khung khoi">
      <div className="ho-so">
        <div className="ho-so__anh">{chuCaiDau(nguoiDung.hoTen)}</div>
        <div>
          <span className="nhan-nho">Tài khoản của tôi</span>
          <h1 className="tieu-de-trang">Xin chào, {nguoiDung.hoTen.split(" ").slice(-1)[0]}</h1>
          <p className="mo">Thành viên từ {ngayTao}</p>
        </div>
        <button className="nut nut-vien ho-so__thoat" onClick={() => { dangXuat(); dieuHuong("/"); }}>
          <BieuTuong ten="dangXuat" co={18} /> Đăng xuất
        </button>
      </div>

      <div className="luoi-tai-khoan">
        <section className="the-khung">
          <h3>Thông tin cá nhân</h3>
          <dl className="chi-tiet">
            <div><dt><BieuTuong ten="nguoi" co={16} /> Họ tên</dt><dd>{nguoiDung.hoTen}</dd></div>
            <div><dt><BieuTuong ten="thu" co={16} /> Email</dt><dd>{nguoiDung.email}</dd></div>
            <div><dt><BieuTuong ten="dienThoai" co={16} /> Điện thoại</dt><dd>{nguoiDung.soDienThoai || "—"}</dd></div>
            <div><dt><BieuTuong ten="vi" co={16} /> Ví liên kết</dt><dd><code>{nguoiDung.diaChiVi ? `${nguoiDung.diaChiVi.slice(0, 6)}...${nguoiDung.diaChiVi.slice(-4)}` : "Chưa liên kết"}</code></dd></div>
          </dl>
        </section>

        <ThongTinVi />
      </div>

      <section id="don-thue" className="the-khung">
        <div className="khoi__dau">
          <h3>Đơn thuê của tôi</h3>
          <Link to="/may-anh" className="lien-ket">Thuê máy mới <BieuTuong ten="muiTen" co={14} /></Link>
        </div>
        <DanhSachDonThue />
      </section>
    </div>
  );
}

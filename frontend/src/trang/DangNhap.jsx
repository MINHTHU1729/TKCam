import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import KhungXacThuc from "../thanhphan/KhungXacThuc";
import OMatKhau from "../thanhphan/OMatKhau";
import { useTaiKhoan } from "../xuly/TaiKhoan";

export default function DangNhap() {
  const { dangNhap, daDangNhap } = useTaiKhoan();
  const [thamSo] = useSearchParams();
  const dieuHuong = useNavigate();
  const tiep = thamSo.get("tiep") || "/tai-khoan";

  const [form, setForm] = useState({ email: "", matKhau: "" });
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);

  if (daDangNhap) return <Navigate to={tiep} replace />;

  const doi = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const gui = async (e) => {
    e.preventDefault();
    setLoi("");
    setDangGui(true);
    try {
      await dangNhap(form);
      dieuHuong(tiep, { replace: true });
    } catch (err) {
      setLoi(err.message);
    } finally {
      setDangGui(false);
    }
  };

  return (
    <KhungXacThuc
      tieuDe="Chào mừng trở lại"
      moTa="Đăng nhập để thuê máy và theo dõi tiền cọc của bạn."
      chanForm={<>Chưa có tài khoản? <Link to={`/dang-ky${tiep !== "/tai-khoan" ? `?tiep=${encodeURIComponent(tiep)}` : ""}`} className="lien-ket">Đăng ký ngay</Link></>}
    >
      {thamSo.get("tiep") && <p className="thong-bao thong-bao--tin">Vui lòng đăng nhập để tiếp tục.</p>}

      <form className="form" onSubmit={gui} noValidate>
        <label className="nhan-o">
          Email
          <input className="o-nhap" name="email" type="email" autoComplete="email" required
            placeholder="ban@email.com" value={form.email} onChange={doi} />
        </label>
        <label className="nhan-o">
          <span className="nhan-o__hang">Mật khẩu <a href="#" className="lien-ket nho" onClick={(e) => e.preventDefault()}>Quên mật khẩu?</a></span>
          <OMatKhau name="matKhau" autoComplete="current-password" required placeholder="Nhập mật khẩu"
            value={form.matKhau} onChange={doi} />
        </label>

        {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}

        <button className="nut nut-chinh nut-day nut-lon" type="submit" disabled={dangGui || !form.email || !form.matKhau}>
          {dangGui ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </KhungXacThuc>
  );
}

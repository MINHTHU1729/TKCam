import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import KhungXacThuc from "../thanhphan/KhungXacThuc";
import OMatKhau from "../thanhphan/OMatKhau";
import { useTaiKhoan } from "../xuly/TaiKhoan";

// Kiểm tra từng ô, trả về danh sách lỗi
function kiemTra(f) {
  const loi = {};
  if (f.hoTen.trim().length < 2) loi.hoTen = "Vui lòng nhập họ tên.";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) loi.email = "Email không hợp lệ.";
  if (!/^0\d{9}$/.test(f.soDienThoai.replace(/\s/g, ""))) loi.soDienThoai = "Số điện thoại gồm 10 số, bắt đầu bằng 0.";
  if (f.matKhau.length < 6) loi.matKhau = "Mật khẩu ít nhất 6 ký tự.";
  if (f.nhapLai !== f.matKhau) loi.nhapLai = "Mật khẩu nhập lại không khớp.";
  if (!f.dongY) loi.dongY = "Bạn cần đồng ý với điều khoản.";
  return loi;
}

// Độ mạnh mật khẩu: 0 → 3
function doManh(mk) {
  let diem = 0;
  if (mk.length >= 8) diem++;
  if (/[A-Z]/.test(mk) && /[a-z]/.test(mk)) diem++;
  if (/\d/.test(mk) || /[^A-Za-z0-9]/.test(mk)) diem++;
  return diem;
}
const TEN_DO_MANH = ["Yếu", "Trung bình", "Khá", "Mạnh"];

export default function DangKy() {
  const { dangKy, daDangNhap } = useTaiKhoan();
  const [thamSo] = useSearchParams();
  const dieuHuong = useNavigate();
  const tiep = thamSo.get("tiep") || "/tai-khoan";

  const [form, setForm] = useState({ hoTen: "", email: "", soDienThoai: "", matKhau: "", nhapLai: "", dongY: false });
  const [daBam, setDaBam] = useState(false);
  const [loiChung, setLoiChung] = useState("");
  const [dangGui, setDangGui] = useState(false);

  if (daDangNhap) return <Navigate to={tiep} replace />;

  const loi = daBam ? kiemTra(form) : {};
  const doi = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const gui = async (e) => {
    e.preventDefault();
    setDaBam(true);
    setLoiChung("");
    if (Object.keys(kiemTra(form)).length) return;
    setDangGui(true);
    try {
      await dangKy(form);
      dieuHuong(tiep, { replace: true });
    } catch (err) {
      setLoiChung(err.message);
    } finally {
      setDangGui(false);
    }
  };

  const manh = doManh(form.matKhau);

  return (
    <KhungXacThuc
      tieuDe="Tạo tài khoản"
      moTa="Chỉ mất một phút. Sau đó bạn có thể liên kết ví và thuê máy ngay."
      chanForm={<>Đã có tài khoản? <Link to="/dang-nhap" className="lien-ket">Đăng nhập</Link></>}
    >
      <form className="form" onSubmit={gui} noValidate>
        <label className="nhan-o">
          Họ và tên
          <input className={`o-nhap ${loi.hoTen ? "o-nhap--loi" : ""}`} name="hoTen" autoComplete="name"
            placeholder="Nguyễn Văn A" value={form.hoTen} onChange={doi} />
          {loi.hoTen && <small className="chu-loi">{loi.hoTen}</small>}
        </label>

        <div className="hai-o">
          <label className="nhan-o">
            Email
            <input className={`o-nhap ${loi.email ? "o-nhap--loi" : ""}`} name="email" type="email" autoComplete="email"
              placeholder="ban@email.com" value={form.email} onChange={doi} />
            {loi.email && <small className="chu-loi">{loi.email}</small>}
          </label>
          <label className="nhan-o">
            Số điện thoại
            <input className={`o-nhap ${loi.soDienThoai ? "o-nhap--loi" : ""}`} name="soDienThoai" type="tel" autoComplete="tel"
              placeholder="0912 345 678" value={form.soDienThoai} onChange={doi} />
            {loi.soDienThoai && <small className="chu-loi">{loi.soDienThoai}</small>}
          </label>
        </div>

        <label className="nhan-o">
          Mật khẩu
          <OMatKhau name="matKhau" autoComplete="new-password" placeholder="Ít nhất 6 ký tự"
            value={form.matKhau} onChange={doi} loi={loi.matKhau} />
          {form.matKhau && (
            <div className={`do-manh do-manh--${manh}`}>
              <span /><span /><span />
              <small>{TEN_DO_MANH[manh]}</small>
            </div>
          )}
          {loi.matKhau && <small className="chu-loi">{loi.matKhau}</small>}
        </label>

        <label className="nhan-o">
          Nhập lại mật khẩu
          <OMatKhau name="nhapLai" autoComplete="new-password" placeholder="Nhập lại mật khẩu"
            value={form.nhapLai} onChange={doi} loi={loi.nhapLai} />
          {loi.nhapLai && <small className="chu-loi">{loi.nhapLai}</small>}
        </label>

        <label className="o-chon">
          <input type="checkbox" name="dongY" checked={form.dongY} onChange={doi} />
          <span>Tôi đồng ý với <Link to="/#chinh-sach" className="lien-ket">điều khoản thuê và chính sách cọc</Link></span>
        </label>
        {loi.dongY && <small className="chu-loi">{loi.dongY}</small>}

        {loiChung && <p className="thong-bao thong-bao--loi">{loiChung}</p>}

        <button className="nut nut-chinh nut-day nut-lon" type="submit" disabled={dangGui}>
          {dangGui ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>
      </form>
    </KhungXacThuc>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import KhungXacThuc from "../thanhphan/KhungXacThuc";
import OMatKhau from "../thanhphan/OMatKhau";
import { goiAPI } from "../tienich/api";

// Quên mật khẩu: nhập email + số điện thoại đã đăng ký để đặt mật khẩu mới
export default function QuenMatKhau() {
  const [form, setForm] = useState({ email: "", soDienThoai: "", matKhauMoi: "", nhapLai: "" });
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState("");
  const [dangGui, setDangGui] = useState(false);

  const doi = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const gui = async (e) => {
    e.preventDefault();
    setLoi("");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setLoi("Email không hợp lệ.");
    if (!/^0\d{9}$/.test(form.soDienThoai.replace(/\s/g, ""))) return setLoi("Số điện thoại gồm 10 số, bắt đầu bằng 0.");
    if (form.matKhauMoi.length < 6) return setLoi("Mật khẩu mới ít nhất 6 ký tự.");
    if (form.matKhauMoi !== form.nhapLai) return setLoi("Mật khẩu nhập lại không khớp.");
    setDangGui(true);
    try {
      const kq = await goiAPI("/tai-khoan/quen-mat-khau", {
        method: "POST",
        body: { email: form.email, soDienThoai: form.soDienThoai, matKhauMoi: form.matKhauMoi },
      });
      setXong(kq.thongBao);
    } catch (err) {
      setLoi(err.message);
    } finally {
      setDangGui(false);
    }
  };

  return (
    <KhungXacThuc
      tieuDe="Quên mật khẩu"
      moTa="Nhập email và số điện thoại bạn đã dùng khi đăng ký để đặt mật khẩu mới."
      chanForm={<>Nhớ ra rồi? <Link to="/dang-nhap" className="lien-ket">Đăng nhập</Link></>}
    >
      {xong ? (
        <>
          <p className="thong-bao thong-bao--thanh-cong">{xong}</p>
          <Link to="/dang-nhap" className="nut nut-chinh nut-day nut-lon">Đăng nhập</Link>
        </>
      ) : (
        <form className="form" onSubmit={gui} noValidate>
          <label className="nhan-o">
            Email
            <input className="o-nhap" name="email" type="email" autoComplete="email"
              placeholder="ban@email.com" value={form.email} onChange={doi} />
          </label>
          <label className="nhan-o">
            Số điện thoại đã đăng ký
            <input className="o-nhap" name="soDienThoai" type="tel" autoComplete="tel"
              placeholder="0901234567" value={form.soDienThoai} onChange={doi} />
          </label>
          <label className="nhan-o">
            Mật khẩu mới
            <OMatKhau name="matKhauMoi" autoComplete="new-password" placeholder="Ít nhất 6 ký tự"
              value={form.matKhauMoi} onChange={doi} />
          </label>
          <label className="nhan-o">
            Nhập lại mật khẩu mới
            <OMatKhau name="nhapLai" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới"
              value={form.nhapLai} onChange={doi} />
          </label>

          {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}

          <button className="nut nut-chinh nut-day nut-lon" type="submit"
            disabled={dangGui || !form.email || !form.soDienThoai || !form.matKhauMoi || !form.nhapLai}>
            {dangGui ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      )}
    </KhungXacThuc>
  );
}
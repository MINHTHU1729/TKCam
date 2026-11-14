import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTaiKhoan } from "../xuly/TaiKhoan";
import { chuCaiDau } from "../tienich/dinhdang";
import { CUA_HANG } from "../tienich/thongTinCuaHang";
import BieuTuong from "./BieuTuong";

// Thanh điều hướng trên cùng, dùng chung cho mọi trang
export default function DauTrang() {
  const { nguoiDung, daDangNhap, dangXuat } = useTaiKhoan();
  const [moMenu, setMoMenu] = useState(false);
  const [moDiDong, setMoDiDong] = useState(false);
  const vungMenu = useRef(null);
  const viTri = useLocation();
  const dieuHuong = useNavigate();

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setMoMenu(false);
    setMoDiDong(false);
  }, [viTri.pathname]);

  // Đóng menu tài khoản khi bấm ra ngoài
  useEffect(() => {
    const dong = (e) => vungMenu.current && !vungMenu.current.contains(e.target) && setMoMenu(false);
    document.addEventListener("mousedown", dong);
    return () => document.removeEventListener("mousedown", dong);
  }, []);

  const thoat = () => {
    dangXuat();
    dieuHuong("/");
  };

  return (
    <>
      <div className="thanh-tin">
        <div className="khung thanh-tin__trong">
          <span>📸 Thuê từ 1 ngày · Hoàn cọc ngay khi trả máy</span>
          <span className="an-di-dong">
            <BieuTuong ten="dienThoai" co={14} /> {CUA_HANG.hotline} · {CUA_HANG.gioMoCua}
          </span>
        </div>
      </div>

      <header className="dau-trang">
        <div className="khung dau-trang__trong">
          <Link to="/" className="logo">
            <span className="logo__dau"><BieuTuong ten="mayAnh" co={18} /></span>
            TKCam
          </Link>

          <nav className={`menu ${moDiDong ? "menu--mo" : ""}`}>
            <NavLink to="/" end>Trang chủ</NavLink>
            <NavLink to="/may-anh">Thuê máy</NavLink>
            <Link to="/#bang-gia">Bảng giá</Link>
            <Link to="/#quy-trinh">Cách thuê</Link>
            <NavLink to="/tra-cuu">Tra cứu</NavLink>
            <Link to="/#cau-hoi">Hỏi đáp</Link>
            {!daDangNhap && <NavLink to="/dang-nhap" className="chi-di-dong">Đăng nhập</NavLink>}
          </nav>

          <div className="dau-trang__phai">
            {daDangNhap ? (
              <div className="tai-khoan-menu" ref={vungMenu}>
                <button className="nut-tai-khoan" onClick={() => setMoMenu(!moMenu)} aria-label="Tài khoản">
                  <span className="anh-dai-dien">{chuCaiDau(nguoiDung.hoTen)}</span>
                  <span className="an-di-dong">{nguoiDung.hoTen.split(" ").slice(-1)[0]}</span>
                </button>
                {moMenu && (
                  <div className="hop-menu">
                    <div className="hop-menu__dau">
                      <b>{nguoiDung.hoTen}</b>
                      <span>{nguoiDung.email}</span>
                    </div>
                    <Link to="/tai-khoan"><BieuTuong ten="nguoi" co={18} /> Tài khoản của tôi</Link>
                    <Link to="/tai-khoan#don-thue"><BieuTuong ten="mayAnh" co={18} /> Đơn thuê</Link>
                    <button onClick={thoat}><BieuTuong ten="dangXuat" co={18} /> Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/dang-nhap" className="nut nut-chu an-di-dong">Đăng nhập</Link>
                <Link to="/dang-ky" className="nut nut-toi">Đăng ký</Link>
              </>
            )}

            <button className="nut-hamburger" onClick={() => setMoDiDong(!moDiDong)} aria-label="Mở menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

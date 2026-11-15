import { Link, Navigate } from "react-router-dom";
import { useTaiKhoan } from "../xuly/TaiKhoan";
import BieuTuong from "./BieuTuong";

// Bọc trang quản trị: chưa đăng nhập thì sang /dang-nhap, đăng nhập bằng tài khoản khách thì báo không có quyền
export default function CanLaAdmin({ children }) {
  const { daDangNhap, laAdmin, dangXuat } = useTaiKhoan();
  if (!daDangNhap) return <Navigate to="/dang-nhap?tiep=%2Fadmin" replace />;
  if (!laAdmin) {
    return (
      <div className="ad-cam">
        <section className="the-khung qt__chan">
          <span className="the-vi__icon-lon"><BieuTuong ten="khoa" co={30} /></span>
          <h2>Không có quyền truy cập</h2>
          <p className="mo">Khu vực này chỉ dành cho quản trị viên cửa hàng.</p>
          <div className="hang-nut">
            <Link to="/" className="nut nut-chinh">Về trang chủ</Link>
            <Link to="/dang-nhap?tiep=%2Fadmin" className="nut nut-vien" onClick={dangXuat}>Đăng nhập tài khoản khác</Link>
          </div>
        </section>
      </div>
    );
  }
  return children;
}

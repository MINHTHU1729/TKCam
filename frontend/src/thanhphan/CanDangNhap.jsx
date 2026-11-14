import { Navigate, useLocation } from "react-router-dom";
import { useTaiKhoan } from "../xuly/TaiKhoan";

// Bọc các trang cần đăng nhập. Chưa đăng nhập thì chuyển sang /dang-nhap rồi quay lại.
export default function CanDangNhap({ children }) {
  const { daDangNhap } = useTaiKhoan();
  const viTri = useLocation();
  if (!daDangNhap) {
    return <Navigate to={`/dang-nhap?tiep=${encodeURIComponent(viTri.pathname)}`} replace />;
  }
  return children;
}

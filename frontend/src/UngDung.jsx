import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { TaiKhoanProvider, useTaiKhoan } from "./xuly/TaiKhoan";
import DauTrang from "./thanhphan/DauTrang";
import ChanTrang from "./thanhphan/ChanTrang";
import CuonLenDau from "./thanhphan/CuonLenDau";
import CanDangNhap from "./thanhphan/CanDangNhap";
import TrangChu from "./trang/TrangChu";
import DanhSachMay from "./trang/DanhSachMay";
import ChiTietMay from "./trang/ChiTietMay";
import TraCuuSeri from "./trang/TraCuuSeri";
import DangNhap from "./trang/DangNhap";
import DangKy from "./trang/DangKy";
import QuenMatKhau from "./trang/QuenMatKhau";
import TaiKhoanCuaToi from "./trang/TaiKhoanCuaToi";
import KhongTimThay from "./trang/KhongTimThay";
import BoCucAdmin from "./trang/admin/BoCucAdmin";
import CanLaAdmin from "./thanhphan/CanLaAdmin";
import "./giaodien.css";

// Bố cục trang khách: menu trên + chân trang. Trang đăng nhập / đăng ký không hiện chân trang.
// Tài khoản quản trị không dùng trang khách: luôn được đưa về khu quản trị /admin.
function BoCucKhach() {
  const { pathname } = useLocation();
  const { laAdmin } = useTaiKhoan();
  const trangXacThuc = ["/dang-nhap", "/dang-ky", "/quen-mat-khau"].includes(pathname);

  if (laAdmin) return <Navigate to="/admin" replace />;

  return (
    <>
      <CuonLenDau />
      <DauTrang />
      <main className="than-trang">
        <Routes>
          <Route path="/" element={<TrangChu />} />
          <Route path="/may-anh" element={<DanhSachMay />} />
          <Route path="/may-anh/:id" element={<ChiTietMay />} />
          <Route path="/tra-cuu" element={<TraCuuSeri />} />
          <Route path="/dang-nhap" element={<DangNhap />} />
          <Route path="/dang-ky" element={<DangKy />} />
          <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
          <Route path="/tai-khoan" element={<CanDangNhap><TaiKhoanCuaToi /></CanDangNhap>} />
          <Route path="*" element={<KhongTimThay />} />
        </Routes>
      </main>
      {!trangXacThuc && <ChanTrang />}
    </>
  );
}

export default function UngDung() {
  return (
    <BrowserRouter>
      <TaiKhoanProvider>
        <Routes>
          <Route path="/admin/*" element={<CanLaAdmin><BoCucAdmin /></CanLaAdmin>} />
          <Route path="/*" element={<BoCucKhach />} />
        </Routes>
      </TaiKhoanProvider>
    </BrowserRouter>
  );
}

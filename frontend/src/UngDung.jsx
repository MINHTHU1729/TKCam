import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { TaiKhoanProvider } from "./xuly/TaiKhoan";
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
import TaiKhoanCuaToi from "./trang/TaiKhoanCuaToi";
import KhongTimThay from "./trang/KhongTimThay";
import "./giaodien.css";

// Trang đăng nhập / đăng ký có bố cục riêng, không hiện chân trang
function BoCuc() {
  const { pathname } = useLocation();
  const trangXacThuc = pathname === "/dang-nhap" || pathname === "/dang-ky";

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
        <BoCuc />
      </TaiKhoanProvider>
    </BrowserRouter>
  );
}

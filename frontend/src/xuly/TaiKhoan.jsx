import { createContext, useContext, useState } from "react";
import { docLuuTru, ghiLuuTru } from "../tienich/luuTru";

// Quản lý đăng nhập / đăng ký cho toàn bộ trang.
// Không dùng CSDL: tài khoản lưu trong trình duyệt (localStorage).
// Tiền thuê, tiền cọc, đơn thuê, lịch sử đều nằm trên smart contract.
const NguCanhTaiKhoan = createContext(null);

const KHOA_DS = "tkcam_nguoi_dung";
const KHOA_HIEN_TAI = "tkcam_dang_nhap";

export function TaiKhoanProvider({ children }) {
  const [nguoiDung, setNguoiDung] = useState(() => docLuuTru(KHOA_HIEN_TAI, null));

  const dangKy = ({ hoTen, email, soDienThoai, matKhau }) => {
    const danhSach = docLuuTru(KHOA_DS, []);
    const emailThuong = email.trim().toLowerCase();
    if (danhSach.some((u) => u.email === emailThuong)) {
      throw new Error("Email này đã được đăng ký.");
    }
    const moi = { hoTen: hoTen.trim(), email: emailThuong, soDienThoai, matKhau, ngayTao: new Date().toISOString() };
    ghiLuuTru(KHOA_DS, [...danhSach, moi]);
    const { matKhau: _bo, ...hienThi } = moi;
    ghiLuuTru(KHOA_HIEN_TAI, hienThi);
    setNguoiDung(hienThi);
  };

  const dangNhap = ({ email, matKhau }) => {
    const danhSach = docLuuTru(KHOA_DS, []);
    const tim = danhSach.find((u) => u.email === email.trim().toLowerCase() && u.matKhau === matKhau);
    if (!tim) throw new Error("Email hoặc mật khẩu không đúng.");
    const { matKhau: _bo, ...hienThi } = tim;
    ghiLuuTru(KHOA_HIEN_TAI, hienThi);
    setNguoiDung(hienThi);
  };

  // Gắn một ví MetaMask vào tài khoản đang đăng nhập (mỗi ví chỉ thuộc 1 tài khoản)
  const lienKetVi = (diaChiVi) => {
    const vi = diaChiVi.toLowerCase();
    const danhSach = docLuuTru(KHOA_DS, []);
    if (danhSach.some((u) => u.diaChiVi === vi && u.email !== nguoiDung.email)) {
      throw new Error("Ví này đã được liên kết với tài khoản khác.");
    }
    ghiLuuTru(KHOA_DS, danhSach.map((u) => (u.email === nguoiDung.email ? { ...u, diaChiVi: vi } : u)));
    const moi = { ...nguoiDung, diaChiVi: vi };
    ghiLuuTru(KHOA_HIEN_TAI, moi);
    setNguoiDung(moi);
  };

  const dangXuat = () => {
    ghiLuuTru(KHOA_HIEN_TAI, null);
    setNguoiDung(null);
  };

  return (
    <NguCanhTaiKhoan.Provider value={{ nguoiDung, daDangNhap: Boolean(nguoiDung), dangKy, dangNhap, dangXuat, lienKetVi }}>
      {children}
    </NguCanhTaiKhoan.Provider>
  );
}

export function useTaiKhoan() {
  return useContext(NguCanhTaiKhoan);
}

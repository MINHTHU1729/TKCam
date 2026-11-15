import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { goiAPI, KHOA_TOKEN } from "../tienich/api";
import { docLuuTru, ghiLuuTru } from "../tienich/luuTru";

// Quản lý đăng nhập / đăng ký cho toàn bộ trang.
// Tài khoản (khách và quản trị) lưu trong MySQL qua API PHP; mật khẩu kiểm tra ở máy chủ.
// Trình duyệt chỉ giữ token đăng nhập và bản sao thông tin để hiện nhanh.
// Tiền thuê, tiền cọc, đơn thuê, lịch sử vẫn nằm trên smart contract.
const NguCanhTaiKhoan = createContext(null);
const KHOA_NGUOI_DUNG = "tkcam_nguoi_dung";

export function TaiKhoanProvider({ children }) {
  const [nguoiDung, setNguoiDung] = useState(() =>
    docLuuTru(KHOA_TOKEN, null) ? docLuuTru(KHOA_NGUOI_DUNG, null) : null
  );

  // Lưu phiên sau khi đăng ký / đăng nhập / cập nhật
  const luuPhien = useCallback((token, nd) => {
    if (token) ghiLuuTru(KHOA_TOKEN, token);
    ghiLuuTru(KHOA_NGUOI_DUNG, nd);
    setNguoiDung(nd);
    return nd;
  }, []);

  const dangXuat = useCallback(() => {
    ghiLuuTru(KHOA_TOKEN, null);
    ghiLuuTru(KHOA_NGUOI_DUNG, null);
    setNguoiDung(null);
  }, []);

  // Mở web: còn token thì hỏi máy chủ thông tin mới nhất; token hết hạn / tài khoản bị xóa thì đăng xuất
  useEffect(() => {
    if (!docLuuTru(KHOA_TOKEN, null)) return;
    goiAPI("/tai-khoan/toi")
      .then(({ nguoiDung: nd }) => luuPhien(null, nd))
      .catch((e) => {
        if (e.status === 401 || e.status === 404) dangXuat();
      });
  }, [luuPhien, dangXuat]);

  const dangKy = async ({ hoTen, email, soDienThoai, matKhau }) => {
    const kq = await goiAPI("/tai-khoan/dang-ky", { method: "POST", body: { hoTen, email, soDienThoai, matKhau } });
    return luuPhien(kq.token, kq.nguoiDung);
  };

  // Trả về người vừa đăng nhập để trang Đăng nhập biết chuyển tới đâu (quản trị → /admin)
  const dangNhap = async ({ email, matKhau }) => {
    const kq = await goiAPI("/tai-khoan/dang-nhap", { method: "POST", body: { email, matKhau } });
    return luuPhien(kq.token, kq.nguoiDung);
  };

  // Gắn ví MetaMask vào tài khoản đang đăng nhập (mỗi ví chỉ thuộc 1 tài khoản)
  const lienKetVi = async (diaChiVi) => {
    const kq = await goiAPI("/tai-khoan/vi", { method: "PUT", body: { diaChiVi } });
    luuPhien(null, kq.nguoiDung);
  };

  return (
    <NguCanhTaiKhoan.Provider
      value={{
        nguoiDung,
        daDangNhap: Boolean(nguoiDung),
        laAdmin: nguoiDung?.vaiTro === "admin",
        dangKy,
        dangNhap,
        dangXuat,
        lienKetVi,
      }}
    >
      {children}
    </NguCanhTaiKhoan.Provider>
  );
}

export function useTaiKhoan() {
  return useContext(NguCanhTaiKhoan);
}

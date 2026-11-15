import { useCallback, useEffect, useState } from "react";
import { goiAPI } from "../tienich/api";

// Hook: đơn thuê của tài khoản đang đăng nhập (lấy từ CSDL qua API, kèm mã hash giao dịch)
export function useDonThue(daDangNhap) {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");

  const taiLai = useCallback(async () => {
    if (!daDangNhap) return;
    setDangTai(true);
    setLoi("");
    try {
      setDanhSach(await goiAPI("/don-thue/cua-toi"));
    } catch (e) {
      setLoi(e.message);
    } finally {
      setDangTai(false);
    }
  }, [daDangNhap]);

  useEffect(() => {
    taiLai();
  }, [taiLai]);

  return { danhSach, dangTai, loi, taiLai };
}

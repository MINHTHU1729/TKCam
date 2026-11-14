import { useCallback, useEffect, useState } from "react";
import { layDonCuaVi, daCoHopDong, loiTiengViet } from "../tienich/hopDongThue";

// Hook: lấy danh sách đơn thuê của ví đang kết nối
export function useDonThue(diaChi) {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");

  const taiLai = useCallback(async () => {
    if (!diaChi || !daCoHopDong()) return;
    setDangTai(true);
    setLoi("");
    try {
      setDanhSach(await layDonCuaVi(diaChi));
    } catch (e) {
      setLoi(loiTiengViet(e));
    } finally {
      setDangTai(false);
    }
  }, [diaChi]);

  useEffect(() => {
    taiLai();
  }, [taiLai]);

  return { danhSach, dangTai, loi, taiLai };
}

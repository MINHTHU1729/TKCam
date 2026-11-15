import { useCallback, useEffect, useState } from "react";
import { layChuHopDong, laySoDuHopDong } from "../tienich/hopDongAdmin";
import { daCoHopDong } from "../tienich/hopDongThue";
import { goiAPI } from "../tienich/api";

// Kiểm tra ví đang kết nối có phải chủ hợp đồng không (thao tác ghi cần ví chủ)
export function useLaAdmin(diaChiVi) {
  const [chuHopDong, setChuHopDong] = useState("");

  useEffect(() => {
    if (!daCoHopDong()) return;
    layChuHopDong().then(setChuHopDong).catch(() => setChuHopDong(""));
  }, []);

  return {
    chuHopDong,
    daTaiChu: Boolean(chuHopDong),
    laAdmin: Boolean(diaChiVi && chuHopDong) && diaChiVi.toLowerCase() === chuHopDong.toLowerCase(),
  };
}

// Dữ liệu cho khu quản trị: máy, đơn thuê, giao dịch lấy từ CSDL (API); số dư hợp đồng đọc từ blockchain
export function useDuLieuAdmin() {
  const [duLieu, setDuLieu] = useState({ dsMay: [], dsDon: [], dsGiaoDich: [], soDuHopDong: "0" });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");

  const taiLai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    try {
      const [dsMay, dsDon, dsGiaoDich, soDuHopDong] = await Promise.all([
        goiAPI("/may-anh"),
        goiAPI("/quan-tri/don-thue"),
        goiAPI("/quan-tri/giao-dich"),
        laySoDuHopDong().catch(() => "0"),
      ]);
      setDuLieu({ dsMay, dsDon, dsGiaoDich, soDuHopDong });
    } catch (e) {
      setLoi(e.message);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    taiLai();
  }, [taiLai]);

  return { ...duLieu, dangTai, loi, taiLai };
}

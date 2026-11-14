import { useEffect, useState } from "react";
import { layDanhSachMay } from "../tienich/dulieuMay";

// Hook dùng chung: danh sách máy, đang tải, lỗi
export function useDanhSachMay() {
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    layDanhSachMay()
      .then(setDanhSach)
      .catch((e) => setLoi(e.message))
      .finally(() => setDangTai(false));
  }, []);

  return { danhSach, dangTai, loi };
}

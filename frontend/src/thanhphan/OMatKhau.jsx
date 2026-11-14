import { useState } from "react";
import BieuTuong from "./BieuTuong";

// Ô nhập mật khẩu có nút hiện / ẩn
export default function OMatKhau({ loi, ...thuocTinh }) {
  const [hien, setHien] = useState(false);
  return (
    <div className={`o-mat-khau ${loi ? "o-nhap--loi" : ""}`}>
      <input type={hien ? "text" : "password"} {...thuocTinh} />
      <button type="button" onClick={() => setHien(!hien)} aria-label={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
        <BieuTuong ten={hien ? "matTat" : "mat"} co={18} />
      </button>
    </div>
  );
}

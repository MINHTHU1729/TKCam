// Các thành phần dùng chung cho trang quản trị: ô tìm kiếm, phân trang, nút xuất Excel, link ví
import { useEffect, useMemo, useState } from "react";
import BieuTuong from "../../thanhphan/BieuTuong";
import { MA_MANG } from "../../tienich/cauhinh";

// Bỏ dấu tiếng Việt để tìm "thu" ra "Thư", "do minh" ra "Đỗ Minh"
export const boDau = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

// Có từ khóa trong bất kỳ trường nào không
export const khopTuKhoa = (tuKhoa, ...truong) => {
  const k = boDau(tuKhoa.trim());
  if (!k) return true;
  return truong.some((t) => t !== null && t !== undefined && boDau(t).includes(k));
};

// Link xem ví trên Etherscan
export const linkVi = (dc) => (dc && MA_MANG === 11155111 ? `https://sepolia.etherscan.io/address/${dc}` : null);

// Ô tìm kiếm có biểu tượng kính lúp và nút xóa
export function ONhapTim({ giaTri, doi, goiY = "Tìm kiếm..." }) {
  return (
    <label className="ct-tim">
      <BieuTuong ten="kinhLup" co={18} />
      <input value={giaTri} onChange={(e) => doi(e.target.value)} placeholder={goiY} />
      {giaTri && (
        <button type="button" onClick={() => doi("")} aria-label="Xóa tìm kiếm">
          <BieuTuong ten="dauX" co={16} />
        </button>
      )}
    </label>
  );
}

// Nút xuất Excel (CSV)
export function NutXuat({ onClick, soDong }) {
  return (
    <button type="button" className="nut nut-vien nut-nho-vua ct-nut" onClick={onClick} disabled={!soDong}>
      <BieuTuong ten="danhSach" co={16} /> Xuất Excel ({soDong})
    </button>
  );
}

// Chia danh sách thành từng trang; về trang 1 khi bộ lọc đổi
export function usePhanTrang(ds, soMoiTrang = 10) {
  const [trang, setTrang] = useState(1);
  const tongTrang = Math.max(1, Math.ceil(ds.length / soMoiTrang));
  useEffect(() => {
    if (trang > tongTrang) setTrang(1);
  }, [tongTrang, trang]);
  const dsTrang = useMemo(() => ds.slice((trang - 1) * soMoiTrang, trang * soMoiTrang), [ds, trang, soMoiTrang]);
  return { dsTrang, trang, tongTrang, setTrang, tong: ds.length, soMoiTrang };
}

// Thanh phân trang: « 1 2 3 … »
export function PhanTrang({ trang, tongTrang, setTrang, tong, soMoiTrang }) {
  if (tong <= soMoiTrang) return null;
  const tu = (trang - 1) * soMoiTrang + 1;
  const den = Math.min(trang * soMoiTrang, tong);
  const so = [];
  for (let i = 1; i <= tongTrang; i++) {
    if (i === 1 || i === tongTrang || Math.abs(i - trang) <= 1) so.push(i);
    else if (so[so.length - 1] !== "…") so.push("…");
  }
  return (
    <div className="ct-trang">
      <span className="mo nho">Hiển thị {tu}–{den} / {tong}</span>
      <div className="ct-trang__nut">
        <button type="button" onClick={() => setTrang(trang - 1)} disabled={trang === 1} aria-label="Trang trước">‹</button>
        {so.map((s, i) =>
          s === "…" ? <span key={`c${i}`} className="mo">…</span> : (
            <button type="button" key={s} className={s === trang ? "chon" : ""} onClick={() => setTrang(s)}>{s}</button>
          )
        )}
        <button type="button" onClick={() => setTrang(trang + 1)} disabled={trang === tongTrang} aria-label="Trang sau">›</button>
      </div>
    </div>
  );
}

// Nút sao chép (địa chỉ ví, mã hash...)
export function NutSaoChep({ noiDung }) {
  const [xong, setXong] = useState(false);
  const chep = async () => {
    try {
      await navigator.clipboard.writeText(noiDung);
      setXong(true);
      setTimeout(() => setXong(false), 1500);
    } catch {
      /* trình duyệt chặn sao chép */
    }
  };
  return (
    <button type="button" className="ct-chep" onClick={chep} title="Sao chép">
      {xong ? "Đã chép" : "Sao chép"}
    </button>
  );
}
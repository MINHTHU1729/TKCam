// Bộ biểu tượng nét mảnh dùng chung (SVG), đổi màu theo màu chữ
const DUONG = {
  khien: "M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z M9 12l2 2 4-4",
  dongHo: "M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  kinhLup: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M20 20l-4-4",
  vi: "M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7z M3 7l2-3h11 M16 13.5h2",
  mayAnh: "M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  hoanTien: "M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4 M12 8v8 M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.5-1 1.3-2.5 1.5-2.5.6-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5",
  muiTen: "M5 12h14 M13 6l6 6-6 6",
  dauTick: "M5 12l5 5 9-10",
  dauX: "M6 6l12 12 M18 6L6 18",
  nguoi: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 3.6-7 8-7s8 3 8 7",
  mat: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  matTat: "M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2 M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1",
  dangXuat: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 16l-4-4 4-4 M6 12h10",
  maVach: "M4 6v12 M7 6v12 M10 6v12 M14 6v12 M17 6v12 M20 6v12",
  maiNha: "M3 11l9-7 9 7 M5 10v10h14V10",
  thu: "M3 6h18v12H3z M3 6l9 7 9-7",
  dienThoai: "M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z",
  khoa: "M6 11h12v9H6z M8 11V8a4 4 0 1 1 8 0v3",
  luoi: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  danhSach: "M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
  cong: "M12 5v14 M5 12h14",
  nhom: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14c2.2.6 3.5 2.6 3.5 6",
  taiLai: "M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7",
  sao: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z",
};

export default function BieuTuong({ ten, co = 20, className = "" }) {
  return (
    <svg
      width={co}
      height={co}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={DUONG[ten]} />
    </svg>
  );
}

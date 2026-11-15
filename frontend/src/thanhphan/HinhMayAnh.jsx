import { useId, useState } from "react";

// Ảnh máy: có link ảnh thì hiện ảnh thật, không có (hoặc ảnh lỗi) thì vẽ hình minh họa SVG theo màu thân máy
export default function HinhMayAnh({ mau = "#2b2b2e", anh = "", ten = "Máy ảnh compact", lon = false, nen = true }) {
  const idBong = useId();
  const [anhLoi, setAnhLoi] = useState(false);
  const lop = `hinh-may ${lon ? "hinh-may--lon" : ""} ${nen ? "" : "hinh-may--trong"}`;

  if (anh && !anhLoi) {
    return (
      <div className={`${lop} hinh-may--anh`}>
        <img src={anh} alt={ten} loading="lazy" onError={() => setAnhLoi(true)} />
      </div>
    );
  }

  return (
    <div className={lop}>
      <svg viewBox="0 0 200 130" role="img" aria-label={ten}>
        <defs>
          <linearGradient id={idBong} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect x="30" y="14" width="34" height="14" rx="4" fill={mau} />
        <rect x="140" y="16" width="24" height="10" rx="3" fill="#e2562b" />
        <rect x="18" y="24" width="164" height="94" rx="14" fill={mau} />
        <rect x="18" y="24" width="164" height="94" rx="14" fill={`url(#${idBong})`} />
        <rect x="18" y="98" width="164" height="6" fill="#000" opacity="0.08" />
        <circle cx="100" cy="72" r="34" fill="#1d1a17" />
        <circle cx="100" cy="72" r="26" fill="#3a342e" />
        <circle cx="100" cy="72" r="16" fill="#0f0d0b" />
        <circle cx="93" cy="65" r="5" fill="#ffffff" opacity="0.35" />
        <rect x="146" y="38" width="24" height="14" rx="3" fill="#fffdf8" opacity="0.85" />
        <circle cx="38" cy="44" r="4" fill="#000" opacity="0.18" />
      </svg>
    </div>
  );
}

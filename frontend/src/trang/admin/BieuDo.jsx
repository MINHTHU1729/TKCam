// Biểu đồ vẽ bằng SVG (không cần thư viện ngoài)
import { useState } from "react";

// Biểu đồ cột: du = [{ nhan: "16/11", giaTri: 0.0003, phu: "2 đơn" }]
export function BieuDoCot({ du, dinhDang = (v) => v, mau = "var(--cam)", cao = 220 }) {
  const [chon, setChon] = useState(null);
  const lon = Math.max(...du.map((d) => d.giaTri), 0);
  const dinh = lon > 0 ? lon * 1.15 : 1;
  const rong = 640;
  const le = { trai: 8, phai: 8, tren: 16, duoi: 28 };
  const caoVe = cao - le.tren - le.duoi;
  const buoc = (rong - le.trai - le.phai) / du.length;
  const rongCot = Math.max(6, Math.min(36, buoc * 0.62));
  const nhanCach = Math.ceil(du.length / 10); // không hiện quá 10 nhãn ngày

  return (
    <div className="bd">
      <svg viewBox={`0 0 ${rong} ${cao}`} className="bd__svg" role="img" aria-label="Biểu đồ cột">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={le.trai} x2={rong - le.phai} y1={le.tren + caoVe * (1 - t)} y2={le.tren + caoVe * (1 - t)} className="bd__luoi" />
        ))}
        {du.map((d, i) => {
          const h = (d.giaTri / dinh) * caoVe;
          const x = le.trai + buoc * i + (buoc - rongCot) / 2;
          return (
            <g key={i} onMouseEnter={() => setChon(i)} onMouseLeave={() => setChon(null)}>
              <rect x={le.trai + buoc * i} y={le.tren} width={buoc} height={caoVe} fill="transparent" />
              <rect x={x} y={le.tren + caoVe - h} width={rongCot} height={Math.max(h, d.giaTri > 0 ? 2 : 0)} rx="4"
                fill={mau} opacity={chon === null || chon === i ? 1 : 0.45} />
              {i % nhanCach === 0 && (
                <text x={le.trai + buoc * i + buoc / 2} y={cao - 8} textAnchor="middle" className="bd__nhan">{d.nhan}</text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="bd__chu-thich">
        {chon !== null ? (
          <><b>{du[chon].nhan}</b>: {dinhDang(du[chon].giaTri)}{du[chon].phu ? ` · ${du[chon].phu}` : ""}</>
        ) : (
          <span className="mo">Rê chuột lên cột để xem chi tiết</span>
        )}
      </div>
    </div>
  );
}

// Biểu đồ tròn rỗng: phan = [{ ten, giaTri, mau }]
export function BieuDoTron({ phan, giua }) {
  const tong = phan.reduce((s, p) => s + p.giaTri, 0);
  const r = 70;
  const chuVi = 2 * Math.PI * r;
  let daVe = 0;

  return (
    <div className="bd-tron">
      <svg viewBox="0 0 200 200" className="bd-tron__svg" role="img" aria-label="Biểu đồ tròn">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--nen-dam)" strokeWidth="26" />
        {tong > 0 && phan.filter((p) => p.giaTri > 0).map((p) => {
          const dai = (p.giaTri / tong) * chuVi;
          const vong = (
            <circle key={p.ten} cx="100" cy="100" r={r} fill="none" stroke={p.mau} strokeWidth="26"
              strokeDasharray={`${dai} ${chuVi - dai}`} strokeDashoffset={-daVe} transform="rotate(-90 100 100)" />
          );
          daVe += dai;
          return vong;
        })}
        <text x="100" y="96" textAnchor="middle" className="bd-tron__so">{tong}</text>
        <text x="100" y="118" textAnchor="middle" className="bd-tron__chu">{giua}</text>
      </svg>
      <ul className="bd-tron__chu-thich">
        {phan.map((p) => (
          <li key={p.ten}>
            <span className="bd-tron__cham" style={{ background: p.mau }} />
            <span>{p.ten}</span>
            <b>{p.giaTri}</b>
            <span className="mo nho">{tong ? Math.round((p.giaTri / tong) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { linkGiaoDich } from "../tienich/cauhinh";

// Hiện mã hash giao dịch rút gọn, bấm để xem trên Etherscan
export default function MaGiaoDich({ hash, nhan }) {
  if (!hash) return <span className="mo nho">—</span>;
  const gon = `${hash.slice(0, 10)}…${hash.slice(-6)}`;
  const link = linkGiaoDich(hash);
  return (
    <span className="ma-gd" title={hash}>
      {nhan && <span className="mo nho">{nhan} </span>}
      {link ? <a href={link} target="_blank" rel="noreferrer"><code>{gon}</code> ↗</a> : <code>{gon}</code>}
    </span>
  );
}

import { Link } from "react-router-dom";
import HinhMayAnh from "./HinhMayAnh";
import { dinhDangEth, TRANG_THAI } from "../tienich/dinhdang";

// Thẻ hiển thị một máy ảnh trong danh sách
export default function TheMayAnh({ may, soNgay }) {
  const tt = TRANG_THAI[may.trangThai];
  return (
    <Link to={`/may-anh/${may.id}${soNgay ? `?ngay=${soNgay}` : ""}`} className="the-may">
      <div className="the-may__anh">
        <HinhMayAnh mau={may.mau} anh={may.anh} ten={may.ten} />
        <span className={`trang-thai ${tt.lop} the-may__nhan`}>{tt.ten}</span>
      </div>
      <div className="the-may__than">
        <span className="the-may__hang">{may.hang}</span>
        <h3>{may.ten}</h3>
        <div className="the-may__the">
          {may.phuHop?.map((p) => <span key={p}>{p}</span>)}
        </div>
        <div className="the-may__gia">
          <div>
            <b>{dinhDangEth(may.giaNgay)}</b>
            <span className="mo"> / ngày</span>
          </div>
          <span className="mo nho">
            {soNgay > 1 ? `${soNgay} ngày: ${dinhDangEth(may.giaNgay * soNgay)}` : `Cọc ${dinhDangEth(may.coc)}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

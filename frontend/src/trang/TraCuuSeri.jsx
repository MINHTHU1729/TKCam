import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HinhMayAnh from "../thanhphan/HinhMayAnh";
import BieuTuong from "../thanhphan/BieuTuong";
import MaGiaoDich from "../thanhphan/MaGiaoDich";
import { useDanhSachMay } from "../xuly/dungMayAnh";
import { TRANG_THAI } from "../tienich/dinhdang";
import { goiAPI } from "../tienich/api";

const ngay = (giay) => (giay ? new Date(giay * 1000).toLocaleDateString("vi-VN") : "—");

function ketQuaDon(d) {
  if (d.trangThai === 0) return "Đang thuê";
  if (d.trangThai === 2) return "Đã hủy";
  return d.phiTre > 0 || d.tienHuHong > 0 ? "Trả máy, có khấu trừ cọc" : "Trả đúng hạn, hoàn cọc đủ";
}

// Tra cứu máy theo số seri: thông tin máy + lịch sử thuê (từ CSDL, kèm mã hash để kiểm chứng trên blockchain)
export default function TraCuuSeri() {
  const { danhSach } = useDanhSachMay();
  const [thamSo, setThamSo] = useSearchParams();
  const [seri, setSeri] = useState(thamSo.get("seri") || "");
  const [ketQua, setKetQua] = useState({ trangThai: "chua" }); // chua | dang-tai | khong-thay | co | loi

  const traCuu = async (giaTri) => {
    const s = giaTri.trim();
    if (!s) return;
    setThamSo({ seri: s });
    setKetQua({ trangThai: "dang-tai" });
    try {
      const kq = await goiAPI(`/tra-cuu?seri=${encodeURIComponent(s)}`);
      setKetQua({ trangThai: "co", ...kq });
    } catch (e) {
      setKetQua(e.status === 404 ? { trangThai: "khong-thay" } : { trangThai: "loi", loi: e.message });
    }
  };

  // Mở trang với ?seri=... thì tự tra cứu
  useEffect(() => {
    const tuDuongDan = thamSo.get("seri");
    if (tuDuongDan) traCuu(tuDuongDan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const may = ketQua.may;

  return (
    <div className="khung khoi hep">
      <span className="nhan-nho">Minh bạch</span>
      <h1 className="tieu-de-trang">Tra cứu theo số seri</h1>
      <p className="mo-ta">
        Nhập số seri in dưới đáy máy để xem máy đã được thuê bao nhiêu lần và tình trạng hiện tại.
        Mỗi lượt thuê có mã giao dịch để kiểm chứng trên blockchain.
      </p>

      <form className="o-tra-cuu" onSubmit={(e) => { e.preventDefault(); traCuu(seri); }}>
        <div className="o-tim o-tim--lon">
          <BieuTuong ten="maVach" co={20} />
          <input placeholder="Nhập số seri, ví dụ CN-IX285-0001" value={seri} onChange={(e) => setSeri(e.target.value)} />
        </div>
        <button className="nut nut-chinh nut-lon" type="submit">Tra cứu</button>
      </form>

      <div className="goi-y">
        <span className="mo">Thử:</span>
        {danhSach.slice(0, 3).map((m) => (
          <button key={m.seri} className="chip" onClick={() => { setSeri(m.seri); traCuu(m.seri); }}>
            {m.seri}
          </button>
        ))}
      </div>

      {ketQua.trangThai === "dang-tai" && <div className="trong">Đang tra cứu...</div>}
      {ketQua.trangThai === "khong-thay" && <div className="trong">Không tìm thấy máy có số seri này.</div>}
      {ketQua.trangThai === "loi" && <p className="thong-bao thong-bao--loi">{ketQua.loi}</p>}

      {may && (
        <div className="the-ket-qua">
          <div className="ket-qua__dau">
            <HinhMayAnh mau={may.mau} anh={may.anh} ten={may.ten} />
            <div>
              <span className="the-may__hang">{may.hang}</span>
              <h3>{may.ten}</h3>
              <code>{may.seri}</code>
              <span className={`trang-thai ${TRANG_THAI[may.trangThai].lop}`}>{TRANG_THAI[may.trangThai].ten}</span>
              <Link to={`/may-anh/${may.id}`} className="lien-ket">Xem chi tiết máy <BieuTuong ten="muiTen" co={14} /></Link>
            </div>
          </div>

          <h4>Lịch sử thuê ({ketQua.lichSu.length} lượt)</h4>
          {ketQua.lichSu.length ? (
            <div className="cuon-ngang">
              <table className="bang">
                <thead>
                  <tr><th>Người thuê</th><th>Ngày thuê</th><th>Ngày trả</th><th>Kết quả</th><th>Giao dịch</th></tr>
                </thead>
                <tbody>
                  {ketQua.lichSu.map((d) => (
                    <tr key={d.maDon}>
                      <td><code>{d.nguoiThue}</code></td>
                      <td>{ngay(d.batDau)}</td>
                      <td>{ngay(d.ngayTra)}</td>
                      <td>{ketQuaDon(d)}</td>
                      <td><MaGiaoDich hash={d.txThue} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mo">Máy này chưa có lượt thuê nào.</p>
          )}
        </div>
      )}
    </div>
  );
}

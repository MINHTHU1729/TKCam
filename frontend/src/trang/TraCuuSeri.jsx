import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HinhMayAnh from "../thanhphan/HinhMayAnh";
import BieuTuong from "../thanhphan/BieuTuong";
import { useDanhSachMay } from "../xuly/dungMayAnh";
import { TRANG_THAI } from "../tienich/dinhdang";
import { daCoHopDong, layLichSuMay } from "../tienich/hopDongThue";

export default function TraCuuSeri() {
  const { danhSach } = useDanhSachMay();
  const [thamSo, setThamSo] = useSearchParams();
  const [seri, setSeri] = useState(thamSo.get("seri") || "");
  const [ketQua, setKetQua] = useState(undefined); // undefined = chưa tra, null = không thấy
  const [lichSu, setLichSu] = useState({ dangTai: false, ds: [] });

  // Có máy thì đọc lịch sử thuê từ hợp đồng
  useEffect(() => {
    if (!ketQua) return;
    if (!daCoHopDong()) {
      setLichSu({ dangTai: false, ds: ketQua.lichSu || [] });
      return;
    }
    let conDung = true;
    setLichSu({ dangTai: true, ds: [] });
    layLichSuMay(ketQua.id)
      .then((ds) => conDung && setLichSu({ dangTai: false, ds }))
      .catch(() => conDung && setLichSu({ dangTai: false, ds: [] }));
    return () => {
      conDung = false;
    };
  }, [ketQua]);

  const tim = (giaTri) => danhSach.find((m) => m.seri.toLowerCase() === giaTri.trim().toLowerCase()) || null;

  // Mở trang với ?seri=... thì tự tra cứu
  useEffect(() => {
    const tuDuongDan = thamSo.get("seri");
    if (tuDuongDan && danhSach.length) setKetQua(tim(tuDuongDan));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [danhSach]);

  const traCuu = (e) => {
    e.preventDefault();
    setThamSo(seri.trim() ? { seri: seri.trim() } : {});
    setKetQua(tim(seri));
  };

  return (
    <div className="khung khoi hep">
      <span className="nhan-nho">Minh bạch</span>
      <h1 className="tieu-de-trang">Tra cứu theo số seri</h1>
      <p className="mo-ta">Nhập số seri in dưới đáy máy để xem máy đã được thuê bao nhiêu lần và tình trạng hiện tại.</p>

      <form className="o-tra-cuu" onSubmit={traCuu}>
        <div className="o-tim o-tim--lon">
          <BieuTuong ten="maVach" co={20} />
          <input placeholder="Nhập số seri, ví dụ CN-IX285-0001" value={seri} onChange={(e) => setSeri(e.target.value)} />
        </div>
        <button className="nut nut-chinh nut-lon" type="submit">Tra cứu</button>
      </form>

      <div className="goi-y">
        <span className="mo">Thử:</span>
        {danhSach.slice(0, 3).map((m) => (
          <button key={m.seri} className="chip" onClick={() => { setSeri(m.seri); setThamSo({ seri: m.seri }); setKetQua(m); }}>
            {m.seri}
          </button>
        ))}
      </div>

      {ketQua === null && <div className="trong">Không tìm thấy máy có số seri này.</div>}

      {ketQua && (
        <div className="the-ket-qua">
          <div className="ket-qua__dau">
            <HinhMayAnh mau={ketQua.mau} />
            <div>
              <span className="the-may__hang">{ketQua.hang}</span>
              <h3>{ketQua.ten}</h3>
              <code>{ketQua.seri}</code>
              <span className={`trang-thai ${TRANG_THAI[ketQua.trangThai].lop}`}>{TRANG_THAI[ketQua.trangThai].ten}</span>
              <Link to={`/may-anh/${ketQua.id}`} className="lien-ket">Xem chi tiết máy <BieuTuong ten="muiTen" co={14} /></Link>
            </div>
          </div>

          <h4>Lịch sử thuê {lichSu.dangTai ? "" : `(${lichSu.ds.length} lượt)`}</h4>
          {lichSu.dangTai ? (
            <p className="mo">Đang tải lịch sử...</p>
          ) : lichSu.ds.length ? (
            <div className="cuon-ngang">
              <table className="bang">
                <thead>
                  <tr><th>Người thuê</th><th>Ngày thuê</th><th>Ngày trả</th><th>Kết quả</th></tr>
                </thead>
                <tbody>
                  {lichSu.ds.map((d, i) => (
                    <tr key={i}>
                      <td><code>{d.nguoiThue}</code></td>
                      <td>{d.ngayThue}</td>
                      <td>{d.ngayTra}</td>
                      <td>{d.ketQua}</td>
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

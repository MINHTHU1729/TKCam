import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { datBaoTri } from "../../tienich/hopDongAdmin";
import { TRANG_THAI } from "../../tienich/dinhdang";
import HinhMayAnh from "../../thanhphan/HinhMayAnh";
import { khopTuKhoa, ONhapTim, PhanTrang, usePhanTrang } from "./CongCu";

const BO_LOC = [
  { ma: "tat-ca", ten: "Tất cả", loc: () => true },
  { ma: "san-sang", ten: "Sẵn sàng", loc: (m) => m.trangThai === "san-sang" },
  { ma: "dang-thue", ten: "Đang cho thuê", loc: (m) => m.trangThai === "dang-thue" },
  { ma: "bao-tri", ten: "Bảo trì", loc: (m) => m.baoTri },
  { ma: "chua-ky", ten: "Chưa ký giá", loc: (m) => !m.coBaoGia },
];

const SAP_XEP = {
  "moi-nhat": (a, b) => b.id - a.id,
  "ten": (a, b) => a.ten.localeCompare(b.ten, "vi"),
  "gia-tang": (a, b) => a.giaNgay - b.giaNgay,
  "gia-giam": (a, b) => b.giaNgay - a.giaNgay,
};

// Trang "Máy ảnh": tìm kiếm, lọc theo trạng thái / hãng, bật tắt bảo trì (không tốn gas), sửa máy
export default function QuanLyMay({ dsMay, dangTai, taiLai }) {
  const [dangXuLy, setDangXuLy] = useState(null);
  const { state } = useLocation(); // thông báo gửi sang từ trang Thêm / Sửa máy
  const [thongBao, setThongBao] = useState({ loai: "tin", noiDung: state?.thongBao || "" });
  const [tuKhoa, setTuKhoa] = useState("");
  const [boLoc, setBoLoc] = useState("tat-ca");
  const [hang, setHang] = useState("");
  const [sapXep, setSapXep] = useState("moi-nhat");

  const dsHang = useMemo(() => [...new Set(dsMay.map((m) => m.hang).filter(Boolean))].sort(), [dsMay]);
  const dsLoc = useMemo(() => {
    const loc = BO_LOC.find((b) => b.ma === boLoc).loc;
    return dsMay
      .filter((m) => loc(m) && (!hang || m.hang === hang) && khopTuKhoa(tuKhoa, m.ten, m.seri, m.hang, `#${m.id}`))
      .sort(SAP_XEP[sapXep]);
  }, [dsMay, boLoc, hang, tuKhoa, sapXep]);
  const pt = usePhanTrang(dsLoc, 8);

  const doiBaoTri = async (may) => {
    const baoTri = !may.baoTri;
    setDangXuLy(may.id);
    setThongBao({ loai: "tin", noiDung: "Đang lưu..." });
    try {
      await datBaoTri(may.id, baoTri);
      setThongBao({ loai: "thanh-cong", noiDung: baoTri ? `Đã chuyển máy #${may.id} sang bảo trì.` : `Máy #${may.id} đã sẵn sàng cho thuê.` });
      await taiLai();
    } catch (e) {
      setThongBao({ loai: "loi", noiDung: e.message });
    } finally {
      setDangXuLy(null);
    }
  };

  return (
    <>
      {thongBao.noiDung && <p className={`thong-bao thong-bao--${thongBao.loai}`}>{thongBao.noiDung}</p>}

      <section className="the-khung">
        <div className="qt__hang">
          <h3>Danh sách máy ({dsLoc.length}{dsLoc.length !== dsMay.length ? ` / ${dsMay.length}` : ""})</h3>
          <Link to="/admin/them-may" className="nut nut-chinh nut-nho-vua">+ Thêm máy</Link>
        </div>

        <div className="ct-loc">
          <ONhapTim giaTri={tuKhoa} doi={setTuKhoa} goiY="Tìm theo tên, số seri, hãng, mã máy..." />
          <select className="o-nhap ct-chon" value={hang} onChange={(e) => setHang(e.target.value)} aria-label="Lọc theo hãng">
            <option value="">Tất cả hãng</option>
            {dsHang.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <select className="o-nhap ct-chon" value={sapXep} onChange={(e) => setSapXep(e.target.value)} aria-label="Sắp xếp">
            <option value="moi-nhat">Mới thêm trước</option>
            <option value="ten">Tên A → Z</option>
            <option value="gia-tang">Giá thấp → cao</option>
            <option value="gia-giam">Giá cao → thấp</option>
          </select>
        </div>
        <div className="hang-chip">
          {BO_LOC.map((b) => (
            <button key={b.ma} className={`chip ${boLoc === b.ma ? "chip--chon" : ""}`} onClick={() => setBoLoc(b.ma)}>
              {b.ten} ({dsMay.filter(b.loc).length})
            </button>
          ))}
        </div>

        {dangTai && !dsMay.length ? (
          <p className="mo">Đang tải...</p>
        ) : dsLoc.length ? (
          <div className="cuon-ngang">
            <table className="bang qt__bang">
              <thead>
                <tr><th>Máy</th><th>Giá / ngày</th><th>Tiền cọc</th><th>Trạng thái</th><th></th></tr>
              </thead>
              <tbody>
                {pt.dsTrang.map((m) => {
                  const dangThue = m.trangThai === "dang-thue";
                  const ban = dangXuLy === m.id;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="qt__may">
                          <span className="qt__anh-nho"><HinhMayAnh anh={m.anh} mau={m.mau} ten={m.ten} /></span>
                          <div>
                            <b>{m.ten}</b>
                            <div className="mo nho">#{m.id} · {m.seri}{m.hang ? ` · ${m.hang}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td>{m.giaNgay} ETH</td>
                      <td>{m.coc} ETH</td>
                      <td>
                        {m.coBaoGia ? (
                          <span className={`trang-thai ${TRANG_THAI[m.trangThai].lop}`}>{TRANG_THAI[m.trangThai].ten}</span>
                        ) : (
                          <span className="trang-thai vang" title="Bấm Sửa để ký báo giá">Chưa ký giá</span>
                        )}
                        {dangThue && <div className="mo nho">Đơn #{m.donHienTai}</div>}
                      </td>
                      <td className="qt__nut-dong">
                        <Link to={`/admin/may-anh/${m.id}`} className="nut nut-phu nut-nho-vua">Sửa</Link>
                        <button className="nut nut-vien nut-nho-vua" disabled={dangThue || ban}
                          title={dangThue ? "Máy đang cho thuê" : ""} onClick={() => doiBaoTri(m)}>
                          {ban ? "Đang lưu..." : m.baoTri ? "Mở cho thuê" : "Bảo trì"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mo ct-trong">Không có máy nào khớp với bộ lọc.</p>
        )}
        <PhanTrang {...pt} />
        <p className="mo nho">
          Thêm máy, sửa ảnh, đổi giá, bảo trì đều lưu trong CSDL nên không tốn gas (đổi giá chỉ cần ký xác nhận trong MetaMask).
          Máy đang có khách thuê thì chưa bật bảo trì được.
        </p>
      </section>
    </>
  );
}

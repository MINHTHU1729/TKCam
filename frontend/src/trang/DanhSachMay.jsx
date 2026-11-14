import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TheMayAnh from "../thanhphan/TheMayAnh";
import BieuTuong from "../thanhphan/BieuTuong";
import { useDanhSachMay } from "../xuly/dungMayAnh";

const CACH_SAP_XEP = {
  "moi-nhat": "Mặc định",
  "gia-tang": "Giá thấp → cao",
  "gia-giam": "Giá cao → thấp",
};

export default function DanhSachMay() {
  const { danhSach, dangTai, loi } = useDanhSachMay();
  const [thamSo, setThamSo] = useSearchParams();
  const [tuKhoa, setTuKhoa] = useState("");
  const [chiSanSang, setChiSanSang] = useState(false);
  const [sapXep, setSapXep] = useState("moi-nhat");

  // Hãng và nhu cầu lưu trên đường dẫn (?hang=Canon&nhu-cau=Vlog) để chia sẻ được
  const hang = thamSo.get("hang") || "Tất cả";
  const nhuCau = thamSo.get("nhu-cau") || "Tất cả";
  const soNgay = Number(thamSo.get("ngay")) || 0;

  const doiThamSo = (khoa, giaTri) => {
    const moi = new URLSearchParams(thamSo);
    if (giaTri === "Tất cả") moi.delete(khoa);
    else moi.set(khoa, giaTri);
    setThamSo(moi);
  };

  const cacHang = ["Tất cả", ...new Set(danhSach.map((m) => m.hang))];
  const cacNhuCau = ["Tất cả", ...new Set(danhSach.flatMap((m) => m.phuHop || []))];

  const ketQua = useMemo(() => {
    const loc = danhSach.filter((m) => {
      const khop = (m.ten + m.seri).toLowerCase().includes(tuKhoa.toLowerCase());
      const dungHang = hang === "Tất cả" || m.hang === hang;
      const dungNhuCau = nhuCau === "Tất cả" || m.phuHop?.includes(nhuCau);
      const sanSang = !chiSanSang || m.trangThai === "san-sang";
      return khop && dungHang && dungNhuCau && sanSang;
    });
    if (sapXep === "gia-tang") loc.sort((a, b) => a.giaNgay - b.giaNgay);
    if (sapXep === "gia-giam") loc.sort((a, b) => b.giaNgay - a.giaNgay);
    return loc;
  }, [danhSach, tuKhoa, hang, nhuCau, chiSanSang, sapXep]);

  const xoaLoc = () => {
    setTuKhoa("");
    setChiSanSang(false);
    setThamSo(soNgay ? { ngay: String(soNgay) } : {});
  };

  return (
    <div className="khung khoi">
      <span className="nhan-nho">Danh sách máy</span>
      <h1 className="tieu-de-trang">Máy ảnh cho thuê</h1>
      <p className="mo-ta">Máy được kiểm tra kỹ trước mỗi lượt thuê. Trả máy đúng hạn là nhận lại tiền cọc ngay.</p>

      <div className="thanh-loc">
        <div className="o-tim">
          <BieuTuong ten="kinhLup" co={18} />
          <input
            placeholder="Tìm theo tên máy hoặc số seri..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
          />
        </div>
        <select className="o-chon-loai" value={sapXep} onChange={(e) => setSapXep(e.target.value)}>
          {Object.entries(CACH_SAP_XEP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="o-chon">
          <input type="checkbox" checked={chiSanSang} onChange={(e) => setChiSanSang(e.target.checked)} />
          Chỉ máy sẵn sàng
        </label>
      </div>

      <div className="hang-chip">
        <span className="hang-chip__nhan">Hãng</span>
        {cacHang.map((h) => (
          <button key={h} className={`chip ${hang === h ? "chip--chon" : ""}`} onClick={() => doiThamSo("hang", h)}>{h}</button>
        ))}
      </div>
      <div className="hang-chip">
        <span className="hang-chip__nhan">Nhu cầu</span>
        {cacNhuCau.map((n) => (
          <button key={n} className={`chip ${nhuCau === n ? "chip--chon" : ""}`} onClick={() => doiThamSo("nhu-cau", n)}>{n}</button>
        ))}
      </div>

      {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}
      <p className="mo dem">{dangTai ? "Đang tải..." : `Tìm thấy ${ketQua.length} máy`}</p>

      {dangTai ? (
        <div className="luoi-may">
          {[1, 2, 3].map((i) => <div key={i} className="the-may the-may--cho" />)}
        </div>
      ) : ketQua.length ? (
        <div className="luoi-may">
          {ketQua.map((may) => <TheMayAnh key={may.id} may={may} soNgay={soNgay} />)}
        </div>
      ) : (
        <div className="trong">
          <p>Không tìm thấy máy phù hợp với bộ lọc.</p>
          <button className="nut nut-vien" onClick={xoaLoc}>Xóa bộ lọc</button>
        </div>
      )}
    </div>
  );
}

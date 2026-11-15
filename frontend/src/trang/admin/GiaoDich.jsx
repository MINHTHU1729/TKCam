import { useMemo, useState } from "react";
import MaGiaoDich from "../../thanhphan/MaGiaoDich";
import { dinhDangEth, rutGon } from "../../tienich/dinhdang";
import { xuatCSV } from "../../tienich/xuatFile";
import { khopTuKhoa, NutXuat, ONhapTim, PhanTrang, usePhanTrang } from "./CongCu";

const LOAI = {
  thue: { ten: "Thuê máy", lop: "xanh" },
  "tra-may": { ten: "Trả máy, hoàn cọc", lop: "xanh" },
  "huy-don": { ten: "Hủy đơn", lop: "xam" },
};

const thoiGian = (s) => new Date(s.replace(" ", "T")).toLocaleString("vi-VN");

const COT_XUAT = [
  { ten: "Thời gian", lay: (g) => thoiGian(g.thoiGian) },
  { ten: "Loại", lay: (g) => LOAI[g.loai]?.ten || g.loai },
  { ten: "Người thực hiện", lay: (g) => g.hoTen || "" },
  { ten: "Ví gửi", lay: (g) => g.viGui },
  { ten: "Máy", lay: (g) => g.tenMay || "" },
  { ten: "Mã đơn", lay: (g) => g.maDon || "" },
  { ten: "Số tiền (ETH)", lay: (g) => g.soTien },
  { ten: "Khối", lay: (g) => g.soKhoi },
  { ten: "Ghi chú", lay: (g) => g.ghiChu || "" },
  { ten: "Mã hash", lay: (g) => g.hash },
];

// Trang "Giao dịch": nhật ký giao dịch tiền trên blockchain đã lưu trong CSDL, tìm kiếm, lọc, xuất Excel
export default function GiaoDich({ dsGiaoDich, dangTai }) {
  const [loc, setLoc] = useState("tat-ca");
  const [tuKhoa, setTuKhoa] = useState("");

  const dsLoc = useMemo(
    () => dsGiaoDich.filter((g) =>
      (loc === "tat-ca" || g.loai === loc) &&
      khopTuKhoa(tuKhoa, g.hash, g.viGui, g.hoTen, g.tenMay, g.maDon && `#${g.maDon}`, g.ghiChu)),
    [dsGiaoDich, loc, tuKhoa]
  );
  const pt = usePhanTrang(dsLoc, 12);
  const tongTien = dsLoc.reduce((s, g) => s + Number(g.soTien), 0);

  if (dangTai && !dsGiaoDich.length) return <p className="mo">Đang tải...</p>;

  return (
    <section className="the-khung">
      <div className="qt__hang">
        <div>
          <h3>Nhật ký giao dịch ({dsLoc.length})</h3>
          <p className="mo nho tq__phu">Tổng số tiền các giao dịch đang hiện: {dinhDangEth(tongTien)}</p>
        </div>
        <NutXuat soDong={dsLoc.length} onClick={() => xuatCSV("giao-dich", COT_XUAT, dsLoc)} />
      </div>

      <div className="ct-loc">
        <ONhapTim giaTri={tuKhoa} doi={setTuKhoa} goiY="Tìm mã hash, ví, tên khách, máy, mã đơn..." />
      </div>
      <div className="hang-chip">
        {[["tat-ca", "Tất cả"], ...Object.entries(LOAI).map(([k, v]) => [k, v.ten])].map(([k, ten]) => (
          <button key={k} className={`chip ${loc === k ? "chip--chon" : ""}`} onClick={() => setLoc(k)}>
            {ten} ({k === "tat-ca" ? dsGiaoDich.length : dsGiaoDich.filter((g) => g.loai === k).length})
          </button>
        ))}
      </div>

      {dsLoc.length ? (
        <div className="cuon-ngang">
          <table className="bang qt__bang">
            <thead>
              <tr><th>Thời gian</th><th>Loại</th><th>Người thực hiện</th><th>Máy / Đơn</th><th>Số tiền</th><th>Mã hash</th></tr>
            </thead>
            <tbody>
              {pt.dsTrang.map((g) => (
                <tr key={g.id}>
                  <td className="nho">{thoiGian(g.thoiGian)}<br /><span className="mo">Khối #{g.soKhoi}</span></td>
                  <td><span className={`trang-thai ${LOAI[g.loai]?.lop || "xam"}`}>{LOAI[g.loai]?.ten || g.loai}</span></td>
                  <td>{g.hoTen || "—"}<div><code title={g.viGui}>{rutGon(g.viGui)}</code></div></td>
                  <td className="nho">
                    {g.tenMay || (g.maMay ? `Máy #${g.maMay}` : "—")}
                    {g.maDon && <div className="mo">Đơn #{g.maDon}</div>}
                    {g.ghiChu && <div className="mo">{g.ghiChu}</div>}
                  </td>
                  <td>{g.soTien > 0 ? dinhDangEth(g.soTien) : "—"}</td>
                  <td><MaGiaoDich hash={g.hash} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mo ct-trong">{dsGiaoDich.length ? "Không có giao dịch nào khớp với bộ lọc." : "Chưa có giao dịch nào."}</p>
      )}
      <PhanTrang {...pt} />
      <p className="mo nho">Mỗi giao dịch đã được máy chủ kiểm tra trên blockchain (thành công, gửi tới đúng hợp đồng) trước khi lưu. Bấm mã hash để xem trên Etherscan.</p>
    </section>
  );
}

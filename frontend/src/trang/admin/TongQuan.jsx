import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tinhThongKe } from "../../tienich/hopDongAdmin";
import { dinhDangEth, rutGon } from "../../tienich/dinhdang";
import BieuTuong from "../../thanhphan/BieuTuong";
import { BieuDoCot, BieuDoTron } from "./BieuDo";

const MOT_NGAY = 86400 * 1000;
const KHOANG = [
  { so: 7, ten: "7 ngày" },
  { so: 14, ten: "14 ngày" },
  { so: 30, ten: "30 ngày" },
];

// Đầu ngày (00:00) theo giờ máy
const dauNgay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Doanh thu (đơn đã trả, tính theo ngày trả) và số đơn mới (theo ngày thuê) của N ngày gần nhất
function theoNgay(dsDon, soNgay) {
  const homNay = dauNgay(Date.now());
  const ngay = Array.from({ length: soNgay }, (_, i) => {
    const moc = homNay - (soNgay - 1 - i) * MOT_NGAY;
    const d = new Date(moc);
    return { moc, nhan: `${d.getDate()}/${d.getMonth() + 1}`, doanhThu: 0, donMoi: 0 };
  });
  const viTri = (giay) => Math.round((dauNgay(giay * 1000) - ngay[0].moc) / MOT_NGAY);
  for (const d of dsDon) {
    const i = viTri(d.batDau);
    if (i >= 0 && i < soNgay) ngay[i].donMoi += 1;
    if (d.trangThai === 1 && d.ngayTra) {
      const j = viTri(d.ngayTra);
      if (j >= 0 && j < soNgay) ngay[j].doanhThu += Number(d.tienThue) + Number(d.phiTre) + Number(d.tienHuHong);
    }
  }
  return ngay;
}

// Trang "Tổng quan": số liệu, biểu đồ doanh thu theo ngày, đơn theo trạng thái, máy được thuê nhiều, đơn cần xử lý
export default function TongQuan({ dsMay, dsDon, soDuHopDong, dangTai }) {
  const [khoang, setKhoang] = useState(14);
  const tk = tinhThongKe(dsMay, dsDon);
  const ngay = useMemo(() => theoNgay(dsDon, khoang), [dsDon, khoang]);
  const tongKy = ngay.reduce((s, n) => s + n.doanhThu, 0);
  const donKy = ngay.reduce((s, n) => s + n.donMoi, 0);

  const canXuLy = dsDon.filter((d) => d.trangThai === 0).sort((a, b) => a.hanTra - b.hanTra).slice(0, 5);

  // Máy được thuê nhiều nhất (không tính đơn đã hủy)
  const topMay = useMemo(() => {
    const dem = {};
    for (const d of dsDon) {
      if (d.trangThai === 2) continue;
      const k = (dem[d.maMay] ??= { ten: d.tenMay || `Máy #${d.maMay}`, soDon: 0, doanhThu: 0 });
      k.soDon += 1;
      if (d.trangThai === 1) k.doanhThu += Number(d.tienThue) + Number(d.phiTre) + Number(d.tienHuHong);
    }
    return Object.values(dem).sort((a, b) => b.soDon - a.soDon).slice(0, 5);
  }, [dsDon]);
  const nhieuNhat = topMay[0]?.soDon || 1;

  if (dangTai && !dsMay.length) return <p className="mo">Đang tải dữ liệu...</p>;

  return (
    <>
      <div className="qt__so-lieu">
        <OSoLieu icon="mayAnh" mau="cam" nhan="Máy ảnh" so={tk.soMay}
          phu={`${tk.sanSang} sẵn sàng · ${tk.dangThueMay} đang thuê · ${tk.baoTri} bảo trì`} />
        <OSoLieu icon="danhSach" mau="xanh-duong" nhan="Đơn thuê" so={tk.soDon}
          phu={`${tk.donDangThue} đang thuê · ${tk.donDaTra} đã trả · ${tk.donDaHuy} đã hủy`} />
        <OSoLieu icon="hoanTien" mau="xanh" nhan="Doanh thu" so={dinhDangEth(tk.doanhThu)}
          phu="Tiền thuê + phí trễ + hư hỏng của đơn đã trả" />
        <OSoLieu icon="khien" mau="vang" nhan="Hợp đồng đang giữ" so={dinhDangEth(soDuHopDong)}
          phu={`Trong đó tiền cọc ${dinhDangEth(tk.cocDangGiu)}`} />
      </div>

      <div className="tq__luoi">
        <section className="the-khung">
          <div className="qt__hang">
            <div>
              <h3>Doanh thu theo ngày</h3>
              <p className="mo nho tq__phu">{dinhDangEth(tongKy)} · {donKy} đơn mới trong {khoang} ngày</p>
            </div>
            <div className="hang-chip">
              {KHOANG.map((k) => (
                <button key={k.so} className={`chip ${khoang === k.so ? "chip--chon" : ""}`} onClick={() => setKhoang(k.so)}>{k.ten}</button>
              ))}
            </div>
          </div>
          <BieuDoCot du={ngay.map((n) => ({ nhan: n.nhan, giaTri: n.doanhThu, phu: `${n.donMoi} đơn mới` }))} dinhDang={dinhDangEth} />
        </section>

        <section className="the-khung">
          <h3>Đơn theo trạng thái</h3>
          <BieuDoTron giua="đơn thuê" phan={[
            { ten: "Đang thuê (trong hạn)", giaTri: tk.donDangThue - tk.quaHan, mau: "#2f8f5b" },
            { ten: "Quá hạn", giaTri: tk.quaHan, mau: "#c98a12" },
            { ten: "Đã trả", giaTri: tk.donDaTra, mau: "#3b6fc4" },
            { ten: "Đã hủy", giaTri: tk.donDaHuy, mau: "#b8ad9c" },
          ]} />
        </section>
      </div>

      <div className="tq__luoi">
        <section className="the-khung">
          <div className="qt__hang">
            <h3>Đơn đang thuê {tk.quaHan > 0 && <span className="trang-thai vang">{tk.quaHan} quá hạn</span>}</h3>
            <Link to="/admin/don-thue" className="nut nut-phu nut-nho-vua">Xem tất cả</Link>
          </div>
          {canXuLy.length ? (
            <div className="cuon-ngang">
              <table className="bang">
                <thead>
                  <tr><th>Mã</th><th>Máy</th><th>Khách</th><th>Hạn trả</th><th>Tình trạng</th></tr>
                </thead>
                <tbody>
                  {canXuLy.map((d) => {
                    const tre = Date.now() / 1000 > d.hanTra;
                    return (
                      <tr key={d.maDon}>
                        <td>#{d.maDon}</td>
                        <td>{d.tenMay}<br /><span className="mo nho">{d.seri}</span></td>
                        <td>{d.hoTen || <code>{rutGon(d.nguoiThue)}</code>}</td>
                        <td className="nho">{new Date(d.hanTra * 1000).toLocaleString("vi-VN")}</td>
                        <td><span className={`trang-thai ${tre ? "vang" : "xanh"}`}>{tre ? "Quá hạn" : "Trong hạn"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mo">Hiện không có máy nào đang cho thuê.</p>
          )}
        </section>

        <section className="the-khung">
          <h3>Máy được thuê nhiều</h3>
          {topMay.length ? (
            <ul className="tq__top">
              {topMay.map((m, i) => (
                <li key={m.ten}>
                  <div className="tq__top-dong">
                    <span><b>{i + 1}.</b> {m.ten}</span>
                    <span className="mo nho">{m.soDon} đơn · {dinhDangEth(m.doanhThu)}</span>
                  </div>
                  <div className="tq__thanh"><span style={{ width: `${(m.soDon / nhieuNhat) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mo">Chưa có đơn thuê nào.</p>
          )}
        </section>
      </div>
    </>
  );
}

function OSoLieu({ icon, mau, nhan, so, phu }) {
  return (
    <div className="the-khung qt__o-so tq__o">
      <span className={`tq__icon tq__icon--${mau}`}><BieuTuong ten={icon} co={20} /></span>
      <span className="mo nho">{nhan}</span>
      <b>{so}</b>
      <span className="mo nho">{phu}</span>
    </div>
  );
}

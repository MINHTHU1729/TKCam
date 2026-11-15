import { Link } from "react-router-dom";
import { tinhThongKe } from "../../tienich/hopDongAdmin";
import { dinhDangEth, rutGon } from "../../tienich/dinhdang";

// Thẻ "Tổng quan": số liệu nhanh + các đơn cần xử lý
export default function TongQuan({ dsMay, dsDon, soDuHopDong, dangTai }) {
  const tk = tinhThongKe(dsMay, dsDon);
  const canXuLy = dsDon.filter((d) => d.trangThai === 0).sort((a, b) => a.hanTra - b.hanTra).slice(0, 5);

  if (dangTai && !dsMay.length) return <p className="mo">Đang đọc dữ liệu từ hợp đồng...</p>;

  return (
    <>
      <div className="qt__so-lieu">
        <OSoLieu nhan="Máy ảnh" so={tk.soMay} phu={`${tk.sanSang} sẵn sàng · ${tk.dangThueMay} đang thuê · ${tk.baoTri} bảo trì`} />
        <OSoLieu nhan="Đơn thuê" so={tk.soDon} phu={`${tk.donDangThue} đang thuê · ${tk.donDaTra} đã trả · ${tk.donDaHuy} đã hủy`} />
        <OSoLieu nhan="Doanh thu" so={dinhDangEth(tk.doanhThu)} phu="Tiền thuê + phí trễ + hư hỏng của đơn đã trả" />
        <OSoLieu nhan="Hợp đồng đang giữ" so={dinhDangEth(soDuHopDong)} phu={`Trong đó tiền cọc ${dinhDangEth(tk.cocDangGiu)}`} />
      </div>

      <section className="the-khung">
        <div className="qt__hang">
          <h3>Đơn đang thuê {tk.quaHan > 0 && <span className="trang-thai vang">{tk.quaHan} quá hạn</span>}</h3>
          <Link to="/admin/don-thue" className="nut nut-phu nut-nho-vua">Xem tất cả</Link>
        </div>
        {canXuLy.length ? (
          <div className="cuon-ngang">
            <table className="bang">
              <thead>
                <tr><th>Mã đơn</th><th>Máy</th><th>Khách</th><th>Hạn trả</th><th>Tình trạng</th></tr>
              </thead>
              <tbody>
                {canXuLy.map((d) => {
                  const tre = Date.now() / 1000 > d.hanTra;
                  return (
                    <tr key={d.maDon}>
                      <td>#{d.maDon}</td>
                      <td>{d.tenMay}<br /><span className="mo nho">{d.seri}</span></td>
                      <td><code>{rutGon(d.nguoiThue)}</code></td>
                      <td>{new Date(d.hanTra * 1000).toLocaleString("vi-VN")}</td>
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
    </>
  );
}

function OSoLieu({ nhan, so, phu }) {
  return (
    <div className="the-khung qt__o-so">
      <span className="mo nho">{nhan}</span>
      <b>{so}</b>
      <span className="mo nho">{phu}</span>
    </div>
  );
}

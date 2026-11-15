import { useEffect, useState } from "react";
import { goiAPI } from "../../tienich/api";
import { dinhDangEth, rutGon } from "../../tienich/dinhdang";

// Trang "Khách thuê": tài khoản khách trong MySQL + số liệu thuê lấy từ hợp đồng (ghép theo ví)
export default function KhachThue({ dsDon, dangTai }) {
  const [dsTaiKhoan, setDsTaiKhoan] = useState([]);
  const [loiTaiKhoan, setLoiTaiKhoan] = useState("");

  useEffect(() => {
    goiAPI("/quan-tri/khach-hang").then(setDsTaiKhoan).catch((e) => setLoiTaiKhoan(e.message));
  }, []);

  // Gom đơn thuê theo ví
  const theoVi = {};
  for (const d of dsDon) {
    const vi = d.nguoiThue.toLowerCase();
    const k = (theoVi[vi] ??= { soDon: 0, dangThue: 0, daTra: 0, daChi: 0, lanCuoi: 0 });
    k.soDon += 1;
    if (d.trangThai === 0) k.dangThue += 1;
    if (d.trangThai === 1) {
      k.daTra += 1;
      k.daChi += Number(d.tienThue) + Number(d.phiTre) + Number(d.tienHuHong);
    }
    k.lanCuoi = Math.max(k.lanCuoi, d.batDau);
  }

  // Mỗi dòng = 1 tài khoản; ví có đơn nhưng không khớp tài khoản nào thì vẫn hiện (khách vãng lai)
  const viCoTaiKhoan = new Set(dsTaiKhoan.map((t) => t.diaChiVi).filter(Boolean));
  const ds = [
    ...dsTaiKhoan.map((t) => ({ ...t, ...(theoVi[t.diaChiVi] || {}) })),
    ...Object.keys(theoVi).filter((vi) => !viCoTaiKhoan.has(vi)).map((vi) => ({ diaChiVi: vi, ...theoVi[vi] })),
  ];

  if (dangTai && !dsDon.length && !dsTaiKhoan.length) return <p className="mo">Đang tải...</p>;

  return (
    <section className="the-khung">
      <div className="qt__hang">
        <h3>Khách hàng ({ds.length})</h3>
      </div>
      {loiTaiKhoan && <p className="thong-bao thong-bao--loi">{loiTaiKhoan}</p>}
      {ds.length ? (
        <div className="cuon-ngang">
          <table className="bang qt__bang">
            <thead>
              <tr><th>Khách</th><th>Liên hệ</th><th>Ví</th><th>Số đơn</th><th>Đang thuê</th><th>Đã chi</th><th>Lần thuê gần nhất</th></tr>
            </thead>
            <tbody>
              {ds.map((k) => (
                <tr key={k.id || k.diaChiVi}>
                  <td>
                    <b>{k.hoTen || "Không có tài khoản"}</b>
                    {k.ngayTao && <div className="mo nho">Tạo {new Date(k.ngayTao.replace(" ", "T")).toLocaleDateString("vi-VN")}</div>}
                  </td>
                  <td className="nho">{k.email ? <>{k.email}<br />{k.soDienThoai}</> : "—"}</td>
                  <td>{k.diaChiVi ? <code title={k.diaChiVi}>{rutGon(k.diaChiVi)}</code> : <span className="mo nho">Chưa liên kết</span>}</td>
                  <td>{k.soDon || 0}</td>
                  <td>{k.dangThue ? <span className="trang-thai vang">{k.dangThue}</span> : "0"}</td>
                  <td>{dinhDangEth(k.daChi || 0)}</td>
                  <td>{k.lanCuoi ? new Date(k.lanCuoi * 1000).toLocaleString("vi-VN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mo">Chưa có khách hàng nào.</p>
      )}
      <p className="mo nho">
        Tài khoản lấy từ CSDL MySQL; số đơn và tiền lấy từ smart contract, ghép theo ví khách đã liên kết.
        Đã chi = tiền thuê + phí trễ + phí hư hỏng của các đơn đã trả.
      </p>
    </section>
  );
}

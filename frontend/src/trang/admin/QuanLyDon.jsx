import { useState } from "react";
import { uocTinhPhiTre, xacNhanTraMay } from "../../tienich/hopDongAdmin";
import { TRANG_THAI_DON } from "../../tienich/hopDongThue";
import { dinhDangEth, rutGon } from "../../tienich/dinhdang";
import MaGiaoDich from "../../thanhphan/MaGiaoDich";

const BO_LOC = [
  { ma: "dang-thue", ten: "Đang thuê", loc: (d) => d.trangThai === 0 },
  { ma: "da-tra", ten: "Đã trả", loc: (d) => d.trangThai === 1 },
  { ma: "da-huy", ten: "Đã hủy", loc: (d) => d.trangThai === 2 },
  { ma: "tat-ca", ten: "Tất cả", loc: () => true },
];

const ngayGio = (giay) => (giay ? new Date(giay * 1000).toLocaleString("vi-VN") : "—");

// Trang "Đơn thuê": xem đơn, xác nhận trả máy (kiểm tra seri, trừ phí hư hỏng, hoàn cọc)
export default function QuanLyDon({ dsDon, dangTai, taiLai }) {
  const [boLoc, setBoLoc] = useState("dang-thue");
  const [donDangTra, setDonDangTra] = useState(null);
  const [thongBao, setThongBao] = useState({ loai: "", noiDung: "" });

  const dsHien = dsDon.filter(BO_LOC.find((b) => b.ma === boLoc).loc);

  return (
    <>
      {thongBao.noiDung && <p className={`thong-bao thong-bao--${thongBao.loai}`}>{thongBao.noiDung}</p>}

      <section className="the-khung">
        <div className="qt__hang">
          <h3>Đơn thuê</h3>
          <div className="hang-chip">
            {BO_LOC.map((b) => (
              <button key={b.ma} className={`chip ${boLoc === b.ma ? "chip--chon" : ""}`} onClick={() => setBoLoc(b.ma)}>
                {b.ten} ({dsDon.filter(b.loc).length})
              </button>
            ))}
          </div>
        </div>

        {dangTai && !dsDon.length ? (
          <p className="mo">Đang tải...</p>
        ) : dsHien.length ? (
          <div className="cuon-ngang">
            <table className="bang qt__bang">
              <thead>
                <tr><th>Mã</th><th>Máy</th><th>Khách</th><th>Thời gian</th><th>Tiền</th><th>Trạng thái</th><th>Giao dịch</th><th></th></tr>
              </thead>
              <tbody>
                {dsHien.map((d) => {
                  const tre = d.trangThai === 0 && Date.now() / 1000 > d.hanTra;
                  return (
                    <tr key={d.maDon}>
                      <td>#{d.maDon}</td>
                      <td><b>{d.tenMay}</b><br /><span className="mo nho">{d.seri}</span></td>
                      <td>
                        {d.hoTen ? <b>{d.hoTen}</b> : <span className="mo nho">Chưa có tài khoản</span>}
                        <div><code title={d.nguoiThue}>{rutGon(d.nguoiThue)}</code></div>
                        {d.soDienThoai && <div className="mo nho">{d.soDienThoai}</div>}
                      </td>
                      <td className="nho">
                        Thuê: {ngayGio(d.batDau)}<br />
                        Hạn: {ngayGio(d.hanTra)} ({d.soNgay} ngày)
                        {d.ngayTra > 0 && <><br />Trả: {ngayGio(d.ngayTra)}</>}
                      </td>
                      <td className="nho">
                        Thuê {Number(d.tienThue)} · Cọc {Number(d.tienCoc)}
                        {d.trangThai === 1 && (
                          <><br />Trễ {Number(d.phiTre)} · Hư hỏng {Number(d.tienHuHong)}<br /><b>Hoàn {Number(d.tienHoan)} ETH</b></>
                        )}
                      </td>
                      <td>
                        <span className={`trang-thai ${tre ? "vang" : TRANG_THAI_DON[d.trangThai].lop}`}>
                          {tre ? "Quá hạn" : TRANG_THAI_DON[d.trangThai].ten}
                        </span>
                      </td>
                      <td className="nho">
                        <MaGiaoDich nhan="Thuê" hash={d.txThue} />
                        {d.txTra && <div><MaGiaoDich nhan="Trả" hash={d.txTra} /></div>}
                        {d.txHuy && <div><MaGiaoDich nhan="Hủy" hash={d.txHuy} /></div>}
                      </td>
                      <td>
                        {d.trangThai === 0 && (
                          <button className="nut nut-chinh nut-nho-vua" onClick={() => { setThongBao({}); setDonDangTra(d); }}>
                            Xác nhận trả
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mo">Không có đơn nào.</p>
        )}
      </section>

      {donDangTra && (
        <FormTraMay don={donDangTra} dong={() => setDonDangTra(null)}
          xong={async (noiDung) => {
            setDonDangTra(null);
            setThongBao({ loai: "tin", noiDung });
            await taiLai();
          }} />
      )}
    </>
  );
}

// Hộp xác nhận trả máy
function FormTraMay({ don, dong, xong }) {
  const [seri, setSeri] = useState("");
  const [huHong, setHuHong] = useState("");
  const [loi, setLoi] = useState("");
  const [ban, setBan] = useState(false);

  const { soNgayTre, phiTre } = uocTinhPhiTre(don);
  const conLai = Number(don.tienCoc) - phiTre;
  const truHuHong = Math.min(Number(huHong.replace(",", ".")) || 0, conLai);
  const hoan = Math.max(conLai - truHuHong, 0);

  const gui = async (e) => {
    e.preventDefault();
    setLoi("");
    if (seri.trim() !== don.seri) {
      setLoi("Số seri không khớp với máy của đơn này. Kiểm tra lại máy khách trả.");
      return;
    }
    setBan(true);
    try {
      const hash = await xacNhanTraMay(don.maDon, seri, huHong);
      await xong(`Đã xác nhận trả máy đơn #${don.maDon}. Tiền cọc đã được hoàn về ví khách (mã giao dịch ${hash.slice(0, 10)}…).`);
    } catch (err) {
      setLoi(err.message);
      setBan(false);
    }
  };

  return (
    <div className="qt__nen-hop" onClick={() => !ban && dong()}>
      <form className="the-khung qt__hop" onClick={(e) => e.stopPropagation()} onSubmit={gui}>
        <h3>Xác nhận trả máy · Đơn #{don.maDon}</h3>
        <p className="mo">{don.tenMay} · seri <code>{don.seri}</code> · khách <code>{rutGon(don.nguoiThue)}</code></p>

        <label className="nhan-o">
          Nhập số seri trên máy khách trả
          <input className="o-nhap" value={seri} onChange={(e) => { setSeri(e.target.value); setLoi(""); }} placeholder={don.seri} autoFocus />
        </label>
        <label className="nhan-o">
          Phí hư hỏng (ETH, để trống nếu máy nguyên vẹn)
          <input className="o-nhap" value={huHong} onChange={(e) => setHuHong(e.target.value)} placeholder="0" />
        </label>

        <dl className="chi-tiet">
          <div><dt>Tiền cọc</dt><dd>{dinhDangEth(don.tienCoc)}</dd></div>
          <div><dt>Phí trễ {soNgayTre > 0 ? `(${soNgayTre} ngày)` : ""}</dt><dd>− {dinhDangEth(phiTre)}</dd></div>
          <div><dt>Phí hư hỏng</dt><dd>− {dinhDangEth(truHuHong)}</dd></div>
          <div><dt><b>Hoàn cho khách (ước tính)</b></dt><dd><b>{dinhDangEth(hoan)}</b></dd></div>
        </dl>
        <p className="mo nho">Phí trễ do hợp đồng tự tính lúc xác nhận; phí hư hỏng không vượt quá số cọc còn lại.</p>

        {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}
        <div className="hang-nut">
          <button className="nut nut-chinh" type="submit" disabled={ban}>{ban ? "Đang chờ MetaMask..." : "Xác nhận trả & hoàn cọc"}</button>
          <button className="nut nut-chu" type="button" onClick={dong} disabled={ban}>Đóng</button>
        </div>
      </form>
    </div>
  );
}

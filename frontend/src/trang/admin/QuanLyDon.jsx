import { useMemo, useState } from "react";
import { uocTinhPhiTre, xacNhanTraMay } from "../../tienich/hopDongAdmin";
import { TRANG_THAI_DON } from "../../tienich/hopDongThue";
import { dinhDangEth, rutGon } from "../../tienich/dinhdang";
import { ngayGioXuat, xuatCSV } from "../../tienich/xuatFile";
import MaGiaoDich from "../../thanhphan/MaGiaoDich";
import { khopTuKhoa, NutXuat, ONhapTim, PhanTrang, usePhanTrang } from "./CongCu";

const quaHan = (d) => d.trangThai === 0 && Date.now() / 1000 > d.hanTra;
const BO_LOC = [
  { ma: "tat-ca", ten: "Tất cả", loc: () => true },
  { ma: "dang-thue", ten: "Đang thuê", loc: (d) => d.trangThai === 0 },
  { ma: "qua-han", ten: "Quá hạn", loc: quaHan },
  { ma: "da-tra", ten: "Đã trả", loc: (d) => d.trangThai === 1 },
  { ma: "da-huy", ten: "Đã hủy", loc: (d) => d.trangThai === 2 },
];

const ngayGio = (giay) => (giay ? new Date(giay * 1000).toLocaleString("vi-VN") : "—");
const tenTrangThai = (d) => (quaHan(d) ? "Quá hạn" : TRANG_THAI_DON[d.trangThai].ten);

// Cột của file Excel đơn thuê
const COT_XUAT = [
  { ten: "Mã đơn", lay: (d) => d.maDon },
  { ten: "Máy", lay: (d) => d.tenMay },
  { ten: "Số seri", lay: (d) => d.seri },
  { ten: "Khách", lay: (d) => d.hoTen || "" },
  { ten: "Email", lay: (d) => d.email || "" },
  { ten: "Số điện thoại", lay: (d) => d.soDienThoai || "" },
  { ten: "Ví khách", lay: (d) => d.nguoiThue },
  { ten: "Số ngày", lay: (d) => d.soNgay },
  { ten: "Bắt đầu", lay: (d) => ngayGioXuat(d.batDau) },
  { ten: "Hạn trả", lay: (d) => ngayGioXuat(d.hanTra) },
  { ten: "Ngày trả / hủy", lay: (d) => ngayGioXuat(d.ngayTra) },
  { ten: "Tiền thuê (ETH)", lay: (d) => d.tienThue },
  { ten: "Tiền cọc (ETH)", lay: (d) => d.tienCoc },
  { ten: "Phí trễ (ETH)", lay: (d) => d.phiTre },
  { ten: "Phí hư hỏng (ETH)", lay: (d) => d.tienHuHong },
  { ten: "Hoàn cho khách (ETH)", lay: (d) => d.tienHoan },
  { ten: "Trạng thái", lay: tenTrangThai },
  { ten: "Hash thuê", lay: (d) => d.txThue || "" },
  { ten: "Hash trả", lay: (d) => d.txTra || "" },
  { ten: "Hash hủy", lay: (d) => d.txHuy || "" },
];

// Trang "Đơn thuê": tìm kiếm, lọc theo trạng thái / ngày, xuất Excel, xem chi tiết, xác nhận trả máy
export default function QuanLyDon({ dsDon, dangTai, taiLai }) {
  const [boLoc, setBoLoc] = useState("dang-thue");
  const [tuKhoa, setTuKhoa] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [donDangTra, setDonDangTra] = useState(null);
  const [donXem, setDonXem] = useState(null);
  const [thongBao, setThongBao] = useState({ loai: "", noiDung: "" });

  const dsLoc = useMemo(() => {
    const loc = BO_LOC.find((b) => b.ma === boLoc).loc;
    const tu = tuNgay ? new Date(`${tuNgay}T00:00:00`).getTime() / 1000 : 0;
    const den = denNgay ? new Date(`${denNgay}T23:59:59`).getTime() / 1000 : Infinity;
    return dsDon.filter((d) =>
      loc(d) && d.batDau >= tu && d.batDau <= den &&
      khopTuKhoa(tuKhoa, `#${d.maDon}`, d.maDon, d.tenMay, d.seri, d.nguoiThue, d.hoTen, d.email, d.soDienThoai)
    );
  }, [dsDon, boLoc, tuKhoa, tuNgay, denNgay]);
  const pt = usePhanTrang(dsLoc, 10);
  const coLoc = tuKhoa || tuNgay || denNgay;

  return (
    <>
      {thongBao.noiDung && <p className={`thong-bao thong-bao--${thongBao.loai}`}>{thongBao.noiDung}</p>}

      <section className="the-khung">
        <div className="qt__hang">
          <h3>Đơn thuê ({dsLoc.length})</h3>
          <NutXuat soDong={dsLoc.length} onClick={() => xuatCSV("don-thue", COT_XUAT, dsLoc)} />
        </div>

        <div className="ct-loc">
          <ONhapTim giaTri={tuKhoa} doi={setTuKhoa} goiY="Tìm mã đơn, máy, seri, tên khách, SĐT, email, ví..." />
          <label className="ct-ngay"><span>Từ</span><input type="date" className="o-nhap" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} /></label>
          <label className="ct-ngay"><span>Đến</span><input type="date" className="o-nhap" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} /></label>
          {coLoc && (
            <button className="nut nut-chu nut-nho-vua" onClick={() => { setTuKhoa(""); setTuNgay(""); setDenNgay(""); }}>Xóa lọc</button>
          )}
        </div>
        <div className="hang-chip">
          {BO_LOC.map((b) => (
            <button key={b.ma} className={`chip ${boLoc === b.ma ? "chip--chon" : ""}`} onClick={() => setBoLoc(b.ma)}>
              {b.ten} ({dsDon.filter(b.loc).length})
            </button>
          ))}
        </div>

        {dangTai && !dsDon.length ? (
          <p className="mo">Đang tải...</p>
        ) : dsLoc.length ? (
          <div className="cuon-ngang">
            <table className="bang qt__bang">
              <thead>
                <tr><th>Mã</th><th>Máy</th><th>Khách</th><th>Thời gian</th><th>Tiền</th><th>Trạng thái</th><th></th></tr>
              </thead>
              <tbody>
                {pt.dsTrang.map((d) => {
                  const tre = quaHan(d);
                  return (
                    <tr key={d.maDon} className="ct-dong-bam" onClick={() => setDonXem(d)}>
                      <td><b>#{d.maDon}</b></td>
                      <td><b>{d.tenMay}</b><br /><span className="mo nho">{d.seri}</span></td>
                      <td>
                        {d.hoTen ? <b>{d.hoTen}</b> : <span className="mo nho">Chưa có tài khoản</span>}
                        <div><code title={d.nguoiThue}>{rutGon(d.nguoiThue)}</code></div>
                      </td>
                      <td className="nho">
                        {ngayGio(d.batDau)}<br />
                        <span className={tre ? "chu-loi" : "mo"}>Hạn {ngayGio(d.hanTra)} · {d.soNgay} ngày</span>
                      </td>
                      <td className="nho">
                        Thuê {Number(d.tienThue)} · Cọc {Number(d.tienCoc)}
                        {d.trangThai === 1 && <><br /><b>Hoàn {Number(d.tienHoan)} ETH</b></>}
                      </td>
                      <td>
                        <span className={`trang-thai ${tre ? "vang" : TRANG_THAI_DON[d.trangThai].lop}`}>{tenTrangThai(d)}</span>
                      </td>
                      <td className="qt__nut-dong" onClick={(e) => e.stopPropagation()}>
                        <button className="nut nut-phu nut-nho-vua" onClick={() => setDonXem(d)}>Chi tiết</button>
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
          <p className="mo ct-trong">Không có đơn nào khớp với bộ lọc.</p>
        )}
        <PhanTrang {...pt} />
      </section>

      {donXem && (
        <ChiTietDon don={donXem} dong={() => setDonXem(null)}
          traMay={() => { setDonXem(null); setThongBao({}); setDonDangTra(donXem); }} />
      )}

      {donDangTra && (
        <FormTraMay don={donDangTra} dong={() => setDonDangTra(null)}
          xong={async (noiDung) => {
            setDonDangTra(null);
            setThongBao({ loai: "thanh-cong", noiDung });
            await taiLai();
          }} />
      )}
    </>
  );
}

// Hộp xem đầy đủ thông tin 1 đơn
function ChiTietDon({ don, dong, traMay }) {
  const tre = quaHan(don);
  return (
    <div className="qt__nen-hop" onClick={dong}>
      <div className="the-khung qt__hop ct-hop-rong" onClick={(e) => e.stopPropagation()}>
        <div className="qt__hang">
          <h3>Đơn #{don.maDon}</h3>
          <span className={`trang-thai ${tre ? "vang" : TRANG_THAI_DON[don.trangThai].lop}`}>{tenTrangThai(don)}</span>
        </div>
        <div className="ct-hai-cot">
          <dl className="chi-tiet">
            <div><dt>Máy</dt><dd>{don.tenMay}</dd></div>
            <div><dt>Số seri</dt><dd><code>{don.seri}</code></dd></div>
            <div><dt>Khách</dt><dd>{don.hoTen || "Chưa có tài khoản"}</dd></div>
            <div><dt>Email</dt><dd>{don.email || "—"}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{don.soDienThoai || "—"}</dd></div>
            <div><dt>Ví khách</dt><dd><code title={don.nguoiThue}>{rutGon(don.nguoiThue)}</code></dd></div>
          </dl>
          <dl className="chi-tiet">
            <div><dt>Bắt đầu</dt><dd>{ngayGio(don.batDau)}</dd></div>
            <div><dt>Hạn trả ({don.soNgay} ngày)</dt><dd>{ngayGio(don.hanTra)}</dd></div>
            <div><dt>Ngày trả / hủy</dt><dd>{ngayGio(don.ngayTra)}</dd></div>
            <div><dt>Giá / ngày</dt><dd>{dinhDangEth(don.giaNgay)}</dd></div>
            <div><dt>Tiền thuê</dt><dd>{dinhDangEth(don.tienThue)}</dd></div>
            <div><dt>Tiền cọc</dt><dd>{dinhDangEth(don.tienCoc)}</dd></div>
          </dl>
        </div>
        {don.trangThai !== 0 && (
          <dl className="chi-tiet">
            <div><dt>Phí trễ</dt><dd>{dinhDangEth(don.phiTre)}</dd></div>
            <div><dt>Phí hư hỏng</dt><dd>{dinhDangEth(don.tienHuHong)}</dd></div>
            <div><dt><b>Đã hoàn cho khách</b></dt><dd><b>{dinhDangEth(don.tienHoan)}</b></dd></div>
          </dl>
        )}
        <div className="ct-hash">
          <MaGiaoDich nhan="Giao dịch thuê" hash={don.txThue} />
          {don.txTra && <MaGiaoDich nhan="Giao dịch trả" hash={don.txTra} />}
          {don.txHuy && <MaGiaoDich nhan="Giao dịch hủy" hash={don.txHuy} />}
        </div>
        <div className="hang-nut">
          {don.trangThai === 0 && <button className="nut nut-chinh" onClick={traMay}>Xác nhận trả máy</button>}
          <button className="nut nut-chu" onClick={dong}>Đóng</button>
        </div>
      </div>
    </div>
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

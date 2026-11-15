import { useState } from "react";
import { Link } from "react-router-dom";
import BieuTuong from "./BieuTuong";
import MaGiaoDich from "./MaGiaoDich";
import { useVi } from "../xuly/dungVi";
import { useTaiKhoan } from "../xuly/TaiKhoan";
import { useDonThue } from "../xuly/dungDonThue";
import { huyDon, loiTiengViet, TRANG_THAI_DON } from "../tienich/hopDongThue";
import { ghiNhanGiaoDich } from "../tienich/api";
import { dinhDangEth } from "../tienich/dinhdang";

const ngayGio = (giay) =>
  giay
    ? new Date(giay * 1000).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

// Thời gian còn lại đến hạn trả, hoặc đã trễ bao lâu
function conLai(hanTra) {
  const phut = Math.round((hanTra * 1000 - Date.now()) / 60000);
  const tri = Math.abs(phut);
  const chu = tri >= 1440 ? `${Math.floor(tri / 1440)} ngày ${Math.floor((tri % 1440) / 60)} giờ` : `${Math.floor(tri / 60)} giờ ${tri % 60} phút`;
  return phut >= 0 ? { chu: `Còn ${chu}`, tre: false } : { chu: `Trễ ${chu}`, tre: true };
}

// Danh sách đơn thuê của tài khoản (dữ liệu từ CSDL, kèm mã hash giao dịch trên blockchain)
export default function DanhSachDonThue() {
  const { daDangNhap, nguoiDung } = useTaiKhoan();
  const { diaChi, daKetNoi, ketNoi, saiMang, doiMang, lamMoi } = useVi();
  const { danhSach, dangTai, loi, taiLai } = useDonThue(daDangNhap);
  const [dangHuy, setDangHuy] = useState(null);
  const [loiHuy, setLoiHuy] = useState("");

  // Hủy đơn: cần ví đã liên kết để ký giao dịch cancelRental trên hợp đồng
  const huy = async (maDon) => {
    setLoiHuy("");
    if (!daKetNoi) return ketNoi();
    if (saiMang) return doiMang();
    if (nguoiDung.diaChiVi && diaChi.toLowerCase() !== nguoiDung.diaChiVi) {
      setLoiHuy("Hãy chọn đúng ví đã liên kết với tài khoản trong MetaMask để hủy đơn.");
      return;
    }
    setDangHuy(maDon);
    try {
      const hash = await huyDon(maDon);
      await ghiNhanGiaoDich(hash, "huy-don", { maDon }).catch((e) => setLoiHuy(`Đã hủy trên blockchain nhưng chưa lưu được: ${e.message}`));
      await taiLai();
      lamMoi();
    } catch (e) {
      setLoiHuy(loiTiengViet(e));
    } finally {
      setDangHuy(null);
    }
  };

  if (dangTai && !danhSach.length) return <div className="trong trong--nho"><p>Đang tải đơn thuê...</p></div>;
  if (loi) return <p className="thong-bao thong-bao--loi">{loi}</p>;
  if (!danhSach.length) {
    return (
      <div className="trong trong--nho">
        <BieuTuong ten="mayAnh" co={32} />
        <p>Bạn chưa có đơn thuê nào.</p>
        <Link to="/may-anh" className="nut nut-chinh">Thuê máy ngay</Link>
      </div>
    );
  }

  return (
    <div className="ds-don">
      {loiHuy && <p className="thong-bao thong-bao--loi">{loiHuy}</p>}
      {danhSach.map((d) => {
        const tt = TRANG_THAI_DON[d.trangThai];
        const dangThue = d.trangThai === 0;
        const thoiGian = dangThue ? conLai(d.hanTra) : null;
        const conHuyDuoc = dangThue && Date.now() - d.batDau * 1000 < 60 * 60 * 1000;

        return (
          <article key={d.maDon} className="don">
            <div className="don__dau">
              <div>
                <span className="mo nho">Đơn #{d.maDon}</span>
                <h4><Link to={`/may-anh/${d.maMay}`}>{d.tenMay}</Link></h4>
                <code className="mo">{d.seri}</code>
              </div>
              <span className={`trang-thai ${tt.lop}`}>{tt.ten}</span>
            </div>

            <div className="don__luoi">
              <div><span>Thuê lúc</span><b>{ngayGio(d.batDau)}</b></div>
              <div><span>Hạn trả</span><b>{ngayGio(d.hanTra)}</b></div>
              <div><span>Tiền thuê ({d.soNgay} ngày)</span><b>{dinhDangEth(d.tienThue)}</b></div>
              <div><span>Tiền cọc</span><b>{dinhDangEth(d.tienCoc)}</b></div>
            </div>

            <div className="don__hash">
              <MaGiaoDich nhan="Giao dịch thuê:" hash={d.txThue} />
              {d.txTra && <MaGiaoDich nhan="Giao dịch trả máy:" hash={d.txTra} />}
              {d.txHuy && <MaGiaoDich nhan="Giao dịch hủy:" hash={d.txHuy} />}
            </div>

            {dangThue ? (
              <div className="don__chan">
                <span className={`don__dem ${thoiGian.tre ? "don__dem--tre" : ""}`}>
                  <BieuTuong ten="dongHo" co={16} /> {thoiGian.chu}
                </span>
                <span className="mo nho"><BieuTuong ten="khoa" co={14} /> Tiền cọc đang được hợp đồng giữ</span>
                {conHuyDuoc && (
                  <button className="nut nut-vien" disabled={dangHuy === d.maDon} onClick={() => huy(d.maDon)}>
                    {dangHuy === d.maDon ? "Đang hủy..." : "Hủy đơn (hoàn 100%)"}
                  </button>
                )}
              </div>
            ) : (
              <div className="don__chan">
                <span className="mo nho">{d.trangThai === 2 ? "Hủy lúc" : "Trả lúc"} {ngayGio(d.ngayTra)}</span>
                {d.phiTre > 0 && <span className="mo nho">Phí trễ: {dinhDangEth(d.phiTre)}</span>}
                {d.tienHuHong > 0 && <span className="mo nho">Hư hỏng: {dinhDangEth(d.tienHuHong)}</span>}
                <span className="don__hoan">+{dinhDangEth(d.tienHoan)} đã hoàn về ví</span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

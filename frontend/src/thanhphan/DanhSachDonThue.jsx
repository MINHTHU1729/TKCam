import { useState } from "react";
import { Link } from "react-router-dom";
import BieuTuong from "./BieuTuong";
import { useVi } from "../xuly/dungVi";
import { useDonThue } from "../xuly/dungDonThue";
import { daCoHopDong, huyDon, loiTiengViet, TRANG_THAI_DON } from "../tienich/hopDongThue";
import { dinhDangEth } from "../tienich/dinhdang";

const ngayGio = (d) =>
  d ? d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// Thời gian còn lại đến hạn trả, hoặc đã trễ bao lâu
function conLai(hanTra) {
  const phut = Math.round((hanTra - Date.now()) / 60000);
  const tri = Math.abs(phut);
  const chu = tri >= 1440 ? `${Math.floor(tri / 1440)} ngày ${Math.floor((tri % 1440) / 60)} giờ` : `${Math.floor(tri / 60)} giờ ${tri % 60} phút`;
  return phut >= 0 ? { chu: `Còn ${chu}`, tre: false } : { chu: `Trễ ${chu}`, tre: true };
}

export default function DanhSachDonThue() {
  const { diaChi, daKetNoi, ketNoi, saiMang, doiMang, lamMoi } = useVi();
  const { danhSach, dangTai, loi, taiLai } = useDonThue(saiMang ? "" : diaChi);
  const [dangHuy, setDangHuy] = useState(null);
  const [loiHuy, setLoiHuy] = useState("");

  const huy = async (maDon) => {
    setLoiHuy("");
    setDangHuy(maDon);
    try {
      await huyDon(maDon);
      await taiLai();
      lamMoi();
    } catch (e) {
      setLoiHuy(loiTiengViet(e));
    } finally {
      setDangHuy(null);
    }
  };

  if (!daCoHopDong()) {
    return <div className="trong trong--nho"><p>Hệ thống đơn thuê đang bảo trì, vui lòng quay lại sau.</p></div>;
  }
  if (!daKetNoi) {
    return (
      <div className="trong trong--nho">
        <BieuTuong ten="vi" co={32} />
        <p>Kết nối ví thanh toán để xem các đơn thuê của bạn.</p>
        <button className="nut nut-chinh" onClick={ketNoi}>Kết nối ví</button>
      </div>
    );
  }
  if (saiMang) {
    return (
      <div className="trong trong--nho">
        <p>Ví đang ở sai mạng thanh toán.</p>
        <button className="nut nut-canh-bao" onClick={doiMang}>Chuyển mạng</button>
      </div>
    );
  }
  if (dangTai) return <div className="trong trong--nho"><p>Đang tải đơn thuê...</p></div>;
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
        const conHuyDuoc = dangThue && Date.now() - d.batDau.getTime() < 60 * 60 * 1000;

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

            {dangThue ? (
              <div className="don__chan">
                <span className={`don__dem ${thoiGian.tre ? "don__dem--tre" : ""}`}>
                  <BieuTuong ten="dongHo" co={16} /> {thoiGian.chu}
                </span>
                <span className="mo nho"><BieuTuong ten="khoa" co={14} /> Tiền cọc đang được giữ</span>
                {conHuyDuoc && (
                  <button className="nut nut-vien" disabled={dangHuy === d.maDon} onClick={() => huy(d.maDon)}>
                    {dangHuy === d.maDon ? "Đang hủy..." : "Hủy đơn (hoàn 100%)"}
                  </button>
                )}
              </div>
            ) : (
              <div className="don__chan">
                <span className="mo nho">{d.trangThai === 2 ? "Hủy lúc" : "Trả lúc"} {ngayGio(d.ngayTra)}</span>
                {Number(d.phiTre) > 0 && <span className="mo nho">Phí trễ: {dinhDangEth(d.phiTre)}</span>}
                {Number(d.tienHuHong) > 0 && <span className="mo nho">Hư hỏng: {dinhDangEth(d.tienHuHong)}</span>}
                <span className="don__hoan">+{dinhDangEth(d.tienHoan)} đã hoàn về ví</span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

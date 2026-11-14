import { useVi } from "../xuly/dungVi";
import { TEN_MANG } from "../tienich/cauhinh";
import { rutGon } from "../tienich/dinhdang";
import BieuTuong from "./BieuTuong";

// Khung ví thanh toán (trang tài khoản)
export default function ThongTinVi() {
  const { diaChi, soDu, maMang, loi, dangTai, daKetNoi, saiMang, ketNoi, doiMang, lamMoi } = useVi();

  const saoChep = () => navigator.clipboard?.writeText(diaChi);
  const lopTrangThai = !daKetNoi || maMang === null ? "xam" : saiMang ? "vang" : "xanh";
  const chuTrangThai = !daKetNoi ? "Chưa liên kết" : maMang === null ? "Đang kiểm tra" : saiMang ? "Sai mạng" : "Đã liên kết";

  return (
    <section className="the-vi">
      <div className="the-vi__dau">
        <span className="the-vi__nhan"><BieuTuong ten="vi" co={18} /> Ví thanh toán</span>
        <span className={`trang-thai ${lopTrangThai}`}>{chuTrangThai}</span>
      </div>

      {!daKetNoi ? (
        <div className="the-vi__trong">
          <span className="the-vi__icon-lon"><BieuTuong ten="vi" co={30} /></span>
          <p>Liên kết ví để thanh toán tiền thuê và nhận lại tiền cọc khi trả máy.</p>
          <button className="nut nut-chinh nut-day" onClick={ketNoi} disabled={dangTai}>
            {dangTai ? "Đang kết nối..." : "Liên kết ví"}
          </button>
        </div>
      ) : (
        <>
          <span className="mo nho">Số dư khả dụng</span>
          <div className="so-du">
            <span className="so-du__so">{soDu ? Number(soDu).toFixed(4) : "—"}</span>
            <span className="so-du__don-vi">ETH</span>
          </div>

          <dl className="chi-tiet">
            <div>
              <dt>Mã ví</dt>
              <dd>
                <code title={diaChi}>{rutGon(diaChi)}</code>
                <button className="nut-nho" onClick={saoChep} title="Sao chép">⧉</button>
              </dd>
            </div>
          </dl>

          {saiMang ? (
            <button className="nut nut-canh-bao nut-day" onClick={doiMang}>Chuyển sang mạng {TEN_MANG}</button>
          ) : (
            <button className="nut nut-phu nut-day" onClick={lamMoi}>↻ Cập nhật số dư</button>
          )}
        </>
      )}

      {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}
    </section>
  );
}

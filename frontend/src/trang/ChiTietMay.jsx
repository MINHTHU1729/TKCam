import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import HinhMayAnh from "../thanhphan/HinhMayAnh";
import BieuTuong from "../thanhphan/BieuTuong";
import TheMayAnh from "../thanhphan/TheMayAnh";
import { useDanhSachMay } from "../xuly/dungMayAnh";
import { useTaiKhoan } from "../xuly/TaiKhoan";
import { useVi } from "../xuly/dungVi";
import { dinhDangEth, TRANG_THAI } from "../tienich/dinhdang";
import { daCoHopDong, layMayTrenChuoi, loiTiengViet, thueMay } from "../tienich/hopDongThue";

export default function ChiTietMay() {
  const { id } = useParams();
  const { danhSach, dangTai } = useDanhSachMay();
  const { daDangNhap, nguoiDung, lienKetVi } = useTaiKhoan();
  const { diaChi, daKetNoi, ketNoi, saiMang, doiMang, lamMoi } = useVi();
  const dieuHuong = useNavigate();
  const [thamSo] = useSearchParams();
  const [soNgay, setSoNgay] = useState(() => Math.min(30, Math.max(1, Number(thamSo.get("ngay")) || 1)));
  const [dangThue, setDangThue] = useState(false);
  const [loi, setLoi] = useState("");
  const [ketQua, setKetQua] = useState(null); // { maDon, maGiaoDich }
  const [trangThaiChuoi, setTrangThaiChuoi] = useState(null); // trạng thái thật trên hợp đồng

  // Đọc trạng thái thật của máy trên hợp đồng (nếu đã kết nối ví đúng mạng)
  useEffect(() => {
    if (!daCoHopDong()) return;
    layMayTrenChuoi(Number(id))
      .then((m) => setTrangThaiChuoi(m.trangThai))
      .catch(() => setTrangThaiChuoi(null));
  }, [id, daKetNoi, saiMang, ketQua]);

  if (dangTai) return <div className="khung khoi"><div className="trong">Đang tải...</div></div>;

  const may = danhSach.find((m) => m.id === Number(id));
  if (!may) {
    return (
      <div className="khung khoi">
        <div className="trong">
          <p>Không tìm thấy máy ảnh này.</p>
          <Link to="/may-anh" className="nut nut-vien">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  // Ưu tiên trạng thái trên hợp đồng, nếu chưa đọc được thì dùng dữ liệu mẫu
  const trangThai = trangThaiChuoi || may.trangThai;
  const tt = TRANG_THAI[trangThai];
  const sanSang = trangThai === "san-sang";
  const tienThue = may.giaNgay * soNgay;
  const tong = tienThue + may.coc;
  const mayKhac = danhSach.filter((m) => m.id !== may.id && m.trangThai === "san-sang").slice(0, 3);

  // Nút thuê: kiểm tra đăng nhập, ví, mạng rồi gọi hàm rent() trên hợp đồng
  const thue = async () => {
    setLoi("");
    if (!daDangNhap) {
      dieuHuong(`/dang-nhap?tiep=${encodeURIComponent(`/may-anh/${may.id}`)}`);
      return;
    }
    if (!daKetNoi) return ketNoi();
    if (saiMang) return doiMang();
    if (!daCoHopDong()) {
      setLoi("Hệ thống thanh toán đang bảo trì, vui lòng thử lại sau.");
      return;
    }
    // Kiểm tra ví đang kết nối có đúng ví của tài khoản không
    const viCuaTaiKhoan = nguoiDung.diaChiVi;
    if (viCuaTaiKhoan && viCuaTaiKhoan !== diaChi.toLowerCase()) {
      setLoi(`Tài khoản này đã liên kết với ví ${viCuaTaiKhoan.slice(0, 6)}...${viCuaTaiKhoan.slice(-4)}. Hãy chọn đúng ví đó để thanh toán.`);
      return;
    }
    // Lần đầu thuê: liên kết ví đang dùng vào tài khoản (lưu trong MySQL)
    if (!viCuaTaiKhoan) {
      try {
        await lienKetVi(diaChi);
      } catch (e) {
        setLoi(e.message);
        return;
      }
    }
    setDangThue(true);
    try {
      setKetQua(await thueMay(may.id, soNgay));
      lamMoi(); // cập nhật số dư ví
    } catch (e) {
      setLoi(loiTiengViet(e));
    } finally {
      setDangThue(false);
    }
  };

  const chuNut = !sanSang
    ? "Máy chưa sẵn sàng"
    : !daDangNhap
    ? "Đăng nhập để đặt thuê"
    : !daKetNoi
    ? "Kết nối ví để thanh toán"
    : saiMang
    ? "Chuyển mạng thanh toán"
    : dangThue
    ? "Đang chờ xác nhận thanh toán..."
    : "Đặt thuê ngay";

  return (
    <div className="khung khoi">
      <nav className="duong-dan">
        <Link to="/">Trang chủ</Link> / <Link to="/may-anh">Máy ảnh</Link> / <span>{may.ten}</span>
      </nav>

      <div className="chi-tiet-may">
        <div className="chi-tiet-may__anh">
          <HinhMayAnh mau={may.mau} lon />
          <div className="chi-tiet-may__cam-ket">
            <span><BieuTuong ten="khien" co={18} /> Máy kiểm tra trước khi giao</span>
            <span><BieuTuong ten="hoanTien" co={18} /> Hoàn cọc ngay khi trả máy</span>
          </div>
        </div>

        <div>
          <div className="hang-giua">
            <span className="the-may__hang">{may.hang}</span>
            <span className={`trang-thai ${tt.lop}`}>{tt.ten}</span>
          </div>
          <h1 className="tieu-de-trang">{may.ten}</h1>
          <p className="mo-ta">{may.moTa}</p>
          <div className="the-may__the">{may.phuHop?.map((p) => <span key={p}>{p}</span>)}</div>

          <div className="the-dat">
            <div className="the-dat__gia">
              <b>{dinhDangEth(may.giaNgay)}</b><span> / ngày</span>
            </div>

            <div className="the-dat__dong">
              <span>Số ngày thuê</span>
              <div className="bo-dem">
                <button onClick={() => setSoNgay(Math.max(1, soNgay - 1))} aria-label="Bớt một ngày">−</button>
                <span>{soNgay}</span>
                <button onClick={() => setSoNgay(Math.min(30, soNgay + 1))} aria-label="Thêm một ngày">+</button>
              </div>
            </div>

            <div className="dong-tien"><span>Tiền thuê × {soNgay} ngày</span><b>{dinhDangEth(tienThue)}</b></div>
            <div className="dong-tien"><span>Tiền cọc (hoàn lại khi trả)</span><b>{dinhDangEth(may.coc)}</b></div>
            <div className="dong-tien dong-tien--tong"><span>Tổng thanh toán</span><b>{dinhDangEth(tong)}</b></div>

            {ketQua ? (
              <div className="thue-thanh-cong">
                <span className="thue-thanh-cong__icon"><BieuTuong ten="dauTick" co={22} /></span>
                <div>
                  <b>Thuê thành công! Mã đơn #{ketQua.maDon}</b>
                  <p>Tiền cọc {dinhDangEth(may.coc)} được giữ an toàn và hoàn về ví ngay khi bạn trả máy.</p>
                  <code title={ketQua.maGiaoDich}>Mã thanh toán: {ketQua.maGiaoDich.slice(0, 10)}...{ketQua.maGiaoDich.slice(-6)}</code>
                </div>
                <Link to="/tai-khoan#don-thue" className="nut nut-toi nut-day">Xem đơn thuê của tôi</Link>
              </div>
            ) : (
              <button className="nut nut-chinh nut-day nut-lon" disabled={!sanSang || dangThue} onClick={thue}>
                {dangThue && <span className="vong-xoay" />}
                {chuNut}
              </button>
            )}
            {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}
            <p className="ghi-chu">Hủy miễn phí trong 1 giờ · Trả trễ tính {dinhDangEth(may.giaNgay)} / ngày</p>
          </div>

          <h3 className="tieu-de-nho">Thông số</h3>
          <dl className="chi-tiet">
            <div><dt>Số seri</dt><dd><code>{may.seri}</code></dd></div>
            {Object.entries(may.thongSo).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <Link to={`/tra-cuu?seri=${may.seri}`} className="lien-ket">
            Xem lịch sử thuê của máy này <BieuTuong ten="muiTen" co={14} />
          </Link>
        </div>
      </div>

      {mayKhac.length > 0 && (
        <section className="khoi-con">
          <h2>Máy khác đang sẵn sàng</h2>
          <div className="luoi-may">{mayKhac.map((m) => <TheMayAnh key={m.id} may={m} />)}</div>
        </section>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TheMayAnh from "../thanhphan/TheMayAnh";
import HinhMayAnh from "../thanhphan/HinhMayAnh";
import BieuTuong from "../thanhphan/BieuTuong";
import { useDanhSachMay } from "../xuly/dungMayAnh";
import { dinhDangEth, TRANG_THAI } from "../tienich/dinhdang";

const NHU_CAU = [
  { ten: "Du lịch", mota: "Gọn nhẹ, zoom xa, pin bền cho chuyến đi dài.", mau: "#c9c3b8", nen: "#efe7da" },
  { ten: "Vlog", mota: "Màn hình lật, cảm biến lớn, quay video đẹp.", mau: "#1f1f22", nen: "#e6e1f0" },
  { ten: "Đi biển", mota: "Chống nước, chống sốc, yên tâm xuống nước.", mau: "#3b8fc4", nen: "#dcebf3" },
  { ten: "Người mới", mota: "Dễ dùng, giá thuê thấp, chụp là đẹp.", mau: "#b8323a", nen: "#f6e0dc" },
];

const QUY_TRINH = [
  { icon: "kinhLup", ten: "Chọn máy & ngày", mota: "Xem máy, thông số và giá thuê. Chọn số ngày bạn cần." },
  { icon: "vi", ten: "Đặt thuê online", mota: "Thanh toán tiền thuê và tiền cọc ngay trên web, xác nhận tức thì." },
  { icon: "mayAnh", ten: "Nhận máy & đi chụp", mota: "Nhận máy tại cửa hàng, kiểm tra số seri và bắt đầu chuyến đi." },
  { icon: "hoanTien", ten: "Trả máy, nhận lại cọc", mota: "Trả máy đúng hạn, tiền cọc được hoàn về ví của bạn ngay." },
];

const LY_DO = [
  { icon: "khien", ten: "Máy kiểm tra kỹ", mota: "Mỗi máy được vệ sinh, sạc đầy và kiểm tra trước mỗi lượt thuê." },
  { icon: "hoanTien", ten: "Hoàn cọc tức thì", mota: "Không phải chờ cửa hàng chuyển khoản, cọc về ví ngay khi trả máy." },
  { icon: "vi", ten: "Giá rõ ràng", mota: "Giá thuê, tiền cọc và phí trả trễ hiển thị đầy đủ trước khi đặt." },
  { icon: "maVach", ten: "Mỗi máy một số seri", mota: "Tra cứu lịch sử từng máy, nhận đúng máy, trả đúng máy." },
  { icon: "dongHo", ten: "Thuê linh hoạt", mota: "Thuê từ 1 đến 30 ngày, hủy miễn phí trong 1 giờ sau khi đặt." },
  { icon: "nguoi", ten: "Hướng dẫn tận tình", mota: "Chưa dùng máy bao giờ? Nhân viên hướng dẫn cách chụp khi nhận máy." },
];

const CAU_HOI = [
  ["Tôi cần chuẩn bị gì để thuê máy?", "Bạn tạo tài khoản TKCam và liên kết ví thanh toán. Khi đặt thuê, bạn thanh toán tiền thuê cùng tiền cọc ngay trên web."],
  ["Khi nào tôi nhận lại tiền cọc?", "Ngay khi bạn trả máy và cửa hàng xác nhận đúng số seri, máy không hư hỏng, tiền cọc được hoàn về ví của bạn."],
  ["Trả máy trễ thì sao?", "Mỗi ngày trễ tính thêm bằng giá thuê một ngày, trừ vào tiền cọc. Phần còn lại vẫn được hoàn về ví."],
  ["Máy bị trầy, hư hỏng thì xử lý thế nào?", "Cửa hàng kiểm tra và khấu trừ chi phí sửa chữa vào tiền cọc, không vượt quá số cọc đã đặt."],
  ["Tôi có thể hủy đơn không?", "Có. Hủy trong vòng 1 giờ sau khi đặt được hoàn 100% tiền thuê và tiền cọc."],
  ["Thuê nhiều ngày có rẻ hơn không?", "Giá được tính theo ngày. Bạn chọn số ngày trên trang máy ảnh để xem ngay tổng tiền."],
];

// Ngày hôm nay dạng yyyy-mm-dd cho ô chọn ngày
const ngayISO = (cong = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + cong);
  return d.toISOString().slice(0, 10);
};

export default function TrangChu() {
  const { danhSach, dangTai } = useDanhSachMay();
  const dieuHuong = useNavigate();
  const [timKiem, setTimKiem] = useState({ nhuCau: "", nhan: ngayISO(1), tra: ngayISO(3) });

  const sanSang = danhSach.filter((m) => m.trangThai === "san-sang");
  const mayNoiBat = sanSang.slice(0, 3);
  const giaThapNhat = danhSach.length ? Math.min(...danhSach.map((m) => m.giaNgay)) : 0;
  const soNgay = Math.max(1, Math.round((new Date(timKiem.tra) - new Date(timKiem.nhan)) / 86400000));

  const tim = (e) => {
    e.preventDefault();
    const thamSo = new URLSearchParams({ ngay: String(Math.min(30, soNgay)) });
    if (timKiem.nhuCau) thamSo.set("nhu-cau", timKiem.nhuCau);
    dieuHuong(`/may-anh?${thamSo}`);
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="khung hero__luoi">
          <div className="hero__chu">
            <span className="nhan-nho">Cho thuê máy ảnh compact</span>
            <h1>
              Thuê digicam,<br />
              <em>chụp đẹp</em> mọi chuyến đi.
            </h1>
            <p className="hero__mo-ta">
              Canon, Sony, Fujifilm, Ricoh... sẵn sàng cho chuyến du lịch, buổi hẹn hay ngày kỷ niệm.
              Đặt online trong một phút, trả máy là nhận lại tiền cọc ngay.
            </p>

            <form className="o-dat" onSubmit={tim}>
              <label>
                <span>Nhu cầu</span>
                <select value={timKiem.nhuCau} onChange={(e) => setTimKiem({ ...timKiem, nhuCau: e.target.value })}>
                  <option value="">Tất cả máy</option>
                  {NHU_CAU.map((n) => <option key={n.ten} value={n.ten}>{n.ten}</option>)}
                </select>
              </label>
              <label>
                <span>Ngày nhận</span>
                <input type="date" min={ngayISO()} value={timKiem.nhan}
                  onChange={(e) => setTimKiem({ ...timKiem, nhan: e.target.value, tra: e.target.value > timKiem.tra ? e.target.value : timKiem.tra })} />
              </label>
              <label>
                <span>Ngày trả</span>
                <input type="date" min={timKiem.nhan} value={timKiem.tra}
                  onChange={(e) => setTimKiem({ ...timKiem, tra: e.target.value })} />
              </label>
              <button className="nut nut-chinh nut-lon" type="submit">
                <BieuTuong ten="kinhLup" co={18} /> Tìm máy
              </button>
            </form>

            <ul className="hero__cam-ket">
              <li><BieuTuong ten="dauTick" co={16} /> Thuê từ 1 ngày</li>
              <li><BieuTuong ten="dauTick" co={16} /> Hủy miễn phí trong 1 giờ</li>
              <li><BieuTuong ten="dauTick" co={16} /> Hoàn cọc ngay khi trả</li>
            </ul>
          </div>

          <div className="hero__ghep">
            <div className="o-ghep o-ghep--lon" style={{ background: "#e6ddcd" }}>
              <HinhMayAnh mau="#1f1f22" nen={false} />
              <span className="o-ghep__nhan">Canon G7 X Mark II</span>
            </div>
            <div className="o-ghep" style={{ background: "#dcebf3" }}>
              <HinhMayAnh mau="#3b8fc4" nen={false} />
              <span className="o-ghep__nhan">Fujifilm XP140</span>
            </div>
            <div className="o-ghep" style={{ background: "#f6e0dc" }}>
              <HinhMayAnh mau="#b8323a" nen={false} />
              <span className="o-ghep__nhan">Nikon A10</span>
            </div>
            <div className="the-noi">
              <span className="the-noi__icon xanh"><BieuTuong ten="hoanTien" co={18} /></span>
              <div>
                <small>Vừa trả máy đúng hạn</small>
                <b>Đã hoàn cọc về ví</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== THƯƠNG HIỆU ===== */}
      <section className="khung thuong-hieu">
        <span className="mo">Máy chính hãng từ</span>
        <div>
          {["Canon", "Sony", "Fujifilm", "Ricoh", "Nikon"].map((h) => (
            <Link key={h} to={`/may-anh?hang=${h}`}>{h}</Link>
          ))}
        </div>
      </section>

      {/* ===== MÁY NỔI BẬT ===== */}
      <section className="khung khoi">
        <div className="khoi__dau">
          <div>
            <span className="nhan-nho">Đang sẵn sàng</span>
            <h2>Máy được thuê nhiều</h2>
          </div>
          <Link to="/may-anh" className="lien-ket">Xem tất cả máy <BieuTuong ten="muiTen" co={16} /></Link>
        </div>
        <div className="luoi-may">
          {dangTai
            ? [1, 2, 3].map((i) => <div key={i} className="the-may the-may--cho" />)
            : mayNoiBat.map((may) => <TheMayAnh key={may.id} may={may} />)}
        </div>
      </section>

      {/* ===== THEO NHU CẦU ===== */}
      <section className="khung khoi">
        <span className="nhan-nho">Thuê theo nhu cầu</span>
        <h2>Bạn định chụp gì?</h2>
        <div className="luoi-nhu-cau">
          {NHU_CAU.map((n) => (
            <Link key={n.ten} to={`/may-anh?nhu-cau=${encodeURIComponent(n.ten)}`} className="the-nhu-cau" style={{ background: n.nen }}>
              <div className="the-nhu-cau__anh"><HinhMayAnh mau={n.mau} nen={false} /></div>
              <h3>{n.ten}</h3>
              <p>{n.mota}</p>
              <span className="lien-ket">Xem máy phù hợp <BieuTuong ten="muiTen" co={14} /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== QUY TRÌNH ===== */}
      <section id="quy-trinh" className="khoi-toi">
        <div className="khung khoi">
          <span className="nhan-nho">Cách thuê</span>
          <h2>Thuê máy trong 4 bước</h2>
          <div className="luoi-buoc">
            {QUY_TRINH.map((b, i) => (
              <article key={b.ten} className="buoc">
                <div className="buoc__dau">
                  <span className="buoc__icon"><BieuTuong ten={b.icon} co={22} /></span>
                  <span className="buoc__so">0{i + 1}</span>
                </div>
                <h3>{b.ten}</h3>
                <p>{b.mota}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BẢNG GIÁ ===== */}
      <section id="bang-gia" className="khung khoi">
        <div className="khoi__dau">
          <div>
            <span className="nhan-nho">Bảng giá</span>
            <h2>Giá thuê từ {dinhDangEth(giaThapNhat)} / ngày</h2>
          </div>
          <Link to="/may-anh" className="lien-ket">Đặt thuê <BieuTuong ten="muiTen" co={16} /></Link>
        </div>
        <div className="bang-gia cuon-ngang">
          <table>
            <thead>
              <tr><th>Máy ảnh</th><th>1 ngày</th><th>3 ngày</th><th>7 ngày</th><th>Tiền cọc</th><th>Tình trạng</th><th /></tr>
            </thead>
            <tbody>
              {danhSach.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="bang-gia__may">
                      <span className="bang-gia__hinh"><HinhMayAnh mau={m.mau} nen={false} /></span>
                      <div><b>{m.ten}</b><small>{m.hang}</small></div>
                    </div>
                  </td>
                  <td><b>{dinhDangEth(m.giaNgay)}</b></td>
                  <td>{dinhDangEth(m.giaNgay * 3)}</td>
                  <td>{dinhDangEth(m.giaNgay * 7)}</td>
                  <td className="mo">{dinhDangEth(m.coc)}</td>
                  <td><span className={`trang-thai ${TRANG_THAI[m.trangThai].lop}`}>{TRANG_THAI[m.trangThai].ten}</span></td>
                  <td><Link to={`/may-anh/${m.id}`} className="nut nut-vien nut-nho-vua">Xem</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== VÌ SAO CHỌN ===== */}
      <section className="khung khoi">
        <span className="nhan-nho">Vì sao chọn TKCam</span>
        <h2>Thuê máy yên tâm từ lúc đặt đến lúc trả</h2>
        <div className="luoi-ly-do">
          {LY_DO.map((l) => (
            <div key={l.ten} className="ly-do">
              <span className="ly-do__icon"><BieuTuong ten={l.icon} co={22} /></span>
              <div>
                <h3>{l.ten}</h3>
                <p>{l.mota}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CHÍNH SÁCH ===== */}
      <section id="chinh-sach" className="khung khoi">
        <span className="nhan-nho">Chính sách</span>
        <h2>Rõ ràng từ đầu, không phí ẩn</h2>
        <div className="luoi-chinh-sach">
          <div className="the-chinh-sach">
            <BieuTuong ten="vi" co={26} />
            <h3>Tiền cọc</h3>
            <p>Khoảng 10 lần giá thuê một ngày, được giữ an toàn suốt thời gian thuê và hoàn lại khi trả máy.</p>
          </div>
          <div className="the-chinh-sach">
            <BieuTuong ten="dongHo" co={26} />
            <h3>Trả máy trễ</h3>
            <p>Mỗi ngày trễ tính bằng giá thuê một ngày, trừ vào tiền cọc. Phần còn lại hoàn về ví.</p>
          </div>
          <div className="the-chinh-sach">
            <BieuTuong ten="khien" co={26} />
            <h3>Hư hỏng</h3>
            <p>Chi phí sửa chữa được khấu trừ vào tiền cọc, không bao giờ vượt quá số cọc đã đặt.</p>
          </div>
          <div className="the-chinh-sach">
            <BieuTuong ten="maVach" co={26} />
            <h3>Đúng máy, đúng seri</h3>
            <p>Khi trả, số seri phải khớp với máy đã thuê. Bạn có thể tra cứu lịch sử máy bất cứ lúc nào.</p>
          </div>
        </div>
      </section>

      {/* ===== HỎI ĐÁP ===== */}
      <section id="cau-hoi" className="khung khoi luoi-hai-cot luoi-hai-cot--hoi-dap">
        <div>
          <span className="nhan-nho">Hỏi đáp</span>
          <h2>Câu hỏi thường gặp</h2>
          <p className="mo-ta">Chưa thấy câu trả lời bạn cần? Gọi hotline hoặc nhắn tin cho TKCam, chúng mình phản hồi trong giờ mở cửa.</p>
        </div>
        <div className="hoi-dap">
          {CAU_HOI.map(([hoi, dap], i) => (
            <details key={hoi} open={i === 0}>
              <summary>{hoi}</summary>
              <p>{dap}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== KÊU GỌI ===== */}
      <section className="khung">
        <div className="bang-keu-goi">
          <div>
            <h2>Sẵn sàng cho chuyến đi tiếp theo?</h2>
            <p>{sanSang.length} máy đang sẵn sàng cho thuê. Đặt ngay hôm nay, nhận máy nhanh.</p>
          </div>
          <div className="hang-nut">
            <Link to="/may-anh" className="nut nut-chinh nut-lon">Thuê máy ngay</Link>
            <Link to="/dang-ky" className="nut nut-vien-sang nut-lon">Tạo tài khoản</Link>
          </div>
        </div>
      </section>
    </>
  );
}

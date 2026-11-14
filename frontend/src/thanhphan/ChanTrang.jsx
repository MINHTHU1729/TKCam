import { Link } from "react-router-dom";
import BieuTuong from "./BieuTuong";
import { CUA_HANG } from "../tienich/thongTinCuaHang";

// Chân trang dùng chung
export default function ChanTrang() {
  return (
    <footer className="chan-trang">
      <div className="khung chan-trang__luoi">
        <div className="chan-trang__gioi-thieu">
          <Link to="/" className="logo logo--sang">
            <span className="logo__dau"><BieuTuong ten="mayAnh" co={18} /></span>
            TKCam
          </Link>
          <p>
            Cho thuê máy ảnh compact theo ngày cho những chuyến đi, buổi hẹn và kỷ niệm đáng nhớ.
            Máy được vệ sinh, kiểm tra kỹ trước mỗi lượt thuê.
          </p>
          <div className="mang-xa-hoi">
            <a href={CUA_HANG.facebook} aria-label="Facebook">f</a>
            <a href={CUA_HANG.instagram} aria-label="Instagram">ig</a>
            <a href={CUA_HANG.tiktok} aria-label="TikTok">tt</a>
          </div>
        </div>

        <div>
          <h4>Thuê máy</h4>
          <Link to="/may-anh">Tất cả máy ảnh</Link>
          <Link to="/may-anh?nhu-cau=Du lịch">Máy đi du lịch</Link>
          <Link to="/may-anh?nhu-cau=Vlog">Máy quay vlog</Link>
          <Link to="/may-anh?nhu-cau=Đi biển">Máy đi biển</Link>
        </div>

        <div>
          <h4>Hỗ trợ</h4>
          <Link to="/#quy-trinh">Cách thuê máy</Link>
          <Link to="/#chinh-sach">Chính sách cọc & trả máy</Link>
          <Link to="/#cau-hoi">Câu hỏi thường gặp</Link>
          <Link to="/tra-cuu">Tra cứu máy</Link>
        </div>

        <div>
          <h4>Liên hệ</h4>
          <p className="chan-trang__dong"><BieuTuong ten="dienThoai" co={16} /> {CUA_HANG.hotline}</p>
          <p className="chan-trang__dong"><BieuTuong ten="thu" co={16} /> {CUA_HANG.email}</p>
          <p className="chan-trang__dong"><BieuTuong ten="maiNha" co={16} /> {CUA_HANG.diaChi}</p>
          <p className="chan-trang__dong"><BieuTuong ten="dongHo" co={16} /> {CUA_HANG.gioMoCua}</p>
        </div>
      </div>

      <div className="khung chan-trang__cuoi">
        <span>© 2026 TKCam. Đã đăng ký bản quyền.</span>
        <span>Thực hiện: Đỗ Nguyễn Minh Thư · Nguyễn Vũ Khang</span>
      </div>
    </footer>
  );
}

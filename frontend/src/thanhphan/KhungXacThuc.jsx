import { Link } from "react-router-dom";
import HinhMayAnh from "./HinhMayAnh";
import BieuTuong from "./BieuTuong";

// Bố cục chung cho trang Đăng nhập / Đăng ký: form bên trái, ảnh giới thiệu bên phải
export default function KhungXacThuc({ tieuDe, moTa, children, chanForm }) {
  return (
    <div className="xac-thuc">
      <div className="xac-thuc__form">
        <div className="xac-thuc__trong">
          <h1>{tieuDe}</h1>
          <p className="mo">{moTa}</p>
          {children}
          <p className="xac-thuc__chan">{chanForm}</p>
        </div>
      </div>

      <aside className="xac-thuc__ben">
        <div className="xac-thuc__ben-trong">
          <Link to="/" className="logo logo--sang">
            <span className="logo__dau"><BieuTuong ten="mayAnh" co={18} /></span>
            TKCam
          </Link>
          <div className="xac-thuc__hinh">
            <HinhMayAnh mau="#c9c3b8" nen={false} />
          </div>
          <h2>Máy đẹp cho mọi chuyến đi, đặt online trong một phút.</h2>
          <ul>
            <li><BieuTuong ten="dauTick" co={18} /> Hoàn cọc ngay khi trả máy đúng hạn</li>
            <li><BieuTuong ten="dauTick" co={18} /> Theo dõi đơn thuê và hạn trả dễ dàng</li>
            <li><BieuTuong ten="dauTick" co={18} /> Hủy miễn phí trong 1 giờ sau khi đặt</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

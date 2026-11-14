import { Link } from "react-router-dom";

export default function KhongTimThay() {
  return (
    <div className="khung khoi">
      <div className="trong">
        <h1 className="tieu-de-trang">404</h1>
        <p>Trang bạn tìm không tồn tại.</p>
        <Link to="/" className="nut nut-chinh">Về trang chủ</Link>
      </div>
    </div>
  );
}

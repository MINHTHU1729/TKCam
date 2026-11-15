import { useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTaiKhoan } from "../../xuly/TaiKhoan";
import { useDuLieuAdmin, useLaAdmin } from "../../xuly/dungAdmin";
import { useVi } from "../../xuly/dungVi";
import { TEN_MANG } from "../../tienich/cauhinh";
import { chuCaiDau, rutGon } from "../../tienich/dinhdang";
import BieuTuong from "../../thanhphan/BieuTuong";
import TongQuan from "./TongQuan";
import QuanLyMay from "./QuanLyMay";
import ThemMay from "./ThemMay";
import SuaMay from "./SuaMay";
import QuanLyDon from "./QuanLyDon";
import KhachThue from "./KhachThue";
import GiaoDich from "./GiaoDich";

// Menu bên trái của khu quản trị
const MENU = [
  { duongDan: "/admin", ten: "Tổng quan", icon: "luoi", dau: true },
  { duongDan: "/admin/may-anh", ten: "Máy ảnh", icon: "mayAnh" },
  { duongDan: "/admin/them-may", ten: "Thêm máy", icon: "cong" },
  { duongDan: "/admin/don-thue", ten: "Đơn thuê", icon: "danhSach", demDon: true },
  { duongDan: "/admin/khach-thue", ten: "Khách thuê", icon: "nhom" },
  { duongDan: "/admin/giao-dich", ten: "Giao dịch", icon: "khien" },
];

const TIEU_DE = {
  "/admin": "Tổng quan",
  "/admin/may-anh": "Quản lý máy ảnh",
  "/admin/them-may": "Thêm máy mới",
  "/admin/don-thue": "Quản lý đơn thuê",
  "/admin/khach-thue": "Khách thuê",
  "/admin/giao-dich": "Nhật ký giao dịch",
};

// Bố cục riêng của khu quản trị: thanh bên + thanh trên, không dùng menu/chân trang của trang khách
export default function BoCucAdmin() {
  const { nguoiDung, dangXuat } = useTaiKhoan();
  const duLieu = useDuLieuAdmin();
  const { pathname } = useLocation();
  const [moMenu, setMoMenu] = useState(false);

  const donDangThue = duLieu.dsDon.filter((d) => d.trangThai === 0).length;
  const duongDanGon = pathname.replace(/\/$/, "") || "/admin";
  const tieuDe = TIEU_DE[duongDanGon] || (/^\/admin\/may-anh\/\d+$/.test(duongDanGon) ? "Sửa thông tin máy" : "Quản trị");

  // Đăng xuất rồi tải lại trang chủ (tải lại hẳn để trang chặn quản trị không bắt đăng nhập lại)
  const thoat = () => {
    dangXuat();
    window.location.replace("/");
  };

  return (
    <div className={`ad ${moMenu ? "ad--mo-menu" : ""}`}>
      <aside className="ad__ben">
        <div className="ad__logo">
          <span className="logo__dau"><BieuTuong ten="mayAnh" co={18} /></span>
          <div>
            <b>TKCam</b>
            <span>Quản trị cửa hàng</span>
          </div>
        </div>

        <nav className="ad__menu" onClick={() => setMoMenu(false)}>
          {MENU.map((m) => (
            <NavLink key={m.duongDan} to={m.duongDan} end={m.dau || m.duongDan === "/admin/them-may"}>
              <BieuTuong ten={m.icon} co={19} />
              <span>{m.ten}</span>
              {m.demDon && donDangThue > 0 && <span className="ad__dem">{donDangThue}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="ad__nguoi">
          <span className="anh-dai-dien">{chuCaiDau(nguoiDung.hoTen)}</span>
          <div>
            <b>{nguoiDung.hoTen}</b>
            <span>{nguoiDung.email}</span>
          </div>
          <button className="ad__thoat" onClick={thoat} title="Đăng xuất" aria-label="Đăng xuất">
            <BieuTuong ten="dangXuat" co={19} />
          </button>
        </div>
      </aside>

      <div className="ad__chinh">
        <header className="ad__tren">
          <button className="ad__nut-menu" onClick={() => setMoMenu(!moMenu)} aria-label="Mở menu">
            <span /><span /><span />
          </button>
          <h1>{tieuDe}</h1>
          <div className="ad__tren-phai">
            <ChipVi />
            <button className="nut nut-vien nut-nho-vua" onClick={duLieu.taiLai} disabled={duLieu.dangTai}>
              <BieuTuong ten="taiLai" co={16} /> {duLieu.dangTai ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </header>

        <main className="ad__noi-dung">
          {duLieu.loi && <p className="thong-bao thong-bao--loi">{duLieu.loi}</p>}
          <Routes>
            <Route index element={<TongQuan {...duLieu} />} />
            <Route path="may-anh" element={<QuanLyMay {...duLieu} />} />
            <Route path="may-anh/:id" element={<SuaMay {...duLieu} />} />
            <Route path="them-may" element={<ThemMay taiLai={duLieu.taiLai} />} />
            <Route path="don-thue" element={<QuanLyDon {...duLieu} />} />
            <Route path="khach-thue" element={<KhachThue {...duLieu} />} />
            <Route path="giao-dich" element={<GiaoDich {...duLieu} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Ô trạng thái ví ở thanh trên: thao tác ghi chỉ chạy khi MetaMask đang ở ví chủ hợp đồng
function ChipVi() {
  const vi = useVi();
  const { chuHopDong, laAdmin: laViChu } = useLaAdmin(vi.diaChi);

  if (!vi.daKetNoi) {
    return (
      <button className="ad__vi ad__vi--vang" onClick={vi.ketNoi} disabled={vi.dangTai} title="Cần ví chủ để thực hiện thao tác">
        <BieuTuong ten="vi" co={16} /> {vi.dangTai ? "Đang kết nối..." : "Kết nối ví chủ"}
      </button>
    );
  }
  if (vi.saiMang) {
    return (
      <button className="ad__vi ad__vi--vang" onClick={vi.doiMang}>
        <BieuTuong ten="vi" co={16} /> Chuyển sang {TEN_MANG}
      </button>
    );
  }
  if (chuHopDong && !laViChu) {
    return (
      <span className="ad__vi ad__vi--do" title={`Hãy chọn ví ${chuHopDong} trong MetaMask`}>
        <BieuTuong ten="vi" co={16} /> {rutGon(vi.diaChi)} · không phải ví chủ
      </span>
    );
  }
  return (
    <span className="ad__vi ad__vi--xanh" title={vi.diaChi}>
      <BieuTuong ten="vi" co={16} /> {rutGon(vi.diaChi)} · {vi.soDu ? Number(vi.soDu).toFixed(4) : "—"} ETH
    </span>
  );
}

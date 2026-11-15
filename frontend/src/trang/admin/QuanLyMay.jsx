import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { datBaoTri } from "../../tienich/hopDongAdmin";
import { TRANG_THAI } from "../../tienich/dinhdang";
import HinhMayAnh from "../../thanhphan/HinhMayAnh";

// Trang "Máy ảnh": danh sách máy, bật/tắt bảo trì (không tốn gas), vào trang sửa (ảnh, mô tả, giá...)
export default function QuanLyMay({ dsMay, dangTai, taiLai }) {
  const [dangXuLy, setDangXuLy] = useState(null); // mã máy đang chờ giao dịch
  const { state } = useLocation(); // thông báo gửi sang từ trang Thêm / Sửa máy
  const [thongBao, setThongBao] = useState({ loai: "tin", noiDung: state?.thongBao || "" });

  const doiBaoTri = async (may) => {
    const baoTri = !may.baoTri;
    setDangXuLy(may.id);
    setThongBao({ loai: "tin", noiDung: "Đang lưu..." });
    try {
      await datBaoTri(may.id, baoTri);
      setThongBao({ loai: "tin", noiDung: baoTri ? `Đã chuyển máy #${may.id} sang bảo trì.` : `Máy #${may.id} đã sẵn sàng cho thuê.` });
      await taiLai();
    } catch (e) {
      setThongBao({ loai: "loi", noiDung: e.message });
    } finally {
      setDangXuLy(null);
    }
  };

  return (
    <>
      {thongBao.noiDung && <p className={`thong-bao thong-bao--${thongBao.loai}`}>{thongBao.noiDung}</p>}

      <section className="the-khung">
        <div className="qt__hang">
          <h3>Danh sách máy ({dsMay.length})</h3>
          <Link to="/admin/them-may" className="nut nut-chinh nut-nho-vua">+ Thêm máy</Link>
        </div>
        {dangTai && !dsMay.length ? (
          <p className="mo">Đang tải...</p>
        ) : (
          <div className="cuon-ngang">
            <table className="bang qt__bang">
              <thead>
                <tr><th>Máy</th><th>Giá / ngày</th><th>Tiền cọc</th><th>Trạng thái</th><th></th></tr>
              </thead>
              <tbody>
                {dsMay.map((m) => {
                  const dangThue = m.trangThai === "dang-thue";
                  const ban = dangXuLy === m.id;
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="qt__may">
                          <span className="qt__anh-nho"><HinhMayAnh anh={m.anh} mau={m.mau} ten={m.ten} /></span>
                          <div>
                            <b>{m.ten}</b>
                            <div className="mo nho">#{m.id} · {m.seri}{m.hang ? ` · ${m.hang}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td>{m.giaNgay} ETH</td>
                      <td>{m.coc} ETH</td>
                      <td>
                        {m.coBaoGia ? (
                          <span className={`trang-thai ${TRANG_THAI[m.trangThai].lop}`}>{TRANG_THAI[m.trangThai].ten}</span>
                        ) : (
                          <span className="trang-thai vang" title="Bấm Sửa để ký báo giá">Chưa ký giá</span>
                        )}
                        {dangThue && <div className="mo nho">Đơn #{m.donHienTai}</div>}
                      </td>
                      <td className="qt__nut-dong">
                        <Link to={`/admin/may-anh/${m.id}`} className="nut nut-phu nut-nho-vua">Sửa</Link>
                        <button className="nut nut-vien nut-nho-vua" disabled={dangThue || ban}
                          title={dangThue ? "Máy đang cho thuê" : ""} onClick={() => doiBaoTri(m)}>
                          {ban ? "Đang lưu..." : m.baoTri ? "Mở cho thuê" : "Bảo trì"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mo nho">
          Thêm máy, sửa ảnh, đổi giá, bảo trì đều lưu trong CSDL nên không tốn gas (đổi giá chỉ cần ký xác nhận trong MetaMask).
          Máy đang có khách thuê thì chưa bật bảo trì được.
        </p>
      </section>
    </>
  );
}

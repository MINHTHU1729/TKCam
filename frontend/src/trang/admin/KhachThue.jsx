import { useEffect, useMemo, useState } from "react";
import { goiAPI } from "../../tienich/api";
import { chuCaiDau, dinhDangEth, rutGon } from "../../tienich/dinhdang";
import { TRANG_THAI_DON } from "../../tienich/hopDongThue";
import { ngayGioXuat, xuatCSV } from "../../tienich/xuatFile";
import MaGiaoDich from "../../thanhphan/MaGiaoDich";
import BieuTuong from "../../thanhphan/BieuTuong";
import { khopTuKhoa, linkVi, NutSaoChep, NutXuat, ONhapTim, PhanTrang, usePhanTrang } from "./CongCu";

const BO_LOC = [
  { ma: "tat-ca", ten: "Tất cả", loc: () => true },
  { ma: "dang-thue", ten: "Đang thuê", loc: (k) => k.dangThue > 0 },
  { ma: "da-thue", ten: "Đã từng thuê", loc: (k) => k.soDon > 0 },
  { ma: "chua-thue", ten: "Chưa thuê", loc: (k) => !k.soDon },
  { ma: "chua-vi", ten: "Chưa liên kết ví", loc: (k) => !k.diaChiVi },
];

const SAP_XEP = {
  "moi-nhat": (a, b) => (b.ngayTao || "").localeCompare(a.ngayTao || ""),
  "chi-nhieu": (a, b) => b.daChi - a.daChi,
  "nhieu-don": (a, b) => b.soDon - a.soDon,
  "thue-gan": (a, b) => b.lanCuoi - a.lanCuoi,
  "ten": (a, b) => (a.hoTen || "~").localeCompare(b.hoTen || "~", "vi"),
};

const ngayTaoDep = (s) => (s ? new Date(s.replace(" ", "T")).toLocaleDateString("vi-VN") : "—");

const COT_XUAT = [
  { ten: "Họ tên", lay: (k) => k.hoTen || "" },
  { ten: "Email", lay: (k) => k.email || "" },
  { ten: "Số điện thoại", lay: (k) => k.soDienThoai || "" },
  { ten: "Ví", lay: (k) => k.diaChiVi || "" },
  { ten: "Ngày tạo tài khoản", lay: (k) => ngayTaoDep(k.ngayTao) },
  { ten: "Số đơn", lay: (k) => k.soDon },
  { ten: "Đang thuê", lay: (k) => k.dangThue },
  { ten: "Đã trả", lay: (k) => k.daTra },
  { ten: "Đã hủy", lay: (k) => k.daHuy },
  { ten: "Đã chi (ETH)", lay: (k) => k.daChi },
  { ten: "Lần thuê gần nhất", lay: (k) => ngayGioXuat(k.lanCuoi) },
];

// Trang "Khách thuê": tài khoản khách (MySQL) + số liệu thuê (ghép theo ví), tìm kiếm, lọc, xuất Excel, xem chi tiết
export default function KhachThue({ dsDon, dangTai }) {
  const [dsTaiKhoan, setDsTaiKhoan] = useState([]);
  const [loiTaiKhoan, setLoiTaiKhoan] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [boLoc, setBoLoc] = useState("tat-ca");
  const [sapXep, setSapXep] = useState("moi-nhat");
  const [khachXem, setKhachXem] = useState(null);

  useEffect(() => {
    goiAPI("/quan-tri/khach-hang").then(setDsTaiKhoan).catch((e) => setLoiTaiKhoan(e.message));
  }, []);

  // Mỗi khách = 1 tài khoản (hoặc 1 ví thuê mà chưa có tài khoản), kèm danh sách đơn của họ
  const dsKhach = useMemo(() => {
    const donTheoVi = {};
    for (const d of dsDon) (donTheoVi[d.nguoiThue.toLowerCase()] ??= []).push(d);

    const tom = (dsDonKhach = []) => {
      const daTra = dsDonKhach.filter((d) => d.trangThai === 1);
      return {
        dsDon: [...dsDonKhach].sort((a, b) => b.batDau - a.batDau),
        soDon: dsDonKhach.length,
        dangThue: dsDonKhach.filter((d) => d.trangThai === 0).length,
        daTra: daTra.length,
        daHuy: dsDonKhach.filter((d) => d.trangThai === 2).length,
        daChi: daTra.reduce((s, d) => s + Number(d.tienThue) + Number(d.phiTre) + Number(d.tienHuHong), 0),
        phiTre: daTra.reduce((s, d) => s + Number(d.phiTre), 0),
        huHong: daTra.reduce((s, d) => s + Number(d.tienHuHong), 0),
        daHoan: dsDonKhach.reduce((s, d) => s + Number(d.tienHoan), 0),
        cocDangGiu: dsDonKhach.filter((d) => d.trangThai === 0).reduce((s, d) => s + Number(d.tienCoc), 0),
        lanCuoi: Math.max(0, ...dsDonKhach.map((d) => d.batDau)),
      };
    };

    const viCoTaiKhoan = new Set(dsTaiKhoan.map((t) => t.diaChiVi?.toLowerCase()).filter(Boolean));
    return [
      ...dsTaiKhoan.map((t) => ({ ...t, khoa: `tk${t.id}`, ...tom(donTheoVi[t.diaChiVi?.toLowerCase()]) })),
      ...Object.keys(donTheoVi).filter((vi) => !viCoTaiKhoan.has(vi))
        .map((vi) => ({ khoa: vi, diaChiVi: vi, hoTen: donTheoVi[vi][0].hoTen || null, ...tom(donTheoVi[vi]) })),
    ];
  }, [dsTaiKhoan, dsDon]);

  const dsLoc = useMemo(() => {
    const loc = BO_LOC.find((b) => b.ma === boLoc).loc;
    return dsKhach.filter((k) => loc(k) && khopTuKhoa(tuKhoa, k.hoTen, k.email, k.soDienThoai, k.diaChiVi)).sort(SAP_XEP[sapXep]);
  }, [dsKhach, boLoc, tuKhoa, sapXep]);
  const pt = usePhanTrang(dsLoc, 10);

  if (dangTai && !dsDon.length && !dsTaiKhoan.length) return <p className="mo">Đang tải...</p>;

  return (
    <>
      <section className="the-khung">
        <div className="qt__hang">
          <h3>Khách hàng ({dsLoc.length}{dsLoc.length !== dsKhach.length ? ` / ${dsKhach.length}` : ""})</h3>
          <NutXuat soDong={dsLoc.length} onClick={() => xuatCSV("khach-thue", COT_XUAT, dsLoc)} />
        </div>
        {loiTaiKhoan && <p className="thong-bao thong-bao--loi">{loiTaiKhoan}</p>}

        <div className="ct-loc">
          <ONhapTim giaTri={tuKhoa} doi={setTuKhoa} goiY="Tìm theo tên, email, số điện thoại, ví..." />
          <select className="o-nhap ct-chon" value={sapXep} onChange={(e) => setSapXep(e.target.value)} aria-label="Sắp xếp">
            <option value="moi-nhat">Mới đăng ký</option>
            <option value="thue-gan">Thuê gần đây</option>
            <option value="chi-nhieu">Chi nhiều nhất</option>
            <option value="nhieu-don">Nhiều đơn nhất</option>
            <option value="ten">Tên A → Z</option>
          </select>
        </div>
        <div className="hang-chip">
          {BO_LOC.map((b) => (
            <button key={b.ma} className={`chip ${boLoc === b.ma ? "chip--chon" : ""}`} onClick={() => setBoLoc(b.ma)}>
              {b.ten} ({dsKhach.filter(b.loc).length})
            </button>
          ))}
        </div>

        {dsLoc.length ? (
          <div className="cuon-ngang">
            <table className="bang qt__bang">
              <thead>
                <tr><th>Khách</th><th>Liên hệ</th><th>Ví</th><th>Đơn</th><th>Đã chi</th><th>Thuê gần nhất</th><th></th></tr>
              </thead>
              <tbody>
                {pt.dsTrang.map((k) => (
                  <tr key={k.khoa} className="ct-dong-bam" onClick={() => setKhachXem(k)}>
                    <td>
                      <div className="ct-khach">
                        <span className="anh-dai-dien ct-avatar">{chuCaiDau(k.hoTen || "?")}</span>
                        <div>
                          <b>{k.hoTen || "Khách chưa có tài khoản"}</b>
                          <div className="mo nho">{k.ngayTao ? `Đăng ký ${ngayTaoDep(k.ngayTao)}` : "Chỉ có ví"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="nho">{k.email ? <>{k.email}<br />{k.soDienThoai}</> : "—"}</td>
                    <td>{k.diaChiVi ? <code title={k.diaChiVi}>{rutGon(k.diaChiVi)}</code> : <span className="mo nho">Chưa liên kết</span>}</td>
                    <td>
                      {k.soDon || 0}
                      {k.dangThue > 0 && <> · <span className="trang-thai vang">{k.dangThue} đang thuê</span></>}
                    </td>
                    <td>{dinhDangEth(k.daChi)}</td>
                    <td className="nho">{k.lanCuoi ? new Date(k.lanCuoi * 1000).toLocaleDateString("vi-VN") : "—"}</td>
                    <td><button className="nut nut-phu nut-nho-vua" onClick={(e) => { e.stopPropagation(); setKhachXem(k); }}>Xem</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mo ct-trong">{dsKhach.length ? "Không có khách nào khớp với bộ lọc." : "Chưa có khách hàng nào."}</p>
        )}
        <PhanTrang {...pt} />
        <p className="mo nho">
          Tài khoản lấy từ CSDL MySQL; đơn thuê và tiền lấy theo ví khách đã liên kết.
          Đã chi = tiền thuê + phí trễ + phí hư hỏng của các đơn đã trả. Bấm vào một dòng để xem đầy đủ.
        </p>
      </section>

      {khachXem && <ChiTietKhach khach={khachXem} dong={() => setKhachXem(null)} />}
    </>
  );
}

// Ngăn kéo bên phải: hồ sơ khách + thống kê + lịch sử thuê
function ChiTietKhach({ khach: k, dong }) {
  useEffect(() => {
    const thoat = (e) => e.key === "Escape" && dong();
    window.addEventListener("keydown", thoat);
    return () => window.removeEventListener("keydown", thoat);
  }, [dong]);

  const link = linkVi(k.diaChiVi);
  const quaHan = k.dsDon.filter((d) => d.trangThai === 0 && Date.now() / 1000 > d.hanTra).length;

  return (
    <div className="ct-nen-ngan" onClick={dong}>
      <aside className="ct-ngan" onClick={(e) => e.stopPropagation()} aria-label="Thông tin khách hàng">
        <div className="ct-ngan__dau">
          <span className="anh-dai-dien ct-avatar ct-avatar--lon">{chuCaiDau(k.hoTen || "?")}</span>
          <div>
            <h3>{k.hoTen || "Khách chưa có tài khoản"}</h3>
            <span className="mo nho">{k.ngayTao ? `Thành viên từ ${ngayTaoDep(k.ngayTao)}` : "Chỉ thuê bằng ví, chưa đăng ký"}</span>
          </div>
          <button className="ct-dong" onClick={dong} aria-label="Đóng"><BieuTuong ten="dauX" co={20} /></button>
        </div>

        <div className="ct-ngan__khoi">
          <h4>Liên hệ</h4>
          <ul className="ct-lien-he">
            <li><BieuTuong ten="thu" co={18} />{k.email ? <a href={`mailto:${k.email}`}>{k.email}</a> : <span className="mo">Chưa có email</span>}</li>
            <li><BieuTuong ten="dienThoai" co={18} />{k.soDienThoai ? <a href={`tel:${k.soDienThoai}`}>{k.soDienThoai}</a> : <span className="mo">Chưa có số điện thoại</span>}</li>
            <li>
              <BieuTuong ten="vi" co={18} />
              {k.diaChiVi ? (
                <span className="ct-vi">
                  <code>{k.diaChiVi}</code>
                  <span className="ct-vi__nut">
                    <NutSaoChep noiDung={k.diaChiVi} />
                    {link && <a href={link} target="_blank" rel="noreferrer" className="ct-chep">Etherscan ↗</a>}
                  </span>
                </span>
              ) : <span className="mo">Chưa liên kết ví MetaMask</span>}
            </li>
          </ul>
        </div>

        <div className="ct-ngan__khoi">
          <h4>Thống kê</h4>
          <div className="ct-so">
            <div><b>{k.soDon}</b><span>Tổng đơn</span></div>
            <div><b>{k.dangThue}</b><span>Đang thuê{quaHan ? ` (${quaHan} quá hạn)` : ""}</span></div>
            <div><b>{k.daTra}</b><span>Đã trả</span></div>
            <div><b>{k.daHuy}</b><span>Đã hủy</span></div>
          </div>
          <dl className="chi-tiet">
            <div><dt>Tổng đã chi</dt><dd><b>{dinhDangEth(k.daChi)}</b></dd></div>
            <div><dt>Trong đó phí trễ</dt><dd>{dinhDangEth(k.phiTre)}</dd></div>
            <div><dt>Trong đó phí hư hỏng</dt><dd>{dinhDangEth(k.huHong)}</dd></div>
            <div><dt>Tiền đã hoàn về ví</dt><dd>{dinhDangEth(k.daHoan)}</dd></div>
            <div><dt>Cọc đang giữ</dt><dd>{dinhDangEth(k.cocDangGiu)}</dd></div>
          </dl>
        </div>

        <div className="ct-ngan__khoi">
          <h4>Lịch sử thuê ({k.dsDon.length})</h4>
          {k.dsDon.length ? (
            <ul className="ct-lich-su">
              {k.dsDon.map((d) => {
                const tre = d.trangThai === 0 && Date.now() / 1000 > d.hanTra;
                return (
                  <li key={d.maDon}>
                    <div className="ct-lich-su__dau">
                      <b>#{d.maDon} · {d.tenMay}</b>
                      <span className={`trang-thai ${tre ? "vang" : TRANG_THAI_DON[d.trangThai].lop}`}>
                        {tre ? "Quá hạn" : TRANG_THAI_DON[d.trangThai].ten}
                      </span>
                    </div>
                    <div className="mo nho">
                      {new Date(d.batDau * 1000).toLocaleString("vi-VN")} · {d.soNgay} ngày · seri {d.seri}
                    </div>
                    <div className="nho">
                      Thuê {dinhDangEth(d.tienThue)} · Cọc {dinhDangEth(d.tienCoc)}
                      {d.trangThai !== 0 && <> · Hoàn {dinhDangEth(d.tienHoan)}</>}
                    </div>
                    <div className="ct-hash">
                      <MaGiaoDich nhan="Thuê" hash={d.txThue} />
                      {d.txTra && <MaGiaoDich nhan="Trả" hash={d.txTra} />}
                      {d.txHuy && <MaGiaoDich nhan="Hủy" hash={d.txHuy} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mo">Khách chưa thuê máy nào.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

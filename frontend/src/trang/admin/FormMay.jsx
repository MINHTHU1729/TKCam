import { useEffect, useMemo, useState } from "react";
import HinhMayAnh from "../../thanhphan/HinhMayAnh";
import { laLinkAnh, MAU_MAC_DINH } from "../../tienich/thongTinMay";

const GOI_Y_PHU_HOP = ["Du lịch", "Người mới", "Vlog", "Đi biển", "Đường phố", "Chuyên nghiệp"];
const MAU_GOI_Y = ["#2b2b2e", "#c9c3b8", "#1f1f22", "#3b8fc4", "#b8323a", "#4a4a4d", "#d9c7a7"];

// Chuyển {"Cảm biến": "20MP"} <-> [{ten, giaTri}] để sửa từng dòng
const sangDong = (thongSo = {}) => {
  const ds = Object.entries(thongSo).map(([ten, giaTri]) => ({ ten, giaTri: String(giaTri) }));
  return ds.length ? ds : [{ ten: "", giaTri: "" }];
};
const sangThongSo = (dong) =>
  Object.fromEntries(dong.filter((d) => d.ten.trim() && d.giaTri.trim()).map((d) => [d.ten.trim(), d.giaTri.trim()]));

// Form dùng chung cho trang Thêm máy và Sửa máy
//   may: giá trị ban đầu · laSua: đang sửa (khóa seri) · khoaGia: máy đang cho thuê (không đổi giá được)
export default function FormMay({ may, laSua = false, khoaGia = false, luu, huy, chuNutLuu }) {
  const [form, setForm] = useState({
    seri: may.seri || "",
    ten: may.ten || "",
    hang: may.hang || "",
    giaNgay: may.giaNgay ? String(may.giaNgay) : "",
    coc: may.coc ? String(may.coc) : "",
    moTa: may.moTa || "",
    anhLink: "", // dán link ảnh trên mạng (nếu không upload file)
    mau: may.mau || MAU_MAC_DINH,
    phuHop: may.phuHop || [],
  });
  const [dongThongSo, setDongThongSo] = useState(sangDong(may.thongSo));
  const [tepAnh, setTepAnh] = useState(null); // file ảnh chọn từ máy tính
  const [xoaAnh, setXoaAnh] = useState(false);
  const [loi, setLoi] = useState("");
  const [ban, setBan] = useState(false);
  const [buoc, setBuoc] = useState("");

  // Xem trước ảnh: file mới chọn > link mới dán > ảnh đang có
  const linkXemTruocTep = useMemo(() => (tepAnh ? URL.createObjectURL(tepAnh) : ""), [tepAnh]);
  useEffect(() => () => linkXemTruocTep && URL.revokeObjectURL(linkXemTruocTep), [linkXemTruocTep]);
  const anhXemTruoc = linkXemTruocTep || (laLinkAnh(form.anhLink) ? form.anhLink : "") || (!xoaAnh ? may.anh || "" : "");

  const chonTep = (e) => {
    const tep = e.target.files?.[0] || null;
    if (tep && !/^image\/(jpeg|png|webp|gif)$/.test(tep.type)) {
      setLoi("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.");
      return;
    }
    if (tep && tep.size > 3 * 1024 * 1024) {
      setLoi("Ảnh tối đa 3MB.");
      return;
    }
    setLoi("");
    setTepAnh(tep);
    setXoaAnh(false);
  };

  const doi = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const batTatPhuHop = (p) =>
    setForm({ ...form, phuHop: form.phuHop.includes(p) ? form.phuHop.filter((x) => x !== p) : [...form.phuHop, p] });
  const doiDong = (i, truong, giaTri) => setDongThongSo(dongThongSo.map((d, j) => (j === i ? { ...d, [truong]: giaTri } : d)));

  const gui = async (e) => {
    e.preventDefault();
    setLoi("");
    setBan(true);
    try {
      await luu({ ...form, tepAnh, xoaAnh, thongSo: sangThongSo(dongThongSo) }, setBuoc);
    } catch (err) {
      setLoi(err.message);
      setBan(false);
      setBuoc("");
    }
  };

  return (
    <form className="fm" onSubmit={gui}>
      <div className="fm__cot">
        <section className="the-khung fm__khoi">
          <h3>Thông tin cơ bản</h3>
          <div className="hai-o">
            <label className="nhan-o">
              Số seri
              <input className="o-nhap" name="seri" value={form.seri} onChange={doi} disabled={laSua} placeholder="VD: CN-SX740-0007" />
            </label>
            <label className="nhan-o">
              Hãng
              <input className="o-nhap" name="hang" value={form.hang} onChange={doi} placeholder="Canon, Sony, Fujifilm..." />
            </label>
          </div>
          <label className="nhan-o">
            Tên máy
            <input className="o-nhap" name="ten" value={form.ten} onChange={doi} placeholder="VD: Canon PowerShot SX740 HS" />
          </label>
          <label className="nhan-o">
            Mô tả
            <textarea className="o-nhap fm__mo-ta" name="moTa" value={form.moTa} onChange={doi} rows={4}
              placeholder="Điểm nổi bật của máy, hợp với ai, chụp gì đẹp..." />
          </label>
          {laSua && <p className="mo nho">Số seri gắn với máy thật nên không đổi được.</p>}
        </section>

        <section className="the-khung fm__khoi">
          <h3>Giá thuê</h3>
          <div className="hai-o">
            <label className="nhan-o">
              Giá / ngày (ETH)
              <input className="o-nhap" name="giaNgay" value={form.giaNgay} onChange={doi} disabled={khoaGia} placeholder="0.0002" />
            </label>
            <label className="nhan-o">
              Tiền cọc (ETH)
              <input className="o-nhap" name="coc" value={form.coc} onChange={doi} disabled={khoaGia} placeholder="0.002" />
            </label>
          </div>
          {khoaGia && <p className="mo nho">Máy đang có khách thuê nên chưa đổi giá được. Xác nhận trả máy trước.</p>}
          {laSua && !may.coBaoGia && <p className="thong-bao thong-bao--loi">Máy chưa có báo giá đã ký nên khách chưa thuê được. Bấm Lưu để ký giá.</p>}
          {laSua && <p className="mo nho">Đổi giá không ảnh hưởng đơn đang thuê (đơn giữ giá lúc thuê).</p>}
        </section>

        <section className="the-khung fm__khoi">
          <h3>Thông số kỹ thuật</h3>
          {dongThongSo.map((d, i) => (
            <div className="fm__dong" key={i}>
              <input className="o-nhap" value={d.ten} onChange={(e) => doiDong(i, "ten", e.target.value)} placeholder="Tên (VD: Cảm biến)" />
              <input className="o-nhap" value={d.giaTri} onChange={(e) => doiDong(i, "giaTri", e.target.value)} placeholder="Giá trị (VD: 20MP CMOS)" />
              <button type="button" className="nut nut-chu nut-nho-vua" aria-label="Xóa dòng"
                onClick={() => setDongThongSo(dongThongSo.length > 1 ? dongThongSo.filter((_, j) => j !== i) : [{ ten: "", giaTri: "" }])}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="nut nut-phu nut-nho-vua fm__them-dong"
            onClick={() => setDongThongSo([...dongThongSo, { ten: "", giaTri: "" }])}>
            + Thêm dòng
          </button>
        </section>
      </div>

      <div className="fm__cot fm__cot--phu">
        <section className="the-khung fm__khoi">
          <h3>Hình ảnh</h3>
          <HinhMayAnh key={anhXemTruoc + form.mau} anh={anhXemTruoc} mau={form.mau} ten={form.ten} />
          <label className="nut nut-phu fm__chon-anh">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chonTep} hidden />
            {tepAnh ? `Đã chọn: ${tepAnh.name}` : "Tải ảnh từ máy tính"}
          </label>
          <label className="nhan-o">
            Hoặc dán link ảnh
            <input className={`o-nhap ${form.anhLink && !laLinkAnh(form.anhLink) ? "o-nhap--loi" : ""}`} name="anhLink"
              value={form.anhLink} onChange={doi} placeholder="https://...jpg" disabled={Boolean(tepAnh)} />
          </label>
          {(tepAnh || (laSua && may.anh && !xoaAnh)) && (
            <button type="button" className="nut nut-chu nut-nho-vua fm__them-dong"
              onClick={() => { setTepAnh(null); setXoaAnh(true); setForm({ ...form, anhLink: "" }); }}>
              Bỏ ảnh, dùng hình minh họa
            </button>
          )}
          <p className="mo nho">Ảnh JPG, PNG, WEBP tối đa 3MB, lưu trên máy chủ (thư mục uploads). Không có ảnh thì web vẽ hình minh họa theo màu thân máy.</p>
          <div className="nhan-o">
            Màu thân máy (hình minh họa)
            <div className="fm__mau">
              {MAU_GOI_Y.map((m) => (
                <button type="button" key={m} className={`fm__o-mau ${form.mau === m ? "chon" : ""}`} style={{ background: m }}
                  onClick={() => setForm({ ...form, mau: m })} aria-label={`Màu ${m}`} />
              ))}
              <input type="color" name="mau" value={form.mau} onChange={doi} aria-label="Chọn màu khác" />
            </div>
          </div>
        </section>

        <section className="the-khung fm__khoi">
          <h3>Phù hợp cho</h3>
          <div className="hang-chip">
            {GOI_Y_PHU_HOP.map((p) => (
              <button type="button" key={p} className={`chip ${form.phuHop.includes(p) ? "chip--chon" : ""}`} onClick={() => batTatPhuHop(p)}>
                {p}
              </button>
            ))}
          </div>
        </section>

        {loi && <p className="thong-bao thong-bao--loi">{loi}</p>}
        {buoc && <p className="thong-bao thong-bao--tin">{buoc}</p>}
        <div className="hang-nut">
          <button className="nut nut-chinh" type="submit" disabled={ban}>{ban ? "Đang xử lý..." : chuNutLuu}</button>
          <button className="nut nut-chu" type="button" onClick={huy} disabled={ban}>Hủy</button>
        </div>
        <p className="mo nho">
          Thông tin và ảnh lưu vào CSDL, không tốn gas. Giá thuê và tiền cọc cần ví chủ <b>ký xác nhận</b> trong MetaMask
          (ký miễn phí, không phải giao dịch) để hợp đồng kiểm tra khi khách thuê.
        </p>
      </div>
    </form>
  );
}

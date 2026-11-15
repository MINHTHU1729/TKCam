// Các hàm cho phần ADMIN (chủ cửa hàng)
// - Thêm máy, sửa ảnh / mô tả, bảo trì: chỉ lưu CSDL qua API → KHÔNG tốn gas.
// - Đặt / đổi giá: ví chủ KÝ báo giá trong MetaMask (ký miễn phí, không phải giao dịch), lưu chữ ký vào CSDL.
//   Khi khách thuê, hợp đồng kiểm tra chữ ký này nên khách không sửa được giá.
// - Xác nhận trả máy: giao dịch trên hợp đồng (hoàn cọc) → tốn gas, gửi mã hash về API lưu CSDL.
import { formatEther, getBytes, parseEther } from "ethers";
import { hopDongDoc, hopDongGhi, layKetNoi, layKetNoiDoc } from "./ketnoivi";
import { DIA_CHI_HOP_DONG } from "./cauhinh";
import { loiTiengViet } from "./hopDongThue";
import { goiAPI, ghiNhanGiaoDich } from "./api";
import { laLinkAnh } from "./thongTinMay";

const MOT_NGAY = 86400; // giây

// Lỗi riêng của các hàm admin → tiếng Việt (lỗi chung dùng loiTiengViet của phần người thuê)
export function loiAdmin(e) {
  const lyDo = e?.reason || e?.shortMessage || e?.message || "";
  const BANG = {
    "Chi chu cua hang": "Chỉ ví chủ cửa hàng mới được thực hiện.",
    "Seri da ton tai": "Số seri này đã có trong hệ thống.",
    "Seri trong": "Vui lòng nhập số seri.",
    "Gia va coc phai lon hon 0": "Giá thuê và tiền cọc phải lớn hơn 0.",
    "May dang cho thue": "Máy đang có khách thuê, chưa đổi được.",
    "Seri khong khop": "Số seri không khớp với máy của đơn này. Kiểm tra lại máy khách trả.",
    "Don khong o trang thai dang thue": "Đơn này đã trả hoặc đã hủy.",
    "Khong co don": "Không tìm thấy đơn thuê.",
    "Ten trong": "Vui lòng nhập tên máy.",
    "Thong tin qua dai": "Thông tin máy quá dài (tối đa khoảng 4000 ký tự). Hãy rút gọn mô tả hoặc link ảnh.",
  };
  const khop = Object.keys(BANG).find((k) => lyDo.includes(k));
  if (khop) return BANG[khop];
  if (e?.code === "ACTION_REJECTED" || e?.info?.error?.code === 4001) return "Bạn đã hủy giao dịch.";
  return loiTiengViet(e);
}

// Gọi 1 hàm ghi (giao dịch), chờ xác nhận, trả về { hash, bienNhan, hopDong }
async function goiHamGhi(tenHam, ...thamSo) {
  try {
    const hopDong = await hopDongGhi();
    const giaoDich = await hopDong[tenHam](...thamSo);
    const bienNhan = await giaoDich.wait();
    return { hash: giaoDich.hash, bienNhan, hopDong };
  } catch (e) {
    throw new Error(loiAdmin(e));
  }
}

// Giao dịch đã thành công trên blockchain nhưng lưu CSDL lỗi: báo rõ để admin bấm Tải lại
async function luuCSDL(viec) {
  try {
    return await viec();
  } catch (e) {
    throw new Error(`Giao dịch đã thành công trên blockchain nhưng chưa lưu được vào CSDL: ${e.message}`);
  }
}

// Chuyển số ETH người dùng gõ (vd "0.0001") sang wei, báo lỗi nếu gõ sai
function sangWei(so, tenO) {
  const chuoi = String(so ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,18})?$/.test(chuoi)) throw new Error(`${tenO} không hợp lệ (ví dụ: 0.0001).`);
  return parseEther(chuoi);
}

// ---------------------- ĐỌC ----------------------

export const layChuHopDong = () => hopDongDoc().owner();

// Số dư ETH hợp đồng đang giữ (= tổng tiền thuê + cọc của các đơn đang thuê)
export async function laySoDuHopDong() {
  return formatEther(await layKetNoiDoc().getBalance(DIA_CHI_HOP_DONG));
}

// Ước tính phí trễ nếu xác nhận trả ngay bây giờ (giống cách hợp đồng tính)
export function uocTinhPhiTre(don, giayHienTai = Math.floor(Date.now() / 1000)) {
  if (giayHienTai <= don.hanTra) return { soNgayTre: 0, phiTre: 0 };
  const soNgayTre = Math.ceil((giayHienTai - don.hanTra) / MOT_NGAY);
  const phiTre = Math.min(soNgayTre * Number(don.giaNgay), Number(don.tienCoc));
  return { soNgayTre, phiTre };
}

// Thống kê nhanh cho trang tổng quan
export function tinhThongKe(dsMay, dsDon) {
  const daTra = dsDon.filter((d) => d.trangThai === 1);
  const dangThue = dsDon.filter((d) => d.trangThai === 0);
  const tong = (ds, lay) => ds.reduce((s, d) => s + Number(lay(d)), 0);
  return {
    soMay: dsMay.length,
    sanSang: dsMay.filter((m) => m.trangThai === "san-sang").length,
    dangThueMay: dsMay.filter((m) => m.trangThai === "dang-thue").length,
    baoTri: dsMay.filter((m) => m.trangThai === "bao-tri").length,
    soDon: dsDon.length,
    donDangThue: dangThue.length,
    donDaTra: daTra.length,
    donDaHuy: dsDon.filter((d) => d.trangThai === 2).length,
    doanhThu: tong(daTra, (d) => Number(d.tienThue) + Number(d.phiTre) + Number(d.tienHuHong)),
    cocDangGiu: tong(dangThue, (d) => d.tienCoc),
    quaHan: dangThue.filter((d) => Date.now() / 1000 > d.hanTra).length,
  };
}

// ---------------------- THÔNG TIN MÁY (CSDL) ----------------------

// Gói thông tin form thành FormData để gửi kèm file ảnh
function taoFormMay(may, them = {}) {
  if (!may.ten?.trim()) throw new Error("Vui lòng nhập tên máy.");
  if (may.anhLink?.trim() && !laLinkAnh(may.anhLink)) throw new Error("Link ảnh phải bắt đầu bằng http:// hoặc https://");
  if (may.tepAnh && may.tepAnh.size > 3 * 1024 * 1024) throw new Error("Ảnh tối đa 3MB.");
  const f = new FormData();
  f.append("ten", may.ten.trim());
  f.append("hang", may.hang || "");
  f.append("moTa", may.moTa || "");
  f.append("mau", may.mau || "");
  f.append("anhLink", may.anhLink || "");
  f.append("thongSo", JSON.stringify(may.thongSo || {}));
  f.append("phuHop", JSON.stringify(may.phuHop || []));
  if (may.tepAnh) f.append("anh", may.tepAnh);
  if (may.xoaAnh) f.append("xoaAnh", "1");
  for (const [k, v] of Object.entries(them)) f.append(k, String(v));
  return f;
}

// Sửa thông tin hiển thị (tên, hãng, mô tả, ảnh, màu, thông số, phù hợp) – chỉ lưu CSDL, không tốn gas
export function suaThongTinMay(maMay, may) {
  return goiAPI(`/may-anh/${maMay}`, { method: "POST", body: taoFormMay(may) });
}

// Bật / tắt bảo trì – chỉ lưu CSDL, không tốn gas
export function datBaoTri(maMay, baoTri) {
  return goiAPI(`/may-anh/${maMay}/bao-tri`, { method: "POST", body: { baoTri } });
}

// ---------------------- BÁO GIÁ CÓ CHỮ KÝ (miễn phí) ----------------------

const MOT_NAM = 365 * MOT_NGAY;

// Ví chủ ký báo giá (giá / ngày, tiền cọc) cho 1 máy rồi lưu vào CSDL.
// signMessage chỉ là chữ ký, không gửi giao dịch nên không tốn gas.
export async function kyBaoGia(may, giaNgay, coc) {
  const giaWei = sangWei(giaNgay, "Giá thuê");
  const cocWei = sangWei(coc, "Tiền cọc");
  if (giaWei <= 0n || cocWei <= 0n) throw new Error("Giá thuê và tiền cọc phải lớn hơn 0.");
  try {
    const nguoiKy = await layKetNoi().getSigner();
    const [diaChi, chu] = await Promise.all([nguoiKy.getAddress(), hopDongDoc().owner()]);
    if (diaChi.toLowerCase() !== chu.toLowerCase()) throw new Error("Hãy chọn ví chủ cửa hàng trong MetaMask để ký giá.");
    const hetHan = Math.floor(Date.now() / 1000) + MOT_NAM; // báo giá dùng được 1 năm
    const bam = await hopDongDoc().bamBaoGia(may.id, may.seri, giaWei, cocWei, hetHan);
    const chuKy = await nguoiKy.signMessage(getBytes(bam));
    return await goiAPI(`/may-anh/${may.id}/bao-gia`, {
      method: "POST",
      body: { giaNgayWei: giaWei.toString(), tienCocWei: cocWei.toString(), hetHan, chuKy },
    });
  } catch (e) {
    if (e?.code === "ACTION_REJECTED" || e?.info?.error?.code === 4001) throw new Error("Bạn đã hủy ký báo giá.");
    throw e instanceof Error && !e.code ? e : new Error(loiAdmin(e));
  }
}

// Thêm máy: 1) lưu thông tin + ảnh vào CSDL (miễn phí)  2) ký báo giá (miễn phí)
export async function dangMayMoi(may, baoBuoc = () => {}) {
  if (!may.seri?.trim()) throw new Error("Vui lòng nhập số seri.");
  sangWei(may.giaNgay, "Giá thuê");
  sangWei(may.coc, "Tiền cọc");
  baoBuoc("Bước 1/2: đang lưu thông tin và ảnh vào CSDL...");
  const moi = await goiAPI("/may-anh", { method: "POST", body: taoFormMay(may, { seri: may.seri.trim() }) });
  baoBuoc("Bước 2/2: ký báo giá trong MetaMask (miễn phí, không tốn gas)...");
  try {
    return await kyBaoGia(moi, may.giaNgay, may.coc);
  } catch (e) {
    const loi = new Error(`Đã lưu máy "${moi.ten}" nhưng chưa ký giá (${e.message}). Bấm Sửa ở máy đó để ký lại.`);
    loi.daLuuMay = moi.id;
    throw loi;
  }
}

// Đổi giá = ký báo giá mới (miễn phí)
export const doiGia = (may, giaNgay, coc) => kyBaoGia(may, giaNgay, coc);

// ---------------------- GIAO DỊCH BLOCKCHAIN (tốn gas) ----------------------

export async function xacNhanTraMay(maDon, seri, tienHuHong) {
  const huHong = String(tienHuHong ?? "").trim() === "" ? 0n : sangWei(tienHuHong, "Phí hư hỏng");
  const { hash } = await goiHamGhi("confirmReturn", maDon, String(seri).trim(), huHong);
  await luuCSDL(() => ghiNhanGiaoDich(hash, "tra-may", { maDon }));
  return hash;
}

// Các hàm định dạng dùng chung

// 0.0010 → "0.001 ETH"
export const dinhDangEth = (so) =>
  `${Number(so).toLocaleString("en-US", { maximumFractionDigits: 6 })} ETH`;

// 0x1234567890abcdef → "0x1234...cdef"
export const rutGon = (dc) => (dc ? `${dc.slice(0, 6)}...${dc.slice(-4)}` : "—");

// "Đỗ Minh Thư" → "MT"
export const chuCaiDau = (ten = "") =>
  ten.trim().split(/\s+/).slice(-2).map((t) => t[0]?.toUpperCase()).join("") || "?";

// Tên hiển thị và màu của từng trạng thái máy
export const TRANG_THAI = {
  "san-sang": { ten: "Sẵn sàng", lop: "xanh" },
  "dang-thue": { ten: "Đang cho thuê", lop: "vang" },
  "bao-tri": { ten: "Bảo trì", lop: "xam" },
};

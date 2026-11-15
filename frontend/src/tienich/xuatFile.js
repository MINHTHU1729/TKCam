// Xuất danh sách ra file CSV mở được bằng Excel (có BOM UTF-8 để Excel hiện đúng tiếng Việt)
//   cot: [{ ten: "Tiêu đề cột", lay: (dong) => giá trị }]
export function xuatCSV(tenFile, cot, ds) {
  const boc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const dong = [cot.map((c) => boc(c.ten)).join(",")];
  for (const d of ds) dong.push(cot.map((c) => boc(c.lay(d))).join(","));

  const blob = new Blob(["﻿" + dong.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const ngay = new Date().toISOString().slice(0, 10);
  link.download = `${tenFile}-${ngay}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Ngày giờ dễ đọc trong file Excel
export const ngayGioXuat = (giay) => (giay ? new Date(giay * 1000).toLocaleString("vi-VN") : "");

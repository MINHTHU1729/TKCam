// Đọc / ghi localStorage an toàn (một số trình duyệt chặn localStorage)
export function docLuuTru(khoa, macDinh) {
  try {
    const giaTri = localStorage.getItem(khoa);
    return giaTri ? JSON.parse(giaTri) : macDinh;
  } catch {
    return macDinh;
  }
}

export function ghiLuuTru(khoa, giaTri) {
  try {
    if (giaTri === null) localStorage.removeItem(khoa);
    else localStorage.setItem(khoa, JSON.stringify(giaTri));
  } catch {
    /* bỏ qua */
  }
}

<?php
// API TKCam (PHP + MySQL, chạy trên Apache của XAMPP)
// Gọi dạng: http://localhost:8181/tkcam-api/index.php/may-anh
//
// CSDL lưu dữ liệu: tài khoản, máy ảnh + ảnh + giá + báo giá đã ký, bảo trì, đơn thuê, nhật ký giao dịch.
//   -> thêm máy, đổi giá, bảo trì, sửa ảnh: chỉ ghi CSDL, KHÔNG tốn gas.
// Blockchain chỉ lo phần tiền: thuê (trả tiền thuê + cọc), hủy, trả máy (hoàn cọc).
//   -> sau mỗi giao dịch web gửi MÃ HASH về đây; API kiểm tra hash trên blockchain rồi mới lưu.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

function traVe($ma, $duLieu) {
  http_response_code($ma);
  echo json_encode($duLieu, JSON_UNESCAPED_UNICODE);
  exit;
}

require __DIR__ . '/csdl.php';
require __DIR__ . '/token.php';
require __DIR__ . '/hopdong.php';

set_exception_handler(function ($e) {
  if ($e instanceof LoiMangBlockchain) traVe(502, ['loi' => $e->getMessage()]);
  error_log($e);
  traVe(500, ['loi' => 'Máy chủ gặp lỗi, vui lòng thử lại.']);
});

// ---------- Đọc yêu cầu ----------
$phuongThuc = $_SERVER['REQUEST_METHOD'];
$duongDan = $_SERVER['PATH_INFO'] ?? '';
if ($duongDan === '') {
  $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
  $vt = strpos($uri, 'index.php');
  $duongDan = $vt !== false ? substr($uri, $vt + 9) : '';
}
$doan = array_values(array_filter(explode('/', $duongDan), 'strlen'));
$laForm = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
$than = $laForm ? $_POST : (json_decode(file_get_contents('php://input'), true) ?: []);

// Địa chỉ thư mục API (để trả link ảnh đầy đủ)
$giaoThuc = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$GOC_API = $giaoThuc . '://' . $_SERVER['HTTP_HOST'] . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');

// ---------- Chuyển dữ liệu sang dạng frontend dùng ----------
function hienThiNguoiDung($u) {
  return [
    'id' => (int)$u['id'], 'hoTen' => $u['ho_ten'], 'email' => $u['email'],
    'soDienThoai' => $u['so_dien_thoai'], 'diaChiVi' => $u['dia_chi_vi'],
    'vaiTro' => $u['vai_tro'], 'ngayTao' => $u['ngay_tao'],
  ];
}
function linkAnh($anh) {
  global $GOC_API;
  if (!$anh) return '';
  return preg_match('#^https?://#i', $anh) ? $anh : $GOC_API . '/' . $anh;
}
// Trạng thái máy cho khách: bảo trì (admin bật, hoặc chưa có báo giá hợp lệ) > đang thuê > sẵn sàng
function hienThiMay($m) {
  $coBaoGia = !empty($m['chu_ky']) && (int)$m['het_han'] > time() + 3600 && $m['gia_ngay_wei'] !== '0';
  $donHienTai = isset($m['don_hien_tai']) ? (int)$m['don_hien_tai'] : 0;
  $trangThai = ($m['bao_tri'] || !$coBaoGia) ? 'bao-tri' : ($donHienTai ? 'dang-thue' : 'san-sang');
  return [
    'id' => (int)$m['id'], 'seri' => $m['seri'], 'ten' => $m['ten'], 'hang' => $m['hang'],
    'moTa' => (string)$m['mo_ta'], 'anh' => linkAnh($m['anh']), 'mau' => $m['mau'],
    'thongSo' => json_decode($m['thong_so'] ?: '{}', true) ?: new stdClass(),
    'phuHop' => json_decode($m['phu_hop'] ?: '[]', true) ?: [],
    'giaNgay' => (float)weiThapPhanSangEth($m['gia_ngay_wei']), 'coc' => (float)weiThapPhanSangEth($m['tien_coc_wei']),
    'giaNgayWei' => $m['gia_ngay_wei'], 'tienCocWei' => $m['tien_coc_wei'],
    'trangThai' => $trangThai, 'baoTri' => (bool)$m['bao_tri'], 'coBaoGia' => $coBaoGia,
    'donHienTai' => $donHienTai,
    // Báo giá đã ký: chỉ đưa ra khi máy sẵn sàng để khách gửi lên hợp đồng lúc thuê
    'hetHan' => (int)$m['het_han'], 'chuKy' => $trangThai === 'san-sang' ? $m['chu_ky'] : null,
  ];
}
function hienThiDon($d, $anVi = false) {
  $vi = $d['vi_khach'];
  return [
    'maDon' => (int)$d['id'], 'maMay' => (int)$d['may_id'],
    'tenMay' => $d['ten_may'] ?? '', 'seri' => $d['seri'] ?? '', 'anh' => linkAnh($d['anh'] ?? ''), 'mau' => $d['mau'] ?? '#2b2b2e',
    'giaNgay' => (float)($d['gia_ngay'] ?? 0),
    'nguoiThue' => $anVi ? substr($vi, 0, 6) . '...' . substr($vi, -4) : $vi,
    'hoTen' => $anVi ? null : ($d['ho_ten'] ?? null), 'email' => $anVi ? null : ($d['email'] ?? null),
    'soDienThoai' => $anVi ? null : ($d['so_dien_thoai'] ?? null),
    'soNgay' => (int)$d['so_ngay'], 'tienThue' => (float)$d['tien_thue'], 'tienCoc' => (float)$d['tien_coc'],
    'batDau' => (int)$d['bat_dau'], 'hanTra' => (int)$d['han_tra'], 'ngayTra' => (int)$d['ngay_tra'],
    'phiTre' => (float)$d['phi_tre'], 'tienHuHong' => (float)$d['tien_hu_hong'], 'tienHoan' => (float)$d['tien_hoan'],
    'trangThai' => (int)$d['trang_thai'],
    'txThue' => $d['tx_thue'], 'txTra' => $d['tx_tra'], 'txHuy' => $d['tx_huy'],
  ];
}

const SQL_MAY = "SELECT m.*, (SELECT d.id FROM don_thue d WHERE d.may_id = m.id AND d.trang_thai = 0 ORDER BY d.id DESC LIMIT 1) AS don_hien_tai FROM may_anh m";
const SQL_DON = "SELECT d.*, m.ten AS ten_may, m.seri, m.anh, m.mau, n.ho_ten, n.email, n.so_dien_thoai
                 FROM don_thue d LEFT JOIN may_anh m ON m.id = d.may_id LEFT JOIN nguoi_dung n ON n.id = d.nguoi_dung_id";

function layNguoiDung($id) {
  $l = ketNoiCSDL()->prepare('SELECT * FROM nguoi_dung WHERE id = ?');
  $l->execute([$id]);
  return $l->fetch();
}
function layMay($id) {
  $l = ketNoiCSDL()->prepare(SQL_MAY . ' WHERE m.id = ?');
  $l->execute([$id]);
  return $l->fetch();
}
function chiAdmin() {
  $nd = canDangNhap();
  if (($nd['vaiTro'] ?? '') !== 'admin') traVe(403, ['loi' => 'Chỉ quản trị viên được thực hiện.']);
  return $nd;
}
function ghiGiaoDich($db, $hash, $loai, $gd, $nguoiDungId, $mayId, $donId, $soTien, $ghiChu = '') {
  $db->prepare('INSERT IGNORE INTO giao_dich (ma_hash, loai, vi_gui, nguoi_dung_id, may_id, don_id, so_tien, so_khoi, ghi_chu)
                VALUES (?,?,?,?,?,?,?,?,?)')
     ->execute([strtolower($hash), $loai, $gd['tu'], $nguoiDungId, $mayId, $donId, $soTien, $gd['so_khoi'], $ghiChu]);
}

// Lưu ảnh upload vào thư mục uploads/, trả về đường dẫn tương đối
function luuAnhUpload() {
  if (empty($_FILES['anh']) || $_FILES['anh']['error'] === UPLOAD_ERR_NO_FILE) return null;
  $tep = $_FILES['anh'];
  if ($tep['error'] !== UPLOAD_ERR_OK) traVe(400, ['loi' => 'Tải ảnh lên thất bại (ảnh tối đa khoảng 2MB với XAMPP mặc định).']);
  if ($tep['size'] > 3 * 1024 * 1024) traVe(400, ['loi' => 'Ảnh tối đa 3MB.']);
  $kieu = @getimagesize($tep['tmp_name'])['mime'] ?? '';
  $DUOI = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
  if (!isset($DUOI[$kieu])) traVe(400, ['loi' => 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.']);
  $thuMuc = __DIR__ . '/uploads';
  if (!is_dir($thuMuc)) mkdir($thuMuc, 0775, true);
  $ten = 'may-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $DUOI[$kieu];
  if (!move_uploaded_file($tep['tmp_name'], "$thuMuc/$ten")) traVe(500, ['loi' => 'Không lưu được ảnh.']);
  return "uploads/$ten";
}

// Đọc thông tin hiển thị máy admin gửi lên (form)
function docThongTinMay($b) {
  $ten = trim($b['ten'] ?? '');
  if ($ten === '') traVe(400, ['loi' => 'Vui lòng nhập tên máy.']);
  $anhLink = trim($b['anhLink'] ?? '');
  if ($anhLink !== '' && !preg_match('#^https?://\S+$#i', $anhLink)) traVe(400, ['loi' => 'Link ảnh phải bắt đầu bằng http:// hoặc https://']);
  $mau = preg_match('/^#[0-9a-fA-F]{6}$/', $b['mau'] ?? '') ? $b['mau'] : '#2b2b2e';
  $thongSo = json_decode($b['thongSo'] ?? '{}', true);
  $phuHop = json_decode($b['phuHop'] ?? '[]', true);
  return [
    'ten' => $ten, 'hang' => trim($b['hang'] ?? ''), 'mo_ta' => trim($b['moTa'] ?? ''), 'mau' => $mau, 'anh_link' => $anhLink,
    'thong_so' => json_encode(is_array($thongSo) ? $thongSo : new stdClass(), JSON_UNESCAPED_UNICODE),
    'phu_hop' => json_encode(is_array($phuHop) ? array_values($phuHop) : [], JSON_UNESCAPED_UNICODE),
  ];
}

$db = ketNoiCSDL();
$tuyen = $doan[0] ?? '';
$hanhDong = $doan[1] ?? '';

// ======================================================================
// TÀI KHOẢN
// ======================================================================
if ($tuyen === 'tai-khoan') {
  if ($hanhDong === 'dang-ky' && $phuongThuc === 'POST') {
    $hoTen = trim($than['hoTen'] ?? '');
    $email = strtolower(trim($than['email'] ?? ''));
    $sdt = preg_replace('/\s/', '', $than['soDienThoai'] ?? '');
    $matKhau = (string)($than['matKhau'] ?? '');
    if (mb_strlen($hoTen) < 2) traVe(400, ['loi' => 'Vui lòng nhập họ tên.']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) traVe(400, ['loi' => 'Email không hợp lệ.']);
    if (!preg_match('/^0\d{9}$/', $sdt)) traVe(400, ['loi' => 'Số điện thoại gồm 10 số, bắt đầu bằng 0.']);
    if (strlen($matKhau) < 6) traVe(400, ['loi' => 'Mật khẩu ít nhất 6 ký tự.']);
    $l = $db->prepare('SELECT id FROM nguoi_dung WHERE email = ?');
    $l->execute([$email]);
    if ($l->fetch()) traVe(409, ['loi' => 'Email này đã được đăng ký.']);
    $db->prepare('INSERT INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_bam) VALUES (?,?,?,?)')
       ->execute([$hoTen, $email, $sdt, password_hash($matKhau, PASSWORD_BCRYPT)]);
    $u = layNguoiDung($db->lastInsertId());
    traVe(201, ['token' => taoToken($u), 'nguoiDung' => hienThiNguoiDung($u)]);
  }

  if ($hanhDong === 'dang-nhap' && $phuongThuc === 'POST') {
    $l = $db->prepare('SELECT * FROM nguoi_dung WHERE email = ?');
    $l->execute([strtolower(trim($than['email'] ?? ''))]);
    $u = $l->fetch();
    if (!$u || !password_verify((string)($than['matKhau'] ?? ''), $u['mat_khau_bam'])) {
      traVe(401, ['loi' => 'Email hoặc mật khẩu không đúng.']);
    }
    traVe(200, ['token' => taoToken($u), 'nguoiDung' => hienThiNguoiDung($u)]);
  }

  // Quên mật khẩu: xác minh bằng email + số điện thoại đã đăng ký, rồi đặt mật khẩu mới
  if ($hanhDong === 'quen-mat-khau' && $phuongThuc === 'POST') {
    $email = strtolower(trim($than['email'] ?? ''));
    $sdt = preg_replace('/\s/', '', $than['soDienThoai'] ?? '');
    $matKhauMoi = (string)($than['matKhauMoi'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) traVe(400, ['loi' => 'Email không hợp lệ.']);
    if (!preg_match('/^0\d{9}$/', $sdt)) traVe(400, ['loi' => 'Số điện thoại gồm 10 số, bắt đầu bằng 0.']);
    if (strlen($matKhauMoi) < 6) traVe(400, ['loi' => 'Mật khẩu mới ít nhất 6 ký tự.']);

    $l = $db->prepare('SELECT * FROM nguoi_dung WHERE email = ?');
    $l->execute([$email]);
    $u = $l->fetch();
    $saiThongTin = 'Email hoặc số điện thoại không khớp với tài khoản nào.';
    if (!$u) traVe(400, ['loi' => $saiThongTin]);

    // Chống dò số điện thoại: sai 5 lần thì khóa 15 phút
    $khoa = 'qmk_' . $u['id'];
    [$soLanSai, $luc] = array_map('intval', explode('|', layHeThong($db, $khoa) ?? '0|0') + [0, 0]);
    if ($luc < time() - 900) $soLanSai = 0;
    if ($soLanSai >= 5) traVe(429, ['loi' => 'Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.']);
    if ($u['so_dien_thoai'] !== $sdt) {
      ghiHeThong($db, $khoa, ($soLanSai + 1) . '|' . time());
      traVe(400, ['loi' => $saiThongTin]);
    }

    $db->prepare('UPDATE nguoi_dung SET mat_khau_bam = ? WHERE id = ?')
       ->execute([password_hash($matKhauMoi, PASSWORD_BCRYPT), $u['id']]);
    $db->prepare('DELETE FROM he_thong WHERE khoa = ?')->execute([$khoa]);
    traVe(200, ['thongBao' => 'Đã đặt lại mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.']);
  }

  if ($hanhDong === 'toi' && $phuongThuc === 'GET') {
    $u = layNguoiDung(canDangNhap()['id']);
    if (!$u) traVe(404, ['loi' => 'Không tìm thấy tài khoản.']);
    traVe(200, ['nguoiDung' => hienThiNguoiDung($u)]);
  }

  if ($hanhDong === 'vi' && $phuongThuc === 'PUT') {
    $u = layNguoiDung(canDangNhap()['id']);
    if (!$u) traVe(404, ['loi' => 'Không tìm thấy tài khoản.']);
    $vi = strtolower($than['diaChiVi'] ?? '');
    if (!preg_match('/^0x[0-9a-f]{40}$/', $vi)) traVe(400, ['loi' => 'Địa chỉ ví không hợp lệ.']);
    if ($u['dia_chi_vi'] && $u['dia_chi_vi'] !== $vi) traVe(409, ['loi' => 'Tài khoản này đã liên kết với ví khác.']);
    $l = $db->prepare('SELECT id FROM nguoi_dung WHERE dia_chi_vi = ? AND id <> ?');
    $l->execute([$vi, $u['id']]);
    if ($l->fetch()) traVe(409, ['loi' => 'Ví này đã được liên kết với tài khoản khác.']);
    $db->prepare('UPDATE nguoi_dung SET dia_chi_vi = ? WHERE id = ?')->execute([$vi, $u['id']]);
    $db->prepare('UPDATE don_thue SET nguoi_dung_id = ? WHERE vi_khach = ? AND nguoi_dung_id IS NULL')->execute([$u['id'], $vi]);
    traVe(200, ['nguoiDung' => hienThiNguoiDung(layNguoiDung($u['id']))]);
  }
}

// ======================================================================
// MÁY ẢNH (ai cũng xem được; admin thêm / sửa / đổi giá / bảo trì – không tốn gas)
// ======================================================================
if ($tuyen === 'may-anh') {
  $maMay = ctype_digit($hanhDong) ? (int)$hanhDong : null;
  $phu = $doan[2] ?? '';

  // Danh sách máy (đồng bộ đơn thuê từ hợp đồng để biết máy nào đang được thuê)
  if ($phuongThuc === 'GET' && $hanhDong === '') {
    dongBoTatCaDon($db);
    traVe(200, array_map('hienThiMay', $db->query(SQL_MAY . ' ORDER BY m.id')->fetchAll()));
  }

  // Chi tiết 1 máy
  if ($phuongThuc === 'GET' && $maMay) {
    dongBoTatCaDon($db);
    $m = layMay($maMay);
    if (!$m) traVe(404, ['loi' => 'Không tìm thấy máy ảnh.']);
    traVe(200, hienThiMay($m));
  }

  // Admin thêm máy (thông tin + ảnh). Giá được ký ở bước sau (POST /may-anh/{id}/bao-gia).
  if ($phuongThuc === 'POST' && $hanhDong === '') {
    chiAdmin();
    $seri = trim($than['seri'] ?? '');
    if ($seri === '') traVe(400, ['loi' => 'Vui lòng nhập số seri.']);
    $l = $db->prepare('SELECT id FROM may_anh WHERE seri = ?');
    $l->execute([$seri]);
    if ($l->fetch()) traVe(409, ['loi' => 'Số seri này đã có trong hệ thống.']);
    $tt = docThongTinMay($than);
    $anh = luuAnhUpload() ?? $tt['anh_link'];
    $db->prepare('INSERT INTO may_anh (seri, ten, hang, mo_ta, anh, mau, thong_so, phu_hop) VALUES (?,?,?,?,?,?,?,?)')
       ->execute([$seri, $tt['ten'], $tt['hang'], $tt['mo_ta'], $anh, $tt['mau'], $tt['thong_so'], $tt['phu_hop']]);
    traVe(201, hienThiMay(layMay((int)$db->lastInsertId())));
  }

  // Admin lưu báo giá đã ký (giá, cọc, hạn, chữ ký) – API nhờ hợp đồng kiểm tra chữ ký trước khi lưu
  if ($phuongThuc === 'POST' && $maMay && $phu === 'bao-gia') {
    chiAdmin();
    $m = layMay($maMay);
    if (!$m) traVe(404, ['loi' => 'Không tìm thấy máy ảnh.']);
    $gia = (string)($than['giaNgayWei'] ?? '');
    $coc = (string)($than['tienCocWei'] ?? '');
    $hetHan = (int)($than['hetHan'] ?? 0);
    $chuKy = strtolower((string)($than['chuKy'] ?? ''));
    if (!preg_match('/^[1-9]\d{0,40}$/', $gia) || !preg_match('/^[1-9]\d{0,40}$/', $coc)) traVe(400, ['loi' => 'Giá thuê và tiền cọc phải lớn hơn 0.']);
    if ($hetHan < time() + 3600) traVe(400, ['loi' => 'Báo giá đã hết hạn.']);
    if (!preg_match('/^0x[0-9a-f]{130}$/', $chuKy)) traVe(400, ['loi' => 'Chữ ký không hợp lệ.']);
    if (!kiemTraBaoGiaTrenChuoi($maMay, $m['seri'], $gia, $coc, $hetHan, $chuKy)) {
      traVe(400, ['loi' => 'Chữ ký không phải của ví chủ cửa hàng. Hãy chọn đúng ví chủ trong MetaMask rồi ký lại.']);
    }
    $db->prepare('UPDATE may_anh SET gia_ngay_wei = ?, tien_coc_wei = ?, het_han = ?, chu_ky = ? WHERE id = ?')
       ->execute([$gia, $coc, $hetHan, $chuKy, $maMay]);
    traVe(200, hienThiMay(layMay($maMay)));
  }

  // Admin bật / tắt bảo trì (chỉ CSDL)
  if ($phuongThuc === 'POST' && $maMay && $phu === 'bao-tri') {
    chiAdmin();
    $m = layMay($maMay);
    if (!$m) traVe(404, ['loi' => 'Không tìm thấy máy ảnh.']);
    $baoTri = !empty($than['baoTri']);
    if ($baoTri && $m['don_hien_tai']) traVe(409, ['loi' => 'Máy đang có khách thuê, xác nhận trả máy trước.']);
    $db->prepare('UPDATE may_anh SET bao_tri = ? WHERE id = ?')->execute([$baoTri ? 1 : 0, $maMay]);
    traVe(200, hienThiMay(layMay($maMay)));
  }

  // Admin sửa thông tin hiển thị (tên, hãng, mô tả, ảnh, màu, thông số)
  if ($phuongThuc === 'POST' && $maMay && $phu === '') {
    chiAdmin();
    $m = layMay($maMay);
    if (!$m) traVe(404, ['loi' => 'Không tìm thấy máy ảnh.']);
    $tt = docThongTinMay($than);
    $anhMoi = luuAnhUpload();
    if ($anhMoi === null) $anhMoi = !empty($than['xoaAnh']) ? '' : ($tt['anh_link'] !== '' ? $tt['anh_link'] : $m['anh']);
    if ($anhMoi !== $m['anh'] && str_starts_with((string)$m['anh'], 'uploads/')) @unlink(__DIR__ . '/' . $m['anh']); // xóa ảnh cũ
    $db->prepare('UPDATE may_anh SET ten = ?, hang = ?, mo_ta = ?, anh = ?, mau = ?, thong_so = ?, phu_hop = ? WHERE id = ?')
       ->execute([$tt['ten'], $tt['hang'], $tt['mo_ta'], $anhMoi, $tt['mau'], $tt['thong_so'], $tt['phu_hop'], $maMay]);
    traVe(200, hienThiMay(layMay($maMay)));
  }
}

// ======================================================================
// TRA CỨU THEO SERI (công khai, ẩn bớt địa chỉ ví khách)
// ======================================================================
if ($tuyen === 'tra-cuu' && $phuongThuc === 'GET') {
  $l = $db->prepare(SQL_MAY . ' WHERE m.seri = ?');
  $l->execute([trim($_GET['seri'] ?? '')]);
  $m = $l->fetch();
  if (!$m) traVe(404, ['loi' => 'Không tìm thấy máy có số seri này.']);
  $l = $db->prepare(SQL_DON . ' WHERE d.may_id = ? ORDER BY d.id DESC');
  $l->execute([$m['id']]);
  traVe(200, ['may' => hienThiMay($m), 'lichSu' => array_map(fn($d) => hienThiDon($d, true), $l->fetchAll())]);
}

// ======================================================================
// ĐƠN THUÊ CỦA TÔI (khách)
// ======================================================================
if ($tuyen === 'don-thue' && $hanhDong === 'cua-toi' && $phuongThuc === 'GET') {
  $u = layNguoiDung(canDangNhap()['id']);
  // Cập nhật các đơn đang thuê (admin có thể vừa xác nhận trả)
  $l = $db->prepare('SELECT id FROM don_thue WHERE trang_thai = 0 AND (nguoi_dung_id = ? OR vi_khach = ?)');
  $l->execute([$u['id'], (string)$u['dia_chi_vi']]);
  try {
    foreach ($l->fetchAll(PDO::FETCH_COLUMN) as $maDon) dongBoDon($db, $maDon);
  } catch (LoiMangBlockchain $e) {
    // Mất mạng blockchain: trả dữ liệu đang có trong CSDL
  }
  $l = $db->prepare(SQL_DON . ' WHERE d.nguoi_dung_id = ? OR d.vi_khach = ? ORDER BY d.id DESC');
  $l->execute([$u['id'], (string)$u['dia_chi_vi']]);
  traVe(200, array_map('hienThiDon', $l->fetchAll()));
}

// ======================================================================
// GHI NHẬN GIAO DỊCH: web gửi mã hash sau khi giao dịch thành công
//   loai: thue, huy-don (khách) · tra-may (admin)
// ======================================================================
if ($tuyen === 'giao-dich' && $phuongThuc === 'POST') {
  $nd = canDangNhap();
  $u = layNguoiDung($nd['id']);
  $loai = $than['loai'] ?? '';
  $hash = strtolower($than['hash'] ?? '');
  $gd = kiemTraGiaoDich($hash);

  if ($loai === 'thue' || $loai === 'huy-don') {
    if (!$u['dia_chi_vi'] || $gd['tu'] !== $u['dia_chi_vi']) traVe(403, ['loi' => 'Giao dịch không do ví của tài khoản này thực hiện.']);
    $maDon = (int)($than['maDon'] ?? 0);
    $d = dongBoDon($db, $maDon);
    if (!$d || $d['vi_khach'] !== $u['dia_chi_vi']) traVe(400, ['loi' => 'Đơn thuê không khớp với ví của bạn.']);
    $cot = $loai === 'thue' ? 'tx_thue' : 'tx_huy';
    $db->prepare("UPDATE don_thue SET $cot = ?, nguoi_dung_id = ? WHERE id = ?")->execute([$hash, $u['id'], $maDon]);
    $soTien = $loai === 'thue' ? $gd['gia_tri'] : $d['tien_hoan'];
    ghiGiaoDich($db, $hash, $loai, $gd, $u['id'], $d['may_id'], $maDon, $soTien,
      $loai === 'thue' ? "Thuê {$d['so_ngay']} ngày (tiền thuê + cọc)" : 'Hủy đơn, hoàn 100%');
    traVe(200, ['ok' => true]);
  }

  if ($loai === 'tra-may') {
    if ($u['vai_tro'] !== 'admin') traVe(403, ['loi' => 'Chỉ quản trị viên được thực hiện.']);
    $maDon = (int)($than['maDon'] ?? 0);
    $d = dongBoDon($db, $maDon);
    if (!$d || $d['trang_thai'] !== 1) traVe(400, ['loi' => 'Đơn chưa được xác nhận trả trên hợp đồng.']);
    $db->prepare('UPDATE don_thue SET tx_tra = ? WHERE id = ?')->execute([$hash, $maDon]);
    ghiGiaoDich($db, $hash, 'tra-may', $gd, $u['id'], $d['may_id'], $maDon, $d['tien_hoan'],
      "Hoàn cọc {$d['tien_hoan']} ETH; phí trễ {$d['phi_tre']}; hư hỏng {$d['tien_hu_hong']}");
    traVe(200, ['ok' => true]);
  }
  traVe(400, ['loi' => 'Loại giao dịch không hợp lệ.']);
}

// ======================================================================
// QUẢN TRỊ
// ======================================================================
if ($tuyen === 'quan-tri') {
  chiAdmin();

  if ($hanhDong === 'don-thue' && $phuongThuc === 'GET') {
    dongBoTatCaDon($db, true);
    traVe(200, array_map('hienThiDon', $db->query(SQL_DON . ' ORDER BY d.id DESC')->fetchAll()));
  }

  if ($hanhDong === 'khach-hang' && $phuongThuc === 'GET') {
    $ds = $db->query("SELECT * FROM nguoi_dung WHERE vai_tro = 'khach' ORDER BY ngay_tao DESC")->fetchAll();
    traVe(200, array_map('hienThiNguoiDung', $ds));
  }

  if ($hanhDong === 'giao-dich' && $phuongThuc === 'GET') {
    $ds = $db->query("SELECT g.*, n.ho_ten, m.ten AS ten_may FROM giao_dich g
                      LEFT JOIN nguoi_dung n ON n.id = g.nguoi_dung_id LEFT JOIN may_anh m ON m.id = g.may_id
                      ORDER BY g.id DESC LIMIT 500")->fetchAll();
    traVe(200, array_map(fn($g) => [
      'id' => (int)$g['id'], 'hash' => $g['ma_hash'], 'loai' => $g['loai'], 'viGui' => $g['vi_gui'],
      'hoTen' => $g['ho_ten'], 'maMay' => $g['may_id'] ? (int)$g['may_id'] : null, 'tenMay' => $g['ten_may'],
      'maDon' => $g['don_id'] ? (int)$g['don_id'] : null, 'soTien' => (float)$g['so_tien'],
      'soKhoi' => (int)$g['so_khoi'], 'ghiChu' => $g['ghi_chu'], 'thoiGian' => $g['thoi_gian'],
    ], $ds));
  }
}

if ($tuyen === 'suc-khoe') traVe(200, ['ok' => true]);
traVe(404, ['loi' => 'Không tìm thấy API.']);
<?php
// Kết nối MySQL. Lần chạy đầu tiên tự tạo CSDL tkcam và các bảng:
//   nguoi_dung : tài khoản khách + quản trị
//   may_anh    : máy ảnh (tên, hãng, mô tả, ảnh upload, thông số), giá + tiền cọc + BÁO GIÁ ĐÃ KÝ của chủ, bảo trì
//   don_thue   : đơn thuê (bản sao từ hợp đồng) + mã hash giao dịch thuê / trả / hủy
//   giao_dich  : nhật ký giao dịch blockchain (thuê, trả máy, hủy) kèm mã hash
//   he_thong   : địa chỉ hợp đồng đang dùng, phiên bản CSDL, thời điểm đồng bộ
// Thêm máy, đổi giá, bảo trì chỉ ghi CSDL (không tốn gas). Tiền thuê, cọc, hoàn cọc chạy trên smart contract.
require __DIR__ . '/cauhinh.php';

const PHIEN_BAN_CSDL = '3';

function ketNoiCSDL() {
  global $CSDL_MAY_CHU, $CSDL_CONG, $CSDL_NGUOI_DUNG, $CSDL_MAT_KHAU, $CSDL_TEN;
  static $pdo = null;
  if ($pdo) return $pdo;

  try {
    $pdo = new PDO("mysql:host=$CSDL_MAY_CHU;port=$CSDL_CONG;charset=utf8mb4", $CSDL_NGUOI_DUNG, $CSDL_MAT_KHAU, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  } catch (PDOException $e) {
    $ma = $e->errorInfo[1] ?? 0;
    if ($ma == 1045) traVe(503, ['loi' => 'Sai tài khoản/mật khẩu MySQL. Sửa $CSDL_MAT_KHAU trong api/cauhinh.php.']);
    traVe(503, ['loi' => "Không kết nối được MySQL (cổng $CSDL_CONG). Hãy Start MySQL trong XAMPP và kiểm tra cổng trong api/cauhinh.php."]);
  }

  $pdo->exec("SET time_zone = '+07:00'");
  $pdo->exec("CREATE DATABASE IF NOT EXISTS `$CSDL_TEN` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  $pdo->exec("USE `$CSDL_TEN`");
  taoBang($pdo);
  kiemTraDoiHopDong($pdo);
  return $pdo;
}

function taoBang($pdo) {
  $pdo->exec("CREATE TABLE IF NOT EXISTS he_thong (
    khoa VARCHAR(50) NOT NULL,
    gia_tri VARCHAR(255) NOT NULL,
    PRIMARY KEY (khoa)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  // Nâng cấp từ bản CSDL cũ: bảng máy / đơn / giao dịch đổi cấu trúc nên tạo lại (tài khoản giữ nguyên)
  if (layHeThong($pdo, 'phien_ban_csdl') !== PHIEN_BAN_CSDL) {
    $pdo->exec('DROP TABLE IF EXISTS giao_dich, don_thue, may_anh');
    ghiHeThong($pdo, 'phien_ban_csdl', PHIEN_BAN_CSDL);
    $pdo->exec("DELETE FROM he_thong WHERE khoa IN ('dia_chi_hop_dong', 'dong_bo_luc')");
  }

  $pdo->exec("CREATE TABLE IF NOT EXISTS nguoi_dung (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL,
    mat_khau_bam VARCHAR(100) NOT NULL COMMENT 'Mật khẩu băm bcrypt',
    dia_chi_vi CHAR(42) NULL COMMENT 'Ví MetaMask liên kết (chữ thường)',
    vai_tro ENUM('khach','admin') NOT NULL DEFAULT 'khach',
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_nguoi_dung_email (email),
    UNIQUE KEY uq_nguoi_dung_vi (dia_chi_vi)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS may_anh (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Mã máy (cũng là maMay khi thuê trên hợp đồng)',
    seri VARCHAR(50) NOT NULL,
    ten VARCHAR(150) NOT NULL,
    hang VARCHAR(50) NOT NULL DEFAULT '',
    mo_ta TEXT NULL,
    anh VARCHAR(500) NOT NULL DEFAULT '' COMMENT 'Ảnh upload (uploads/...) hoặc link http',
    mau VARCHAR(7) NOT NULL DEFAULT '#2b2b2e',
    thong_so TEXT NULL COMMENT 'JSON {\"Cảm biến\": \"...\"}',
    phu_hop TEXT NULL COMMENT 'JSON [\"Du lịch\", ...]',
    gia_ngay_wei VARCHAR(80) NOT NULL DEFAULT '0' COMMENT 'Giá 1 ngày (wei)',
    tien_coc_wei VARCHAR(80) NOT NULL DEFAULT '0' COMMENT 'Tiền cọc (wei)',
    het_han INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Báo giá dùng được đến (Unix time)',
    chu_ky VARCHAR(140) NULL COMMENT 'Chữ ký báo giá của ví chủ cửa hàng',
    bao_tri TINYINT(1) NOT NULL DEFAULT 0,
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_may_anh_seri (seri)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS don_thue (
    id INT UNSIGNED NOT NULL COMMENT 'Trùng mã đơn trên hợp đồng',
    may_id INT UNSIGNED NOT NULL,
    nguoi_dung_id INT UNSIGNED NULL,
    vi_khach CHAR(42) NOT NULL,
    so_ngay INT NOT NULL,
    gia_ngay DECIMAL(24,18) NOT NULL DEFAULT 0,
    tien_thue DECIMAL(24,18) NOT NULL,
    tien_coc DECIMAL(24,18) NOT NULL,
    bat_dau INT UNSIGNED NOT NULL COMMENT 'Unix time',
    han_tra INT UNSIGNED NOT NULL,
    ngay_tra INT UNSIGNED NOT NULL DEFAULT 0,
    phi_tre DECIMAL(24,18) NOT NULL DEFAULT 0,
    tien_hu_hong DECIMAL(24,18) NOT NULL DEFAULT 0,
    tien_hoan DECIMAL(24,18) NOT NULL DEFAULT 0,
    trang_thai TINYINT NOT NULL DEFAULT 0 COMMENT '0 đang thuê, 1 đã trả, 2 đã hủy',
    tx_thue CHAR(66) NULL,
    tx_tra CHAR(66) NULL,
    tx_huy CHAR(66) NULL,
    ngay_cap_nhat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY k_don_may (may_id),
    KEY k_don_vi (vi_khach),
    KEY k_don_nguoi (nguoi_dung_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  $pdo->exec("CREATE TABLE IF NOT EXISTS giao_dich (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    ma_hash CHAR(66) NOT NULL,
    loai ENUM('thue','tra-may','huy-don') NOT NULL,
    vi_gui CHAR(42) NOT NULL COMMENT 'Ví ký giao dịch',
    nguoi_dung_id INT UNSIGNED NULL,
    may_id INT UNSIGNED NULL,
    don_id INT UNSIGNED NULL,
    so_tien DECIMAL(24,18) NOT NULL DEFAULT 0 COMMENT 'ETH chuyển trong giao dịch',
    so_khoi INT UNSIGNED NOT NULL DEFAULT 0,
    ghi_chu VARCHAR(255) NOT NULL DEFAULT '',
    thoi_gian DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_giao_dich_hash (ma_hash)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

  // Tài khoản quản trị mẫu: admin@tkcam.vn / Admin@123
  if (!$pdo->query("SELECT id FROM nguoi_dung WHERE vai_tro = 'admin' LIMIT 1")->fetch()) {
    $pdo->prepare("INSERT IGNORE INTO nguoi_dung (ho_ten, email, so_dien_thoai, mat_khau_bam, vai_tro) VALUES (?,?,?,?, 'admin')")
        ->execute(['Quản trị TKCam', 'admin@tkcam.vn', '0909000000', password_hash('Admin@123', PASSWORD_BCRYPT)]);
  }

  // 6 máy mẫu (lần đầu chạy)
  if ((int)$pdo->query('SELECT COUNT(*) FROM may_anh')->fetchColumn() === 0) taoMayMau($pdo);
}

function layHeThong($pdo, $khoa) {
  $l = $pdo->prepare('SELECT gia_tri FROM he_thong WHERE khoa = ?');
  $l->execute([$khoa]);
  return $l->fetchColumn() ?: null;
}
function ghiHeThong($pdo, $khoa, $giaTri) {
  $pdo->prepare('INSERT INTO he_thong (khoa, gia_tri) VALUES (?, ?) ON DUPLICATE KEY UPDATE gia_tri = VALUES(gia_tri)')
      ->execute([$khoa, (string)$giaTri]);
}

function taoMayMau($pdo) {
  // [id, seri, tên, hãng, giá/ngày wei, cọc wei, mô tả, màu, thông số, phù hợp, bảo trì]
  $MAU = [
    [1, 'CN-IX285-0001', 'Canon IXUS 285 HS', 'Canon', '100000000000000', '1000000000000000', 'Nhỏ gọn bỏ túi, zoom quang 12x, màu ảnh trong trẻo, hợp đi chơi và du lịch.', '#c9c3b8', ['Cảm biến' => '20.2MP CMOS', 'Zoom' => '12x quang học', 'Màn hình' => '3 inch', 'Pin' => '~250 ảnh'], ['Du lịch', 'Người mới'], 0],
    [2, 'SN-W830-0002', 'Sony Cyber-shot DSC-W830', 'Sony', '80000000000000', '800000000000000', 'Digicam huyền thoại của giới trẻ, ảnh có chất film nhẹ, dễ dùng.', '#2b2b2e', ['Cảm biến' => '20.1MP CCD', 'Zoom' => '8x quang học', 'Màn hình' => '2.7 inch', 'Pin' => '~210 ảnh'], ['Du lịch', 'Người mới'], 0],
    [3, 'CN-G7X2-0003', 'Canon PowerShot G7 X Mark II', 'Canon', '300000000000000', '3000000000000000', 'Cảm biến 1 inch, quay vlog đẹp, chụp thiếu sáng tốt. Lựa chọn của các vlogger.', '#1f1f22', ['Cảm biến' => '20.1MP 1 inch', 'Zoom' => '4.2x quang học', 'Màn hình' => '3 inch lật', 'Pin' => '~265 ảnh'], ['Vlog', 'Chuyên nghiệp'], 0],
    [4, 'FJ-XP140-0004', 'Fujifilm FinePix XP140', 'Fujifilm', '120000000000000', '1200000000000000', 'Chống nước 25m, chống sốc, hợp đi biển và hoạt động ngoài trời.', '#3b8fc4', ['Cảm biến' => '16.4MP CMOS', 'Zoom' => '5x quang học', 'Chống nước' => '25m', 'Pin' => '~240 ảnh'], ['Đi biển', 'Du lịch'], 0],
    [5, 'RC-GR3-0005', 'Ricoh GR III', 'Ricoh', '400000000000000', '4000000000000000', 'Cảm biến APS-C trong thân máy bỏ túi, ống kính 28mm sắc nét cho chụp đường phố.', '#4a4a4d', ['Cảm biến' => '24MP APS-C', 'Ống kính' => '28mm f/2.8', 'Màn hình' => '3 inch cảm ứng', 'Pin' => '~200 ảnh'], ['Đường phố', 'Chuyên nghiệp'], 1],
    [6, 'NK-A10-0006', 'Nikon Coolpix A10', 'Nikon', '70000000000000', '700000000000000', 'Dùng pin AA tiện lợi, giá thuê rẻ, phù hợp người mới chụp.', '#b8323a', ['Cảm biến' => '16.1MP CCD', 'Zoom' => '5x quang học', 'Màn hình' => '2.7 inch', 'Pin' => '2 pin AA'], ['Người mới'], 0],
  ];
  $l = $pdo->prepare('INSERT INTO may_anh (id, seri, ten, hang, gia_ngay_wei, tien_coc_wei, mo_ta, mau, thong_so, phu_hop, bao_tri) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  foreach ($MAU as $m) {
    $m[8] = json_encode($m[8], JSON_UNESCAPED_UNICODE);
    $m[9] = json_encode($m[9], JSON_UNESCAPED_UNICODE);
    $l->execute($m);
  }
  apDungBaoGiaMau($pdo);
}

// Gắn báo giá đã ký sẵn (do script deploy tạo ra trong api/bao-gia-mau.json) cho máy mẫu chưa có báo giá
function apDungBaoGiaMau($pdo) {
  global $DIA_CHI_HOP_DONG;
  $tep = __DIR__ . '/bao-gia-mau.json';
  if (!is_file($tep)) return;
  $duLieu = json_decode(file_get_contents($tep), true);
  if (!$duLieu || strtolower($duLieu['hopDong'] ?? '') !== strtolower($DIA_CHI_HOP_DONG)) return;
  $l = $pdo->prepare("UPDATE may_anh SET gia_ngay_wei = ?, tien_coc_wei = ?, het_han = ?, chu_ky = ?
                      WHERE id = ? AND seri = ? AND (chu_ky IS NULL OR chu_ky = '')");
  foreach ($duLieu['baoGia'] ?? [] as $b) {
    $l->execute([$b['giaNgayWei'], $b['tienCocWei'], (int)$b['hetHan'], $b['chuKy'], (int)$b['id'], $b['seri']]);
  }
}

// Đổi sang hợp đồng mới (deploy lại): đơn + giao dịch cũ thuộc hợp đồng cũ nên xóa;
// báo giá đã ký cho hợp đồng cũ không dùng được nữa nên xóa chữ ký (giữ nguyên thông tin máy).
function kiemTraDoiHopDong($pdo) {
  global $DIA_CHI_HOP_DONG;
  $hienTai = strtolower($DIA_CHI_HOP_DONG);
  if (layHeThong($pdo, 'dia_chi_hop_dong') === $hienTai) return;
  $pdo->exec('DELETE FROM don_thue');
  $pdo->exec('DELETE FROM giao_dich');
  $pdo->exec('UPDATE may_anh SET chu_ky = NULL, het_han = 0');
  ghiHeThong($pdo, 'dia_chi_hop_dong', $hienTai);
  ghiHeThong($pdo, 'dong_bo_luc', 0);
  apDungBaoGiaMau($pdo);
}

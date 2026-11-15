<?php
// Đọc smart contract TKCam qua RPC (không cần ví, không tốn phí) để:
//   - kiểm tra mã hash giao dịch là thật, thành công và gửi tới đúng hợp đồng
//   - kiểm tra chữ ký báo giá của chủ cửa hàng (hàm kiemTraBaoGia trên hợp đồng)
//   - lấy số liệu chính xác của đơn thuê (tiền thuê, cọc, phí trễ, hoàn cọc) rồi lưu vào MySQL

const HAM_GET_RENTAL      = '0x652bd29e'; // getRental(uint256)
const HAM_RENTAL_COUNT    = '0x0a294ab6'; // rentalCount()
const HAM_KIEM_TRA_BAO_GIA = '0xb8cee90c'; // kiemTraBaoGia(uint256,string,uint256,uint256,uint256,bytes)

class LoiMangBlockchain extends RuntimeException {}

// Gửi yêu cầu JSON-RPC (1 yêu cầu hoặc 1 lô), trả về kết quả theo id
function goiRPC(array $loYeuCau) {
  global $RPC_URL;
  $than = json_encode($loYeuCau);
  if (function_exists('curl_init')) {
    $c = curl_init($RPC_URL);
    curl_setopt_array($c, [
      CURLOPT_POST => true, CURLOPT_POSTFIELDS => $than, CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_TIMEOUT => 15,
    ]);
    $phanHoi = curl_exec($c);
    curl_close($c);
  } else {
    $phanHoi = @file_get_contents($RPC_URL, false, stream_context_create(['http' => [
      'method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => $than, 'timeout' => 15,
    ]]));
  }
  $kq = $phanHoi ? json_decode($phanHoi, true) : null;
  if (!is_array($kq)) throw new LoiMangBlockchain('Không kết nối được mạng blockchain (RPC). Kiểm tra Internet và $RPC_URL trong api/cauhinh.php.');
  if (isset($kq['id'])) $kq = [$kq];
  $theoId = [];
  foreach ($kq as $dong) $theoId[$dong['id']] = $dong['result'] ?? null;
  return $theoId;
}

function goiMot($phuongThuc, $thamSo) {
  return goiRPC([['jsonrpc' => '2.0', 'id' => 1, 'method' => $phuongThuc, 'params' => $thamSo]])[1] ?? null;
}

// eth_call 1 hàm đọc của hợp đồng, $thamSo là số nguyên (hoặc không có)
function goiHamDoc($maHam, $thamSo = null) {
  return goiDuLieu($maHam . ($thamSo === null ? '' : str_pad(dechex((int)$thamSo), 64, '0', STR_PAD_LEFT)));
}
function goiDuLieu($data) {
  global $DIA_CHI_HOP_DONG;
  $kq = goiMot('eth_call', [['to' => $DIA_CHI_HOP_DONG, 'data' => $data], 'latest']);
  return $kq ? substr($kq, 2) : '';
}
function oThu($hex, $i) { return substr($hex, 64 * $i, 64); }      // ô 32 byte thứ i
function soNguyen($o) { return hexdec(ltrim($o, '0') ?: '0'); }     // số nhỏ (mã, thời gian, trạng thái)
function diaChi($o) { return '0x' . strtolower(substr($o, 24)); }

// Đổi số wei (hex) sang ETH dạng chuỗi thập phân, không mất độ chính xác
function weiSangEth($hex) {
  $hex = ltrim($hex, '0') ?: '0';
  $so = '0';
  foreach (str_split($hex) as $kyTu) {
    $nho = hexdec($kyTu); $moi = '';
    for ($i = strlen($so) - 1; $i >= 0; $i--) {
      $t = intval($so[$i]) * 16 + $nho; $moi = ($t % 10) . $moi; $nho = intdiv($t, 10);
    }
    while ($nho > 0) { $moi = ($nho % 10) . $moi; $nho = intdiv($nho, 10); }
    $so = ltrim($moi, '0') ?: '0';
  }
  $so = str_pad($so, 19, '0', STR_PAD_LEFT);
  return rtrim(rtrim(substr($so, 0, -18) . '.' . substr($so, -18), '0'), '.');
}

// Số wei dạng thập phân (chuỗi) -> ETH (chuỗi), ví dụ "100000000000000" -> "0.0001"
function weiThapPhanSangEth($dec) {
  $so = str_pad(ltrim((string)$dec, '0') ?: '0', 19, '0', STR_PAD_LEFT);
  return rtrim(rtrim(substr($so, 0, -18) . '.' . substr($so, -18), '0'), '.');
}

// Số thập phân (chuỗi, có thể rất lớn) -> ô 32 byte hex
function thapPhanSangO($dec) {
  $hex = '';
  $so = ltrim((string)$dec, '0') ?: '0';
  while ($so !== '0') {
    $du = 0; $thuong = '';
    foreach (str_split($so) as $c) {
      $t = $du * 10 + (int)$c; $thuong .= intdiv($t, 16); $du = $t % 16;
    }
    $hex = dechex($du) . $hex;
    $so = ltrim($thuong, '0') ?: '0';
  }
  return str_pad($hex ?: '0', 64, '0', STR_PAD_LEFT);
}

// Mã hóa bytes/string động theo chuẩn ABI: độ dài + dữ liệu đệm đủ 32 byte
function maHoaDong($hexDuLieu) {
  $doDai = strlen($hexDuLieu) / 2;
  $dem = (int)ceil($doDai / 32) * 64;
  return str_pad(dechex($doDai), 64, '0', STR_PAD_LEFT) . str_pad($hexDuLieu, $dem, '0', STR_PAD_RIGHT);
}

// Gọi kiemTraBaoGia trên hợp đồng: chữ ký có đúng của ví chủ cửa hàng không
function kiemTraBaoGiaTrenChuoi($maMay, $seri, $giaWei, $cocWei, $hetHan, $chuKy) {
  $seriHex = bin2hex($seri);
  $kyHex = strtolower(substr($chuKy, 2));
  $phanSeri = maHoaDong($seriHex);
  $viTriSeri = 6 * 32;
  $viTriKy = $viTriSeri + strlen($phanSeri) / 2;
  $data = HAM_KIEM_TRA_BAO_GIA
    . str_pad(dechex((int)$maMay), 64, '0', STR_PAD_LEFT)
    . str_pad(dechex($viTriSeri), 64, '0', STR_PAD_LEFT)
    . thapPhanSangO($giaWei) . thapPhanSangO($cocWei)
    . str_pad(dechex((int)$hetHan), 64, '0', STR_PAD_LEFT)
    . str_pad(dechex($viTriKy), 64, '0', STR_PAD_LEFT)
    . $phanSeri . maHoaDong($kyHex);
  $kq = goiDuLieu($data);
  return $kq !== '' && soNguyen(oThu($kq, 0)) === 1;
}

// Đọc chuỗi (string) trong kết quả ABI, $viTri là ô chứa vị trí bắt đầu
function docChuoi($hex, $oViTri) {
  $batDau = soNguyen(oThu($hex, $oViTri)) * 2;
  $doDai = soNguyen(substr($hex, $batDau, 64));
  return hex2bin(substr($hex, $batDau + 64, $doDai * 2)) ?: '';
}

// ---------- Đọc đơn trên hợp đồng ----------
function docDonTrenChuoi($id) {
  $hex = goiHamDoc(HAM_GET_RENTAL, $id);
  if (strlen($hex) < 64 * 14) return null;
  $vi = diaChi(oThu($hex, 1));
  if ($vi === '0x0000000000000000000000000000000000000000') return null;
  return [
    'may_id' => soNguyen(oThu($hex, 0)),
    'vi_khach' => $vi,
    'so_ngay' => soNguyen(oThu($hex, 2)),
    'gia_ngay' => weiSangEth(oThu($hex, 3)),
    'tien_thue' => weiSangEth(oThu($hex, 4)),
    'tien_coc' => weiSangEth(oThu($hex, 5)),
    'bat_dau' => soNguyen(oThu($hex, 6)),
    'han_tra' => soNguyen(oThu($hex, 7)),
    'ngay_tra' => soNguyen(oThu($hex, 8)),
    'phi_tre' => weiSangEth(oThu($hex, 9)),
    'tien_hu_hong' => weiSangEth(oThu($hex, 10)),
    'tien_hoan' => weiSangEth(oThu($hex, 11)),
    'trang_thai' => soNguyen(oThu($hex, 12)),
  ];
}

// Kiểm tra mã hash: giao dịch có thật, thành công, gửi tới hợp đồng TKCam
function kiemTraGiaoDich($hash) {
  global $DIA_CHI_HOP_DONG;
  if (!preg_match('/^0x[0-9a-fA-F]{64}$/', $hash)) traVe(400, ['loi' => 'Mã hash giao dịch không hợp lệ.']);
  $kq = goiRPC([
    ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'eth_getTransactionReceipt', 'params' => [$hash]],
    ['jsonrpc' => '2.0', 'id' => 2, 'method' => 'eth_getTransactionByHash', 'params' => [$hash]],
  ]);
  $bienNhan = $kq[1] ?? null;
  $giaoDich = $kq[2] ?? null;
  if (!$bienNhan || !$giaoDich) traVe(404, ['loi' => 'Chưa tìm thấy giao dịch trên blockchain, thử lại sau vài giây.']);
  if (strtolower($bienNhan['to'] ?? '') !== strtolower($DIA_CHI_HOP_DONG)) traVe(400, ['loi' => 'Giao dịch không gửi tới hợp đồng TKCam.']);
  if (($bienNhan['status'] ?? '') !== '0x1') traVe(400, ['loi' => 'Giao dịch đã thất bại trên blockchain.']);
  return [
    'tu' => strtolower($bienNhan['from']),
    'so_khoi' => hexdec($bienNhan['blockNumber']),
    'gia_tri' => weiSangEth(substr($giaoDich['value'] ?? '0x0', 2)),
  ];
}

// ---------- Đồng bộ CSDL theo hợp đồng ----------

// Cập nhật 1 đơn thuê từ hợp đồng (giữ nguyên mã hash đã lưu)
function dongBoDon(PDO $db, $id) {
  $d = docDonTrenChuoi($id);
  if (!$d) return null;
  $tim = $db->prepare('SELECT id FROM nguoi_dung WHERE dia_chi_vi = ?');
  $tim->execute([$d['vi_khach']]);
  $nguoiDungId = $tim->fetchColumn() ?: null;
  $db->prepare('INSERT INTO don_thue (id, may_id, nguoi_dung_id, vi_khach, so_ngay, gia_ngay, tien_thue, tien_coc, bat_dau, han_tra, ngay_tra, phi_tre, tien_hu_hong, tien_hoan, trang_thai)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE nguoi_dung_id = COALESCE(nguoi_dung_id, VALUES(nguoi_dung_id)), ngay_tra = VALUES(ngay_tra),
                  phi_tre = VALUES(phi_tre), tien_hu_hong = VALUES(tien_hu_hong), tien_hoan = VALUES(tien_hoan), trang_thai = VALUES(trang_thai)')
     ->execute([$id, $d['may_id'], $nguoiDungId, $d['vi_khach'], $d['so_ngay'], $d['gia_ngay'], $d['tien_thue'], $d['tien_coc'],
                $d['bat_dau'], $d['han_tra'], $d['ngay_tra'], $d['phi_tre'], $d['tien_hu_hong'], $d['tien_hoan'], $d['trang_thai']]);
  return $d;
}

// Đồng bộ toàn bộ đơn: thêm đơn còn thiếu, cập nhật đơn đang thuê (đơn đã xong thì không đổi nữa).
// Gọi thường xuyên nên giới hạn tối đa 1 lần mỗi 15 giây (trừ khi $batBuoc).
function dongBoTatCaDon(PDO $db, $batBuoc = false) {
  global $DIA_CHI_HOP_DONG;
  if (preg_match('/^0x0{40}$/i', $DIA_CHI_HOP_DONG)) return; // chưa deploy hợp đồng
  if (!$batBuoc && time() - (int)layHeThong($db, 'dong_bo_luc') < 15) return;
  ghiHeThong($db, 'dong_bo_luc', time());
  try {
    $soDon = soNguyen(goiHamDoc(HAM_RENTAL_COUNT));
    $daXong = array_flip($db->query('SELECT id FROM don_thue WHERE trang_thai <> 0')->fetchAll(PDO::FETCH_COLUMN));
    for ($id = 1; $id <= $soDon; $id++) if (!isset($daXong[$id])) dongBoDon($db, $id);
  } catch (LoiMangBlockchain $e) {
    // Mất mạng blockchain: vẫn trả dữ liệu đang có trong CSDL, lần sau đồng bộ lại
  }
}

<?php
// Token đăng nhập dạng JWT (HS256), hạn 7 ngày
function b64url($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

function taoToken($u) {
  global $KHOA_BI_MAT;
  $dau = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
  $than = b64url(json_encode(['id' => (int)$u['id'], 'vaiTro' => $u['vai_tro'], 'exp' => time() + 7 * 86400]));
  $ky = b64url(hash_hmac('sha256', "$dau.$than", $KHOA_BI_MAT, true));
  return "$dau.$than.$ky";
}

// Lấy người đang đăng nhập từ token, không có / hết hạn thì trả lỗi 401
function canDangNhap() {
  global $KHOA_BI_MAT;
  $tieuDe = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if (!$tieuDe && function_exists('getallheaders')) {
    foreach (getallheaders() as $ten => $giaTri) if (strtolower($ten) === 'authorization') $tieuDe = $giaTri;
  }
  $token = str_starts_with($tieuDe, 'Bearer ') ? substr($tieuDe, 7) : ($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');
  if (!$token) traVe(401, ['loi' => 'Bạn cần đăng nhập.']);

  $phan = explode('.', $token);
  if (count($phan) !== 3) traVe(401, ['loi' => 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.']);
  $ky = b64url(hash_hmac('sha256', "$phan[0].$phan[1]", $KHOA_BI_MAT, true));
  $duLieu = json_decode(base64_decode(strtr($phan[1], '-_', '+/')), true);
  if (!hash_equals($ky, $phan[2]) || !$duLieu || ($duLieu['exp'] ?? 0) < time()) {
    traVe(401, ['loi' => 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.']);
  }
  return $duLieu;
}

<?php
// ===================== CẤU HÌNH =====================
// 1) MySQL của XAMPP (giống thông tin đăng nhập phpMyAdmin).
//    Máy Thư: MySQL chạy cổng 3308. XAMPP mặc định: 3306.
$CSDL_MAY_CHU    = '127.0.0.1';
$CSDL_CONG       = 3308;
$CSDL_NGUOI_DUNG = 'root';
$CSDL_MAT_KHAU   = '';        // XAMPP mặc định để trống
$CSDL_TEN        = 'tkcam';   // CSDL tự được tạo nếu chưa có

// 2) Smart contract: API đọc hợp đồng để kiểm tra mã hash giao dịch, chữ ký báo giá và số liệu đơn thuê.
//    Script blockchain/scripts/trienKhai.js tự ghi lại 2 dòng này sau khi deploy.
$DIA_CHI_HOP_DONG = '0x96A819fF1F738943099aA1d64F466EE9f14F5BCd';
$RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

// 3) Chuỗi bí mật để ký token đăng nhập (đổi tùy ý, không đưa ai)
$KHOA_BI_MAT = 'tkcam_doi_chuoi_nay_thanh_chuoi_bi_mat_rieng_cua_ban_2026';

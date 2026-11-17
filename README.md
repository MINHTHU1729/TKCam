# 📷 TKCam – Cho thuê máy ảnh compact, đặt cọc và hoàn cọc tự động bằng Smart Contract

> Đồ án môn **Blockchain** · Website cho thuê máy ảnh compact (digicam) kết hợp **Ethereum Smart Contract** để giữ tiền cọc minh bạch và hoàn cọc tự động.

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?logo=ethereum)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react)
![PHP](https://img.shields.io/badge/PHP-8-777BB4?logo=php)
![MySQL](https://img.shields.io/badge/MySQL-XAMPP-4479A1?logo=mysql)
![MetaMask](https://img.shields.io/badge/Wallet-MetaMask-F6851B?logo=metamask)

---

## 📖 Giới thiệu

**TKCam** là website cho thuê máy ảnh compact dành cho người thích chụp ảnh đi chơi, du lịch, quay vlog nhưng không muốn mua máy. Khách chọn máy, chọn số ngày thuê và thanh toán bằng ví **MetaMask**.

Điểm khác biệt của TKCam là **tiền cọc không nằm trong tay cửa hàng** mà được giữ trong một **smart contract** trên mạng Ethereum. Khi khách trả máy, hợp đồng **tự động** tính phí trễ hạn, trừ phí hư hỏng (nếu có) và **hoàn phần cọc còn lại về ví khách**. Không ai có thể giữ lại tiền cọc trái quy định, và mọi giao dịch đều kiểm tra được công khai trên Etherscan.

### Vấn đề của cho thuê truyền thống
- Khách phải đặt cọc tiền mặt hoặc giấy tờ, lo bị giữ cọc hoặc hoàn chậm.
- Cách tính phí trễ, phí hư hỏng không rõ ràng, dễ tranh cãi.
- Không có lịch sử giao dịch minh bạch để đối chiếu.

### Giải pháp của TKCam
| Vấn đề | TKCam giải quyết |
|---|---|
| Sợ bị giữ cọc | Cọc nằm trong smart contract, **chỉ hợp đồng** mới chuyển tiền theo đúng quy tắc |
| Hoàn cọc chậm | Admin xác nhận trả máy là cọc **về ví khách ngay** trong cùng giao dịch |
| Phí trễ không rõ | Hợp đồng **tự tính** theo công thức công khai, tối đa bằng tiền cọc |
| Tráo máy khi trả | Kiểm tra **số seri** máy khi trả, sai seri thì không hoàn cọc |
| Sửa giá để thuê rẻ | Giá được chủ cửa hàng **ký số**, hợp đồng kiểm tra chữ ký trước khi nhận tiền |
| Không có bằng chứng | Mỗi giao dịch có **mã hash** xem được trên Etherscan |

---

## 👥 Thành viên

| Thành viên | GitHub | Phụ trách |
|---|---|---|
| Đỗ Nguyễn Minh Thư | [MINHTHU1729](https://github.com/MINHTHU1729) | Smart contract, API PHP + MySQL, trang chung, trang người thuê |
| Khang | [Khang1729](https://github.com/Khang1729) | Trang quản trị (admin) |

---

## 🌐 Các trang của website

### Trang dành cho khách

| Trang | Đường dẫn | Nội dung |
|---|---|---|
| **Trang chủ** | `/` | Giới thiệu dịch vụ, máy được thuê nhiều, gợi ý theo nhu cầu (du lịch, vlog, đi biển, đường phố…), bảng giá, quy trình 4 bước, chính sách, câu hỏi thường gặp |
| **Thuê máy** | `/may-anh` | Danh sách máy ảnh có ảnh, giá/ngày, tiền cọc, trạng thái *Sẵn sàng / Đang cho thuê / Bảo trì*; lọc theo hãng, nhu cầu, giá |
| **Chi tiết máy** | `/may-anh/:id` | Ảnh, mô tả, thông số kỹ thuật; chọn số ngày, xem tổng tiền (thuê + cọc) và **đặt thuê bằng MetaMask** |
| **Bảng giá** | `/#bang-gia` | So sánh giá thuê và tiền cọc các máy |
| **Cách thuê** | `/#quy-trinh` | Quy trình thuê 4 bước |
| **Tra cứu** | `/tra-cuu` | Nhập số seri để xem thông tin và lịch sử cho thuê của một máy (ví khách được ẩn bớt) |
| **Hỏi đáp** | `/#cau-hoi` | Câu hỏi thường gặp về đặt cọc, hủy đơn, phí trễ, ví MetaMask |
| **Đăng ký / Đăng nhập** | `/dang-ky`, `/dang-nhap` | Tạo tài khoản bằng họ tên, email, số điện thoại, mật khẩu |
| **Quên mật khẩu** | `/quen-mat-khau` | Đặt lại mật khẩu bằng email + số điện thoại đã đăng ký |
| **Tài khoản của tôi** | `/tai-khoan` | Thông tin cá nhân, ví đã liên kết và số dư, danh sách đơn thuê, tiền được hoàn, mã giao dịch, nút hủy đơn |

### Trang quản trị (chỉ tài khoản admin)

| Trang | Đường dẫn | Nội dung |
|---|---|---|
| **Tổng quan** | `/admin` | Số máy, số đơn, doanh thu, tiền hợp đồng đang giữ; **biểu đồ doanh thu theo ngày** (7/14/30 ngày), **biểu đồ đơn theo trạng thái**, máy được thuê nhiều, đơn sắp/đã quá hạn |
| **Máy ảnh** | `/admin/may-anh` | Tìm kiếm, lọc theo trạng thái và hãng, sắp xếp; bật/tắt bảo trì; sửa máy |
| **Thêm / Sửa máy** | `/admin/them-may`, `/admin/may-anh/:id` | Seri, tên, hãng, mô tả, **tải ảnh** hoặc dán link ảnh, màu, thông số, "phù hợp cho", giá/ngày, tiền cọc → ký báo giá trong MetaMask |
| **Đơn thuê** | `/admin/don-thue` | Tìm kiếm, lọc theo trạng thái và khoảng ngày, xem chi tiết đơn, **xác nhận trả máy** (nhập seri, phí hư hỏng), **xuất Excel** |
| **Khách thuê** | `/admin/khach-thue` | Danh sách khách, tìm kiếm, lọc, sắp xếp, **hồ sơ chi tiết** (liên hệ, ví, thống kê chi tiêu, lịch sử thuê), xuất Excel |
| **Giao dịch** | `/admin/giao-dich` | Nhật ký giao dịch blockchain (thuê, trả, hủy) kèm mã hash và số khối, xuất Excel |

---

## 🔄 Quy trình thuê máy

```
 ① Admin thêm máy + ký báo giá     (MySQL, miễn phí)
                │
 ② Khách đăng ký, kết nối MetaMask
                │
 ③ Khách thuê: gửi tiền thuê + cọc ──────────► Smart contract giữ tiền
                │                                     │
       ┌────────┴─────────┐                           │
       ▼                  ▼                           │
 ④a Hủy trong 1 giờ   ④b Khách mang máy đến trả       │
       │                  │  Admin nhập seri,         │
       │                  │  phí hư hỏng (nếu có)     │
       ▼                  ▼                           ▼
  Hoàn 100%        Hợp đồng tự tính phí trễ, chia tiền:
  về ví khách        • Tiền thuê + phí trễ + hư hỏng → ví cửa hàng
                     • Cọc còn lại                   → ví khách
```

1. **Admin thêm máy**: nhập thông tin và ảnh, lưu vào MySQL; đặt giá/ngày và tiền cọc rồi **ký báo giá** trong MetaMask (chữ ký số, không tốn phí).
2. **Khách đăng ký / đăng nhập** và kết nối ví MetaMask; ví được liên kết với tài khoản.
3. **Khách thuê**: chọn máy, số ngày (1–30), bấm **Đặt thuê ngay**, xác nhận trong MetaMask. Tiền thuê + cọc được gửi vào smart contract. Web gửi **mã hash** giao dịch về máy chủ; máy chủ kiểm tra trên blockchain rồi mới lưu đơn vào MySQL.
4. **Hủy đơn** trong 1 giờ đầu: hợp đồng hoàn lại 100%.
5. **Trả máy**: admin nhập số seri trên máy khách trả và phí hư hỏng (nếu có). Hợp đồng kiểm tra seri, tính phí trễ, chuyển tiền thuê cho cửa hàng và **hoàn cọc cho khách** ngay lập tức.
6. Khách và admin xem lại mọi giao dịch trên web và trên **Etherscan**.

---

## 💰 Cách tính tiền

```
Tiền thuê          = Giá / ngày × Số ngày                  (1 – 30 ngày)
Tổng thanh toán    = Tiền thuê + Tiền cọc                  (+ phí gas của mạng)
Phí trễ            = Số ngày trễ (làm tròn lên) × Giá / ngày  (tối đa = tiền cọc)
Hoàn cọc           = Tiền cọc − Phí trễ − Phí hư hỏng
Cửa hàng nhận      = Tiền thuê + Phí trễ + Phí hư hỏng
```

**Ví dụ** – Sony Cyber-shot DSC-W830: 0.00008 ETH/ngày, cọc 0.0008 ETH, thuê 1 ngày → khách trả **0.00088 ETH**.

| Trường hợp | Khách được hoàn | Cửa hàng nhận |
|---|---|---|
| Trả đúng hạn, máy tốt | 0.0008 (đủ cọc) | 0.00008 |
| Trễ vài giờ (tính 1 ngày) | 0.00072 | 0.00016 |
| Đúng hạn, hư hỏng 0.0003 | 0.0005 | 0.00038 |
| Hủy trong 1 giờ | 0.00088 (100%) | 0 |

---

## 🏗️ Kiến trúc hệ thống

```
 Trình duyệt (React + ethers.js) ──MetaMask──► Ethereum Sepolia
        │                                      └─ Smart contract TKCam: giữ cọc, chia tiền
        │                                                   ▲
        ▼                                                   │ đọc đơn thuê, kiểm tra mã hash
 API PHP (Apache – XAMPP) ──────────────────────────────────┘
        │
        ▼
 MySQL (XAMPP): tài khoản, máy ảnh, ảnh, đơn thuê + mã hash, nhật ký giao dịch
```

**Thiết kế "blockchain giữ tiền – CSDL giữ thông tin":**

| Lưu ở đâu | Dữ liệu | Lý do |
|---|---|---|
| **Blockchain** | Tiền thuê, tiền cọc, hoàn cọc, đơn thuê | Cần minh bạch, tự động, không ai sửa được |
| **MySQL** | Tài khoản, thông tin và ảnh máy, giá + chữ ký báo giá, bảo trì, bản sao đơn thuê, mã hash | Thêm, sửa thường xuyên → **không tốn phí gas** |

Chỉ **3 thao tác có dòng tiền** mới là giao dịch blockchain: **thuê**, **hủy**, **trả máy**.

---

## 📜 Smart Contract

- Mã nguồn: [`blockchain/contracts/TKCam.sol`](blockchain/contracts/TKCam.sol)
- Mạng: **Ethereum Sepolia** (testnet, chainId 11155111)
- Địa chỉ: [`0x96A819fF1F738943099aA1d64F466EE9f14F5BCd`](https://sepolia.etherscan.io/address/0x96A819fF1F738943099aA1d64F466EE9f14F5BCd)

| Hàm | Người gọi | Chức năng |
|---|---|---|
| `rent(...)` | Khách | Thuê máy theo báo giá đã ký; kiểm tra chữ ký, hạn báo giá, máy rảnh, đúng số tiền |
| `cancelRental(id)` | Khách | Hủy trong 1 giờ, hoàn 100% |
| `confirmReturn(id, seri, phiHuHong)` | Chủ cửa hàng | Kiểm tra seri, tính phí trễ, trừ hư hỏng, chia tiền |
| `kiemTraBaoGia(...)`, `bamBaoGia(...)` | Bất kỳ ai | Kiểm tra chữ ký báo giá của chủ cửa hàng |
| `getRental`, `getRentalsOf`, `getRentalsOfCamera`, `donHienTai` | Bất kỳ ai | Xem đơn thuê |

**Sự kiện:** `Rented`, `Returned`, `Cancelled`.

**An toàn:**
- Báo giá ký theo chuẩn EIP-191, gắn với địa chỉ hợp đồng + chainId + mã máy + seri → không dùng lại được ở hợp đồng hoặc máy khác.
- Chặn chữ ký "dễ biến dạng" (malleable signature).
- Cập nhật trạng thái trước khi chuyển tiền để chống tấn công reentrancy.
- Phí trễ và phí hư hỏng không vượt quá tiền cọc.

**Kiểm thử:** 8 test case (Hardhat + Chai) – chữ ký đúng/sai, thuê đúng/sai tiền, sửa giá, báo giá hết hạn, trả đúng hạn, trả trễ, hư hỏng, sai seri, hủy trong/ngoài 1 giờ.

---

## 🗄️ Cơ sở dữ liệu

| Bảng | Nội dung |
|---|---|
| `nguoi_dung` | Họ tên, email, số điện thoại, mật khẩu (bcrypt), ví liên kết, vai trò `khach` / `admin` |
| `may_anh` | Seri, tên, hãng, mô tả, ảnh, màu, thông số, phù hợp cho; giá/ngày + tiền cọc (wei), hạn và **chữ ký báo giá**; bảo trì |
| `don_thue` | Bản sao đơn thuê từ hợp đồng: máy, khách, số ngày, tiền, thời gian, phí trễ, hư hỏng, tiền hoàn, trạng thái, **mã hash thuê / trả / hủy** |
| `giao_dich` | Nhật ký giao dịch blockchain: mã hash, loại, ví gửi, số tiền, số khối |
| `he_thong` | Địa chỉ hợp đồng đang dùng, thời điểm đồng bộ gần nhất |

CSDL được API **tự tạo** ở lần chạy đầu tiên, kèm 6 máy ảnh mẫu và tài khoản quản trị.

---

## 🛠️ Công nghệ sử dụng

| Phần | Công nghệ |
|---|---|
| Smart contract | Solidity 0.8.24, Hardhat 2, Chai |
| Blockchain | Ethereum Sepolia, Etherscan |
| Giao diện | React, Vite, React Router, ethers.js v6, CSS thuần (responsive) |
| Ví | MetaMask |
| Máy chủ | PHP 8 (PDO, JWT tự viết, bcrypt, JSON-RPC tới blockchain) |
| Cơ sở dữ liệu | MySQL / MariaDB (XAMPP, phpMyAdmin) |
| Quản lý mã nguồn | Git, GitHub |

---

## 📁 Cấu trúc thư mục

```
TKCam/
├── api/                        Máy chủ PHP (chép vào C:\xampp\htdocs\tkcam-api)
│   ├── index.php               Các API: tài khoản, máy ảnh, tra cứu, đơn thuê, giao dịch, quản trị
│   ├── csdl.php                Kết nối MySQL, tự tạo CSDL, bảng, dữ liệu mẫu
│   ├── hopdong.php             Đọc smart contract, kiểm tra mã hash giao dịch
│   ├── token.php               Tạo và kiểm tra JWT
│   ├── cauhinh.php             Cấu hình MySQL, địa chỉ hợp đồng, RPC
│   └── bao-gia-mau.json        Chữ ký giá 6 máy mẫu
├── blockchain/
│   ├── contracts/TKCam.sol     Smart contract
│   ├── test/TKCam.test.js      Kiểm thử
│   ├── scripts/trienKhai.js    Deploy lên Sepolia, ký giá máy mẫu
│   └── hardhat.config.js
├── frontend/
│   └── src/
│       ├── trang/              Các trang khách
│       ├── trang/admin/        Các trang quản trị
│       ├── thanhphan/          Thành phần giao diện dùng chung
│       ├── tienich/            Kết nối ví, gọi hợp đồng, gọi API, xuất Excel
│       ├── xuly/               Hook React: tài khoản, ví, đơn thuê, dữ liệu admin
│       ├── hopdong/TKCam.json  Địa chỉ + ABI hợp đồng
│       └── UngDung.jsx         Định tuyến
└── README.md
```

---

## 🚀 Cài đặt và chạy

### Yêu cầu
- [Node.js](https://nodejs.org) LTS, [Git](https://git-scm.com), [XAMPP](https://www.apachefriends.org), [VS Code](https://code.visualstudio.com)
- Tiện ích [MetaMask](https://metamask.io/download) trên Chrome, mạng **Sepolia**
- ETH Sepolia miễn phí: [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

### Các bước

```powershell
# 1. Lấy code và cài thư viện
git clone https://github.com/MINHTHU1729/TKCam.git
cd TKCam
cd blockchain; npm install; cd ..
cd frontend; npm install; cd ..

# 2. Tạo file cấu hình
Copy-Item frontend\.env.example frontend\.env
Copy-Item blockchain\.env.example blockchain\.env

# 3. Bật Apache + MySQL trong XAMPP, rồi chép API vào htdocs
New-Item -ItemType Directory -Force C:\xampp\htdocs\tkcam-api | Out-Null
Copy-Item -Recurse -Force api\* C:\xampp\htdocs\tkcam-api

# 4. Chạy web
cd frontend
npm run dev
```

Mở **http://localhost:5173**.

**`frontend/.env`:**
```
VITE_CONTRACT_ADDRESS=0x96A819fF1F738943099aA1d64F466EE9f14F5BCd
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_API_URL=http://localhost:8181/tkcam-api/index.php
```

**Chỉnh cổng theo XAMPP của máy:**

| | XAMPP 8181 / 3308 | XAMPP mặc định 80 / 3306 |
|---|---|---|
| `api/cauhinh.php` | `$CSDL_CONG = 3308;` | `$CSDL_CONG = 3306;` |
| `frontend/.env` → `VITE_API_URL` | `http://localhost:8181/tkcam-api/index.php` | `http://localhost/tkcam-api/index.php` |

> Nếu PowerShell báo `running scripts is disabled`: chạy `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### Tài khoản dùng thử

| Vai trò | Đăng nhập |
|---|---|
| Quản trị | `admin@tkcam.vn` / `Admin@123` + MetaMask chọn ví chủ cửa hàng |
| Khách | Tự đăng ký trên web + ví MetaMask có ETH Sepolia |

### Kiểm thử smart contract

```powershell
cd blockchain
npx hardhat test        # kết quả: 8 passing
```

---

## ⛽ Về phí gas

Mỗi giao dịch trên Ethereum đều phải trả **phí gas** cho mạng; ai gửi giao dịch thì người đó trả.

| Thao tác | Phí gas |
|---|---|
| Thuê máy, hủy đơn | Khách trả |
| Xác nhận trả máy | Cửa hàng trả |
| Thêm máy, đổi giá, sửa ảnh, bảo trì, đăng ký, đăng nhập | **Miễn phí** (không phải giao dịch) |

Giá thuê trong bản demo đặt rất nhỏ để tiết kiệm ETH test nên đôi khi phí gas lớn hơn tiền thuê. Trên Etherscan, mục **Internal Transactions** của giao dịch trả máy cho thấy hợp đồng vẫn chuyển **đủ tiền thuê cho cửa hàng** và **hoàn đủ cọc cho khách**.

---

## 🔒 Bảo mật

- Khóa riêng ví (`PRIVATE_KEY`) chỉ dùng khi deploy, **không đưa lên GitHub**; các file `.env` nằm trong `.gitignore`.
- Mật khẩu băm bằng **bcrypt**; xác thực API bằng **JWT**; trang quản trị kiểm tra vai trò ở cả web và máy chủ.
- Máy chủ chỉ lưu mã hash sau khi **kiểm tra trên blockchain**: giao dịch thành công, gửi tới đúng hợp đồng, từ đúng ví.
- Ảnh tải lên được kiểm tra định dạng (JPG, PNG, WEBP, GIF) và dung lượng (≤ 3MB).
- Quên mật khẩu giới hạn 5 lần nhập sai / 15 phút.

---

## 🔮 Hướng phát triển

- Triển khai trên mạng **Layer 2** (Base, Arbitrum, Polygon) để phí gas chỉ còn vài trăm đồng.
- **Đặt giữ chỗ miễn phí**, chỉ thanh toán lên blockchain khi chắc chắn thuê.
- Gom nhiều lần trả máy vào **một giao dịch**.
- **Verify** mã nguồn hợp đồng trên Etherscan.
- Thanh toán bằng stablecoin (USDT/USDC) để giá thuê không biến động theo ETH.
- Gửi email/thông báo nhắc hạn trả máy.

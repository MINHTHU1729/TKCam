# TKCam – Hệ thống cho thuê máy ảnh compact với cơ chế đặt cọc và hoàn cọc tự động bằng Smart Contract

Thành viên: Thư (trang chung + người thuê), Khang (admin).

## Cấu trúc
- `frontend/` – web React + ethers.js (kết nối MetaMask, thuê máy, trang quản trị)
- `blockchain/` – smart contract Solidity + Hardhat
- `api/` – API PHP + MySQL (chép vào `C:\xampp\htdocs\tkcam-api`)
- `csdl/tkcam.sql` – cấu trúc CSDL (không bắt buộc import, API tự tạo)

## Dữ liệu lưu ở đâu – khi nào tốn gas
| MySQL (XAMPP) – KHÔNG tốn gas | Blockchain – chỉ khi có giao dịch tiền |
|---|---|
| Tài khoản khách / quản trị (mật khẩu băm bcrypt) | **Thuê máy**: khách trả tiền thuê + cọc vào hợp đồng |
| Máy ảnh: tên, hãng, mô tả, **ảnh upload**, thông số, bảo trì | **Hủy đơn** trong 1 giờ: hoàn 100% |
| Giá + cọc kèm **báo giá đã ký** của ví chủ (ký trong MetaMask, miễn phí) | **Trả máy**: hợp đồng trừ phí trễ / hư hỏng, hoàn cọc |
| Đơn thuê + **mã hash** giao dịch thuê / trả / hủy; nhật ký giao dịch | |

Khi thuê, khách gửi báo giá đã ký lên hợp đồng; hợp đồng kiểm tra chữ ký của ví chủ nên khách không sửa được giá.
Sau mỗi giao dịch, web gửi mã hash về API; API kiểm tra trên blockchain rồi mới lưu vào CSDL.

## Chạy
1. XAMPP: Start **Apache** và **MySQL**.
2. Chép API vào htdocs (PowerShell, đứng ở thư mục TKCam):
   ```
   New-Item -ItemType Directory -Force C:\xampp\htdocs\tkcam-api | Out-Null
   Copy-Item -Recurse -Force api\* C:\xampp\htdocs\tkcam-api
   ```
   Kiểm tra cổng MySQL trong `api/cauhinh.php` (máy Thư: 3308, XAMPP mặc định: 3306).
3. Thử `http://localhost:8181/tkcam-api/index.php/may-anh` (8181 = cổng Apache) → danh sách máy.
4. Web:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Mở http://localhost:5173. Quản trị: `admin@tkcam.vn` / `Admin@123` → tự vào `/admin`.

## Smart contract
```
cd blockchain
npm install
npx hardhat test
npx hardhat run scripts/trienKhai.js --network sepolia   # cần SEPOLIA_RPC_URL, PRIVATE_KEY trong blockchain/.env
```
Script deploy hợp đồng, ký sẵn báo giá cho 6 máy mẫu (`api/bao-gia-mau.json`, không tốn gas) và tự ghi địa chỉ
hợp đồng vào `frontend/.env`, `frontend/src/hopdong/TKCam.json`, `api/cauhinh.php`. Deploy xong chép lại thư mục `api` vào htdocs.

## Lưu ý bảo mật
Không đưa file `.env` lên GitHub (đã chặn bằng `.gitignore`). `blockchain/.env` chứa khóa riêng ví.

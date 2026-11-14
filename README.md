# TKCam – Hệ thống cho thuê máy ảnh compact với cơ chế đặt cọc và hoàn cọc tự động bằng Smart Contract

Thành viên: Thư (trang chung + người thuê), Khang (admin).

## Cấu trúc
- `frontend/` – web React + ethers.js (kết nối MetaMask, lấy địa chỉ, số dư, thuê máy)
- `blockchain/` – smart contract Solidity + Hardhat

Không dùng CSDL:
- Máy ảnh, giá, tiền cọc, trạng thái, đơn thuê, lịch sử, hoàn cọc: nằm trên smart contract.
- Mô tả, thông số, màu máy: file `frontend/src/dulieu/mayanh.json`.
- Tài khoản đăng ký / đăng nhập: lưu trong trình duyệt (localStorage).

## Chạy web
```
cd frontend
npm install
npm run dev
```
Mở http://localhost:5173. MetaMask chọn mạng **Sepolia**.

## Smart contract
```
cd blockchain
npm install
npx hardhat test
npx hardhat run scripts/trienKhai.js --network sepolia        # cần SEPOLIA_RPC_URL, PRIVATE_KEY trong blockchain/.env
$env:MA_MAY=5; $env:BAO_TRI="false"; npx hardhat run scripts/doiTrangThai.js --network sepolia   # bật/tắt bảo trì
```
Hợp đồng đang chạy trên Sepolia: `0x649e571631750725b89314C3B76be0c6dF9126d4`

## Lưu ý bảo mật
Không đưa file `.env` lên GitHub (đã chặn bằng `.gitignore`). `blockchain/.env` chứa khóa riêng ví.

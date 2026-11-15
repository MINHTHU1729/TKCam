// Cấu hình kết nối ghi thẳng trong code (file .env nếu có sẽ được ưu tiên)
import HopDongTKCam from "../hopdong/TKCam.json";

const env = import.meta.env;

// Địa chỉ hợp đồng TKCam đã deploy trên Sepolia
export const DIA_CHI_HOP_DONG = env.VITE_CONTRACT_ADDRESS || HopDongTKCam.address;
export const MA_MANG = Number(env.VITE_CHAIN_ID || HopDongTKCam.chainId || 11155111);
export const TEN_MANG = env.VITE_CHAIN_NAME || "Sepolia";
// Cổng đọc dữ liệu hợp đồng không cần ví (khách chưa cài MetaMask vẫn xem được trạng thái máy)
export const RPC_DOC = env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export const ABI_HOP_DONG = HopDongTKCam.abi;

// Link xem giao dịch trên Etherscan (chỉ có với mạng Sepolia)
export const linkGiaoDich = (hash) => (hash && MA_MANG === 11155111 ? `https://sepolia.etherscan.io/tx/${hash}` : null);

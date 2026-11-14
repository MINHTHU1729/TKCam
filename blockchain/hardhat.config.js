require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

// Khóa riêng hợp lệ = 64 ký tự hex (có hoặc không có 0x ở đầu)
const coKhoaRieng = /^(0x)?[0-9a-fA-F]{64}$/.test(PRIVATE_KEY || "");
if (PRIVATE_KEY && !coKhoaRieng) {
  console.warn(`⚠️  PRIVATE_KEY trong .env không hợp lệ (đang có ${PRIVATE_KEY.length} ký tự, cần 64). Mạng sepolia sẽ không bật.`);
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true },
  },
  networks: {
    // Mạng chạy trên máy: npx hardhat node
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    // Mạng thử Sepolia: chỉ bật khi đã điền SEPOLIA_RPC_URL và PRIVATE_KEY hợp lệ trong .env
    ...(SEPOLIA_RPC_URL && coKhoaRieng
      ? { sepolia: { url: SEPOLIA_RPC_URL, accounts: [PRIVATE_KEY], chainId: 11155111 } }
      : {}),
  },
};

import { useCallback, useEffect, useState } from "react";
import { coMetaMask, ketNoiVi, laySoDu, layMaMang, layMetaMask } from "../tienich/ketnoivi";
import { MA_MANG } from "../tienich/cauhinh";

export function useVi() {
  const [diaChi, setDiaChi] = useState("");
  const [soDu, setSoDu] = useState("");
  const [maMang, setMaMang] = useState(null);
  const [loi, setLoi] = useState("");
  const [dangTai, setDangTai] = useState(false);

  // Cập nhật mạng trước, rồi số dư
  const lamMoi = useCallback(async (dc) => {
    if (!dc) return;
    setLoi("");
    try {
      setMaMang(await layMaMang());
      setSoDu(await laySoDu(dc));
    } catch (e) {
      setSoDu("");
      setLoi("Không lấy được số dư. Hãy kiểm tra ví đang ở đúng mạng thanh toán.");
      console.error(e);
    }
  }, []);

  // Khi bấm nút "Kết nối ví"
  const ketNoi = async () => {
    setLoi("");
    if (!coMetaMask()) {
      setLoi("Trình duyệt chưa cài ví MetaMask. Hãy cài tiện ích MetaMask để thanh toán.");
      return;
    }
    setDangTai(true);
    try {
      const dc = await ketNoiVi();
      setDiaChi(dc);
      await lamMoi(dc);
    } catch (e) {
      const ma = e?.code ?? e?.error?.code ?? e?.info?.error?.code;
      if (ma === 4001 || e?.code === "ACTION_REJECTED") setLoi("Bạn đã từ chối kết nối ví.");
      else if (ma === -32002) setLoi("MetaMask đang chờ bạn xác nhận: bấm biểu tượng con cáo 🦊 trên thanh Chrome.");
      else setLoi(e?.shortMessage || e?.message || "Không kết nối được ví.");
      console.error(e);
    } finally {
      setDangTai(false);
    }
  };

  // Chuyển MetaMask sang đúng mạng trong .env
  const doiMang = async () => {
    try {
      await layMetaMask().request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + MA_MANG.toString(16) }],
      });
    } catch (e) {
      setLoi(e.message);
    }
  };

  // Tự kết nối lại khi tải trang, lắng nghe đổi ví / đổi mạng
  useEffect(() => {
    if (!coMetaMask()) return;

    const vi = layMetaMask();
    vi.request({ method: "eth_accounts" }).then((danhSach) => {
      if (danhSach[0]) {
        setDiaChi(danhSach[0]);
        lamMoi(danhSach[0]);
      }
    });

    const khiDoiVi = (danhSach) => {
      const dc = danhSach[0] || "";
      setDiaChi(dc);
      if (dc) lamMoi(dc);
      else setSoDu("");
    };
    const khiDoiMang = () => window.location.reload();

    vi.on("accountsChanged", khiDoiVi);
    vi.on("chainChanged", khiDoiMang);
    return () => {
      vi.removeListener("accountsChanged", khiDoiVi);
      vi.removeListener("chainChanged", khiDoiMang);
    };
  }, [lamMoi]);

  return {
    diaChi,
    soDu,
    maMang,
    loi,
    dangTai,
    daKetNoi: Boolean(diaChi),
    saiMang: maMang !== null && maMang !== MA_MANG,
    ketNoi,
    doiMang,
    lamMoi: () => lamMoi(diaChi),
  };
}

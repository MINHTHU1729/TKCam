import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Mỗi lần chuyển trang thì cuộn lên đầu; nếu link có #muc thì cuộn tới mục đó
export default function CuonLenDau() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const phanTu = document.getElementById(hash.slice(1));
      if (phanTu) {
        phanTu.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

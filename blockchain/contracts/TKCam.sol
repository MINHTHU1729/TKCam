// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TKCam - Cho thuê máy ảnh compact, đặt cọc và hoàn cọc tự động
contract TKCam {
    // ===== Kiểu dữ liệu =====
    enum TrangThaiMay { SanSang, DangThue, BaoTri }
    enum TrangThaiDon { DangThue, DaTra, DaHuy }

    struct MayAnh {
        string seri;          // số seri máy
        string ten;           // tên máy
        uint256 giaNgay;      // giá thuê 1 ngày (wei)
        uint256 tienCoc;      // tiền cọc (wei)
        TrangThaiMay trangThai;
        bool tonTai;
    }

    struct DonThue {
        uint256 maMay;
        address nguoiThue;
        uint256 soNgay;
        uint256 tienThue;     // wei
        uint256 tienCoc;      // wei
        uint256 batDau;       // thời điểm thuê (giây)
        uint256 hanTra;       // hạn trả (giây)
        uint256 ngayTra;      // thời điểm trả thực tế
        uint256 phiTre;       // wei
        uint256 tienHuHong;   // wei
        uint256 tienHoan;     // tiền cọc hoàn lại (wei)
        TrangThaiDon trangThai;
    }

    // ===== Dữ liệu lưu trên chuỗi =====
    address public owner;                                  // chủ cửa hàng (admin)
    uint256 public cameraCount;                            // số máy đã đăng
    uint256 public rentalCount;                            // số đơn thuê
    mapping(uint256 => MayAnh) private mayAnh;             // mã máy => máy
    mapping(bytes32 => uint256) private maTheoSeri;        // hash(seri) => mã máy
    mapping(uint256 => DonThue) private donThue;           // mã đơn => đơn
    mapping(address => uint256[]) private donCuaNguoi;     // ví => danh sách mã đơn
    mapping(uint256 => uint256[]) private donCuaMay;       // mã máy => danh sách mã đơn
    mapping(uint256 => uint256) public donHienTai;         // mã máy => đơn đang thuê

    // ===== Sự kiện (frontend lắng nghe) =====
    event CameraListed(uint256 indexed id, string serial, uint256 pricePerDay, uint256 deposit);
    event CameraStatusChanged(uint256 indexed id, uint8 status);
    event Rented(uint256 indexed rentalId, uint256 indexed cameraId, address indexed renter, uint256 days_, uint256 total);
    event Returned(uint256 indexed rentalId, uint256 refund, uint256 lateFee, uint256 damage);
    event Cancelled(uint256 indexed rentalId, uint256 refund);

    modifier chiChuCuaHang() {
        require(msg.sender == owner, "Chi chu cua hang duoc thuc hien");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ===================== ADMIN =====================

    /// Đăng máy ảnh mới. Số seri không được trùng.
    function listCamera(string calldata serial, string calldata name, uint256 pricePerDay, uint256 deposit)
        external chiChuCuaHang returns (uint256 id)
    {
        require(bytes(serial).length > 0, "Seri trong");
        require(pricePerDay > 0 && deposit > 0, "Gia va coc phai lon hon 0");
        bytes32 h = keccak256(bytes(serial));
        require(maTheoSeri[h] == 0, "Seri da ton tai");

        id = ++cameraCount;
        mayAnh[id] = MayAnh(serial, name, pricePerDay, deposit, TrangThaiMay.SanSang, true);
        maTheoSeri[h] = id;
        emit CameraListed(id, serial, pricePerDay, deposit);
    }

    /// Đổi giá thuê / tiền cọc (chỉ khi máy không đang cho thuê)
    function updatePrice(uint256 id, uint256 pricePerDay, uint256 deposit) external chiChuCuaHang {
        MayAnh storage m = mayAnh[id];
        require(m.tonTai, "Khong co may");
        require(m.trangThai != TrangThaiMay.DangThue, "May dang cho thue");
        require(pricePerDay > 0 && deposit > 0, "Gia va coc phai lon hon 0");
        m.giaNgay = pricePerDay;
        m.tienCoc = deposit;
    }

    /// Bật / tắt bảo trì
    function setMaintenance(uint256 id, bool on) external chiChuCuaHang {
        MayAnh storage m = mayAnh[id];
        require(m.tonTai, "Khong co may");
        require(m.trangThai != TrangThaiMay.DangThue, "May dang cho thue");
        m.trangThai = on ? TrangThaiMay.BaoTri : TrangThaiMay.SanSang;
        emit CameraStatusChanged(id, uint8(m.trangThai));
    }

    /// Xác nhận trả máy: kiểm tra seri, tự tính phí trễ, trừ hư hỏng, hoàn cọc
    function confirmReturn(uint256 rentalId, string calldata serial, uint256 damageAmount) external chiChuCuaHang {
        DonThue storage d = donThue[rentalId];
        require(d.nguoiThue != address(0), "Khong co don");
        require(d.trangThai == TrangThaiDon.DangThue, "Don khong o trang thai dang thue");
        MayAnh storage m = mayAnh[d.maMay];
        require(keccak256(bytes(serial)) == keccak256(bytes(m.seri)), "Seri khong khop, sai may");

        // Phí trễ: mỗi ngày trễ (làm tròn lên) = 1 ngày giá thuê, tối đa bằng tiền cọc
        uint256 phiTre = 0;
        if (block.timestamp > d.hanTra) {
            uint256 soNgayTre = (block.timestamp - d.hanTra + 1 days - 1) / 1 days;
            phiTre = soNgayTre * m.giaNgay;
            if (phiTre > d.tienCoc) phiTre = d.tienCoc;
        }
        uint256 conLai = d.tienCoc - phiTre;
        uint256 huHong = damageAmount > conLai ? conLai : damageAmount;
        uint256 hoan = conLai - huHong;

        // Cập nhật trạng thái trước khi chuyển tiền (chống reentrancy)
        d.trangThai = TrangThaiDon.DaTra;
        d.ngayTra = block.timestamp;
        d.phiTre = phiTre;
        d.tienHuHong = huHong;
        d.tienHoan = hoan;
        m.trangThai = TrangThaiMay.SanSang;
        donHienTai[d.maMay] = 0;

        _chuyen(owner, d.tienThue + phiTre + huHong);
        _chuyen(d.nguoiThue, hoan);
        emit Returned(rentalId, hoan, phiTre, huHong);
    }

    // ===================== NGƯỜI THUÊ =====================

    /// Thuê máy: gửi đúng (giá × số ngày + tiền cọc)
    function rent(uint256 cameraId, uint256 days_) external payable returns (uint256 rentalId) {
        MayAnh storage m = mayAnh[cameraId];
        require(m.tonTai, "Khong co may");
        require(m.trangThai == TrangThaiMay.SanSang, "May chua san sang");
        require(days_ >= 1 && days_ <= 30, "So ngay tu 1 den 30");
        uint256 tienThue = m.giaNgay * days_;
        require(msg.value == tienThue + m.tienCoc, "So tien gui khong dung");

        rentalId = ++rentalCount;
        donThue[rentalId] = DonThue({
            maMay: cameraId,
            nguoiThue: msg.sender,
            soNgay: days_,
            tienThue: tienThue,
            tienCoc: m.tienCoc,
            batDau: block.timestamp,
            hanTra: block.timestamp + days_ * 1 days,
            ngayTra: 0,
            phiTre: 0,
            tienHuHong: 0,
            tienHoan: 0,
            trangThai: TrangThaiDon.DangThue
        });
        m.trangThai = TrangThaiMay.DangThue;
        donHienTai[cameraId] = rentalId;
        donCuaNguoi[msg.sender].push(rentalId);
        donCuaMay[cameraId].push(rentalId);

        emit Rented(rentalId, cameraId, msg.sender, days_, msg.value);
    }

    /// Hủy đơn trong vòng 1 giờ sau khi thuê: hoàn toàn bộ tiền
    function cancelRental(uint256 rentalId) external {
        DonThue storage d = donThue[rentalId];
        require(d.nguoiThue == msg.sender, "Khong phai don cua ban");
        require(d.trangThai == TrangThaiDon.DangThue, "Don khong the huy");
        require(block.timestamp <= d.batDau + 1 hours, "Qua thoi gian huy (1 gio)");

        uint256 hoan = d.tienThue + d.tienCoc;
        d.trangThai = TrangThaiDon.DaHuy;
        d.ngayTra = block.timestamp;
        d.tienHoan = hoan;
        mayAnh[d.maMay].trangThai = TrangThaiMay.SanSang;
        donHienTai[d.maMay] = 0;

        _chuyen(msg.sender, hoan);
        emit Cancelled(rentalId, hoan);
    }

    // ===================== HÀM XEM (miễn phí) =====================

    function getCamera(uint256 id)
        external view
        returns (string memory serial, string memory name, uint256 pricePerDay, uint256 deposit, uint8 status)
    {
        MayAnh storage m = mayAnh[id];
        require(m.tonTai, "Khong co may");
        return (m.seri, m.ten, m.giaNgay, m.tienCoc, uint8(m.trangThai));
    }

    function getCameraIdBySerial(string calldata serial) external view returns (uint256) {
        return maTheoSeri[keccak256(bytes(serial))];
    }

    function getRental(uint256 id) external view returns (DonThue memory) {
        require(donThue[id].nguoiThue != address(0), "Khong co don");
        return donThue[id];
    }

    function getRentalsOf(address renter) external view returns (uint256[] memory) {
        return donCuaNguoi[renter];
    }

    function getRentalsOfCamera(uint256 cameraId) external view returns (uint256[] memory) {
        return donCuaMay[cameraId];
    }

    // ===================== NỘI BỘ =====================

    function _chuyen(address den, uint256 soTien) private {
        if (soTien == 0) return;
        (bool ok, ) = payable(den).call{value: soTien}("");
        require(ok, "Chuyen tien that bai");
    }
}

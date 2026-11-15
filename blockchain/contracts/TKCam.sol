// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TKCam - Cho thuê máy ảnh compact, đặt cọc và hoàn cọc tự động
/// @notice Danh sách máy, giá, bảo trì lưu trong CSDL (không tốn gas).
///         Chủ cửa hàng KÝ báo giá từng máy bằng MetaMask (ký miễn phí, không phải giao dịch).
///         Khi thuê, khách gửi báo giá đã ký lên hợp đồng; hợp đồng kiểm tra chữ ký của chủ
///         nên khách không sửa được giá / tiền cọc. Chỉ thuê, hủy, trả máy là giao dịch tốn gas.
contract TKCam {
    enum TrangThaiDon { DangThue, DaTra, DaHuy }

    struct DonThue {
        uint256 maMay;        // mã máy trong CSDL
        address nguoiThue;
        uint256 soNgay;
        uint256 giaNgay;      // giá 1 ngày lúc thuê (wei) – dùng tính phí trễ
        uint256 tienThue;     // wei
        uint256 tienCoc;      // wei
        uint256 batDau;       // thời điểm thuê (giây)
        uint256 hanTra;       // hạn trả (giây)
        uint256 ngayTra;      // thời điểm trả / hủy thực tế
        uint256 phiTre;       // wei
        uint256 tienHuHong;   // wei
        uint256 tienHoan;     // tiền hoàn lại cho khách (wei)
        TrangThaiDon trangThai;
        bytes32 bamSeri;      // keccak256(số seri) để kiểm tra khi trả máy
    }

    address public owner;
    uint256 public rentalCount;
    mapping(uint256 => DonThue) private donThue;
    mapping(uint256 => uint256) public donHienTai;          // mã máy => mã đơn đang thuê (0 = rảnh)
    mapping(address => uint256[]) private donCuaNguoi;
    mapping(uint256 => uint256[]) private donCuaMay;

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

    // ===================== BÁO GIÁ CÓ CHỮ KÝ =====================

    /// Mã băm của 1 báo giá. Chủ cửa hàng ký mã này bằng MetaMask (signMessage).
    function bamBaoGia(uint256 maMay, string memory seri, uint256 giaNgay, uint256 tienCoc, uint256 hetHan)
        public view returns (bytes32)
    {
        return keccak256(abi.encode(address(this), block.chainid, maMay, keccak256(bytes(seri)), giaNgay, tienCoc, hetHan));
    }

    /// Kiểm tra báo giá có đúng chữ ký của chủ cửa hàng không
    function kiemTraBaoGia(
        uint256 maMay, string memory seri, uint256 giaNgay, uint256 tienCoc, uint256 hetHan, bytes memory chuKy
    ) public view returns (bool) {
        bytes32 bam = bamBaoGia(maMay, seri, giaNgay, tienCoc, hetHan);
        bytes32 tinNhan = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", bam));
        return _nguoiKy(tinNhan, chuKy) == owner;
    }

    // ===================== NGƯỜI THUÊ =====================

    /// Thuê máy theo báo giá đã ký: gửi đúng (giá × số ngày + tiền cọc)
    function rent(
        uint256 maMay, string calldata seri, uint256 giaNgay, uint256 tienCoc, uint256 hetHan,
        uint256 soNgay, bytes calldata chuKy
    ) external payable returns (uint256 rentalId) {
        require(block.timestamp <= hetHan, "Bao gia het han");
        require(kiemTraBaoGia(maMay, seri, giaNgay, tienCoc, hetHan, chuKy), "Bao gia khong hop le");
        require(giaNgay > 0 && tienCoc > 0, "Gia va coc phai lon hon 0");
        require(donHienTai[maMay] == 0, "May chua san sang");
        require(soNgay >= 1 && soNgay <= 30, "So ngay tu 1 den 30");
        uint256 tienThue = giaNgay * soNgay;
        require(msg.value == tienThue + tienCoc, "So tien gui khong dung");

        rentalId = ++rentalCount;
        donThue[rentalId] = DonThue({
            maMay: maMay,
            nguoiThue: msg.sender,
            soNgay: soNgay,
            giaNgay: giaNgay,
            tienThue: tienThue,
            tienCoc: tienCoc,
            batDau: block.timestamp,
            hanTra: block.timestamp + soNgay * 1 days,
            ngayTra: 0,
            phiTre: 0,
            tienHuHong: 0,
            tienHoan: 0,
            trangThai: TrangThaiDon.DangThue,
            bamSeri: keccak256(bytes(seri))
        });
        donHienTai[maMay] = rentalId;
        donCuaNguoi[msg.sender].push(rentalId);
        donCuaMay[maMay].push(rentalId);

        emit Rented(rentalId, maMay, msg.sender, soNgay, msg.value);
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
        donHienTai[d.maMay] = 0;

        _chuyen(msg.sender, hoan);
        emit Cancelled(rentalId, hoan);
    }

    // ===================== CHỦ CỬA HÀNG =====================

    /// Xác nhận trả máy: kiểm tra seri, tự tính phí trễ, trừ hư hỏng, hoàn cọc
    function confirmReturn(uint256 rentalId, string calldata serial, uint256 damageAmount) external chiChuCuaHang {
        DonThue storage d = donThue[rentalId];
        require(d.nguoiThue != address(0), "Khong co don");
        require(d.trangThai == TrangThaiDon.DangThue, "Don khong o trang thai dang thue");
        require(keccak256(bytes(serial)) == d.bamSeri, "Seri khong khop, sai may");

        // Phí trễ: mỗi ngày trễ (làm tròn lên) = 1 ngày giá thuê, tối đa bằng tiền cọc
        uint256 phiTre = 0;
        if (block.timestamp > d.hanTra) {
            uint256 soNgayTre = (block.timestamp - d.hanTra + 1 days - 1) / 1 days;
            phiTre = soNgayTre * d.giaNgay;
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
        donHienTai[d.maMay] = 0;

        _chuyen(owner, d.tienThue + phiTre + huHong);
        _chuyen(d.nguoiThue, hoan);
        emit Returned(rentalId, hoan, phiTre, huHong);
    }

    // ===================== XEM =====================

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

    /// Lấy địa chỉ người ký từ chữ ký 65 byte (r, s, v)
    function _nguoiKy(bytes32 tinNhan, bytes memory chuKy) private pure returns (address) {
        if (chuKy.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(chuKy, 32))
            s := mload(add(chuKy, 64))
            v := byte(0, mload(add(chuKy, 96)))
        }
        if (v < 27) v += 27;
        // Chặn chữ ký "dễ biến dạng" (s ở nửa trên)
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) return address(0);
        return ecrecover(tinNhan, v, r, s);
    }
}

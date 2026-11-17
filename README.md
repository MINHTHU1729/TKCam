# 📷 TKCam – Hệ thống cho thuê máy ảnh compact với cơ chế đặt cọc và hoàn cọc tự động bằng Smart Contract

> Đồ án môn **Blockchain** · Website cho thuê máy ảnh compact, thanh toán bằng **MetaMask**, tiền cọc được **smart contract** trên Ethereum Sepolia giữ và **hoàn tự động** khi trả máy.

## 👥 Thành viên nhóm

| Họ và tên | MSSV | GitHub | Phụ trách |
|---|---|---|---|
| Đỗ Nguyễn Minh Thư | HTTT2311026 | [MINHTHU1729](https://github.com/MINHTHU1729) | Smart contract, API PHP + MySQL, trang chung, trang người thuê |
| Nguyễn Vũ Khang | HTTT2311024 | [Khang1729](https://github.com/Khang1729) | Trang quản trị (admin) |

---

## 📖 Mô tả website

### Giới thiệu
**TKCam** là website cho thuê máy ảnh compact (digicam) – loại máy nhỏ gọn đang được giới trẻ ưa chuộng để chụp ảnh đi chơi, du lịch, đi biển hay quay vlog. Thay vì bỏ ra vài triệu để mua máy, khách có thể thuê theo ngày với giá rẻ, chọn đúng chiếc máy hợp với nhu cầu.

Khách xem danh sách máy, chọn số ngày thuê và thanh toán bằng ví **MetaMask**. Toàn bộ tiền thuê và tiền cọc được gửi vào một **smart contract** trên mạng **Ethereum Sepolia**, thay vì chuyển trực tiếp cho cửa hàng.

### Vấn đề của cho thuê truyền thống
- Khách phải đặt cọc tiền mặt hoặc giữ giấy tờ tùy thân, lo bị **giữ cọc** hoặc **hoàn chậm**.
- Cách tính **phí trễ, phí hư hỏng** do cửa hàng tự quyết, không rõ ràng, dễ tranh cãi.
- Không có **lịch sử giao dịch minh bạch** để hai bên đối chiếu khi có tranh chấp.

### TKCam giải quyết như thế nào
| Vấn đề | Giải pháp của TKCam |
|---|---|
| Sợ bị giữ cọc | Tiền cọc nằm trong smart contract, **chỉ hợp đồng** mới chuyển tiền theo quy tắc đã lập trình sẵn |
| Hoàn cọc chậm | Admin xác nhận trả máy là cọc **về ví khách ngay** trong cùng một giao dịch |
| Phí trễ không rõ ràng | Hợp đồng **tự tính** theo công thức công khai, phí trễ tối đa bằng tiền cọc |
| Tráo máy khi trả | Hợp đồng kiểm tra **số seri** máy khi trả, sai seri thì không hoàn cọc |
| Sửa giá để thuê rẻ | Giá được chủ cửa hàng **ký số**, hợp đồng kiểm tra chữ ký trước khi nhận tiền |
| Không có bằng chứng | Mỗi giao dịch có **mã hash**, ai cũng xem được trên Etherscan |

### Cách hệ thống hoạt động
```
 ① Admin thêm máy + ký báo giá       → lưu MySQL (miễn phí)
 ② Khách đăng ký, kết nối MetaMask
 ③ Khách thuê: gửi tiền thuê + cọc   → Smart contract giữ tiền
 ④a Khách hủy trong 1 giờ             → Hợp đồng hoàn 100% về ví khách
 ④b Khách trả máy, admin xác nhận     → Hợp đồng tự tính phí trễ, chia tiền:
                                          • Tiền thuê + phí trễ + hư hỏng → ví cửa hàng
                                          • Cọc còn lại                   → ví khách
 ⑤ Mọi giao dịch có mã hash, xem lại trên web và Etherscan
```

### Blockchain giữ tiền – CSDL giữ thông tin
| Lưu ở đâu | Dữ liệu | Lý do |
|---|---|---|
| **Blockchain (Sepolia)** | Tiền thuê, tiền cọc, hoàn cọc, đơn thuê, trạng thái đơn | Cần minh bạch, tự động, không ai sửa được |
| **MySQL** | Tài khoản, thông tin và ảnh máy, giá + chữ ký báo giá, bảo trì, bản sao đơn thuê, mã hash giao dịch | Thêm, sửa thường xuyên → **không tốn phí gas** |

Chỉ **3 thao tác có dòng tiền** mới là giao dịch trên blockchain: **thuê**, **hủy** và **trả máy**. Thêm máy, sửa ảnh, đổi giá, bảo trì, đăng ký, đăng nhập đều **miễn phí**.

### Cách tính tiền
```
Tiền thuê        = Giá / ngày × Số ngày                       (1 – 30 ngày)
Tổng thanh toán  = Tiền thuê + Tiền cọc                       (+ phí gas của mạng)
Phí trễ          = Số ngày trễ (làm tròn lên) × Giá / ngày     (tối đa bằng tiền cọc)
Hoàn cọc         = Tiền cọc − Phí trễ − Phí hư hỏng
Cửa hàng nhận    = Tiền thuê + Phí trễ + Phí hư hỏng
```

**Ví dụ** – Sony Cyber-shot DSC-W830: 0.00008 ETH/ngày, cọc 0.0008 ETH, thuê 1 ngày → khách trả **0.00088 ETH**.

| Trường hợp | Khách được hoàn | Cửa hàng nhận |
|---|---|---|
| Trả đúng hạn, máy tốt | 0.0008 (đủ cọc) | 0.00008 |
| Trễ vài giờ (tính 1 ngày) | 0.00072 | 0.00016 |
| Đúng hạn, hư hỏng 0.0003 | 0.0005 | 0.00038 |
| Hủy trong 1 giờ | 0.00088 (100%) | 0 |

**Smart contract trên Sepolia:** [`0x96A819fF1F738943099aA1d64F466EE9f14F5BCd`](https://sepolia.etherscan.io/address/0x96A819fF1F738943099aA1d64F466EE9f14F5BCd)

---

## ✨ Các chức năng chính

### 🧑 Dành cho khách thuê

**Xem và tìm máy ảnh**
- Trang chủ giới thiệu dịch vụ, máy được thuê nhiều, gợi ý máy theo nhu cầu (du lịch, vlog, đi biển, đường phố, người mới…).
- Trang **Thuê máy** hiển thị danh sách máy có ảnh, giá/ngày, tiền cọc và trạng thái *Sẵn sàng / Đang cho thuê / Bảo trì*.
- Lọc theo **hãng** (Canon, Sony, Fujifilm, Ricoh, Nikon…) và **nhu cầu**, sắp xếp theo giá, chỉ hiện máy đang sẵn sàng.
- Trang **chi tiết máy**: ảnh, mô tả, thông số kỹ thuật (cảm biến, zoom, màn hình, pin…), giá thuê, tiền cọc.
- Các mục **Bảng giá, Cách thuê, Chính sách, Hỏi đáp** giúp khách hiểu quy trình trước khi thuê.

**Tài khoản**
- **Đăng ký** bằng họ tên, email, số điện thoại, mật khẩu.
- **Đăng nhập**; khi bấm đặt thuê mà chưa đăng nhập, web tự chuyển sang trang đăng nhập rồi quay lại máy đang xem.
- **Quên mật khẩu**: đặt lại bằng email + số điện thoại đã đăng ký, khóa 15 phút nếu nhập sai 5 lần.
- **Kết nối ví MetaMask**, liên kết ví với tài khoản, xem số dư ví.

**Thuê máy**
- Chọn số ngày thuê (1–30), web tự tính **tiền thuê, tiền cọc và tổng thanh toán**.
- Bấm **Đặt thuê ngay**, xác nhận giao dịch trong MetaMask; tiền được gửi vào smart contract.
- Web nhận mã đơn và mã giao dịch, máy chuyển sang **Đang cho thuê**.
- Tự nhắc chuyển MetaMask sang mạng Sepolia nếu đang ở mạng khác.

**Hủy đơn và nhận lại cọc**
- **Hủy đơn trong 1 giờ** sau khi thuê: hợp đồng hoàn lại 100% tiền thuê và cọc.
- Khi trả máy, **nhận lại cọc tự động**: hợp đồng trừ phí trễ hoặc hư hỏng (nếu có), phần còn lại về ví ngay.

**Theo dõi**
- Trang **Tài khoản của tôi**: thông tin cá nhân, ví liên kết, danh sách đơn thuê (đang thuê, đã trả, đã hủy), thời gian thuê, hạn trả, tiền thuê, cọc, phí trễ, hư hỏng, số tiền được hoàn.
- Mỗi đơn có **mã giao dịch** thuê / trả / hủy, bấm vào mở trên Etherscan.
- **Tra cứu theo số seri**: xem thông tin máy và lịch sử cho thuê (ví khách được ẩn bớt để bảo vệ quyền riêng tư).

### 🛠️ Dành cho quản trị (admin)

**Tổng quan**
- 4 thẻ số liệu: số máy (sẵn sàng / đang thuê / bảo trì), số đơn (đang thuê / đã trả / đã hủy), **doanh thu**, **tiền hợp đồng đang giữ**.
- **Biểu đồ cột doanh thu theo ngày**, chọn xem 7 / 14 / 30 ngày, rê chuột để xem chi tiết từng ngày.
- **Biểu đồ tròn đơn theo trạng thái**: đang thuê, quá hạn, đã trả, đã hủy.
- **Máy được thuê nhiều** (top 5) và **đơn đang thuê** sắp xếp theo hạn trả, đánh dấu đơn **quá hạn**.

**Quản lý máy ảnh**
- **Thêm máy**: số seri, tên, hãng, mô tả, **tải ảnh từ máy tính** hoặc dán link ảnh, màu thân máy, thông số kỹ thuật, "phù hợp cho", giá/ngày, tiền cọc.
- **Sửa máy**: đổi thông tin, ảnh, giá; xem trước ảnh trước khi lưu.
- **Ký báo giá bằng MetaMask**: giá được ký số (miễn phí, không phải giao dịch); khách không thể sửa giá khi thuê.
- **Bật / tắt bảo trì**, không cho bật khi máy đang có khách thuê.
- Tìm kiếm theo tên, seri, hãng; lọc theo trạng thái (sẵn sàng, đang cho thuê, bảo trì, chưa ký giá) và hãng; sắp xếp theo tên, giá; phân trang.

**Quản lý đơn thuê**
- Tìm kiếm theo mã đơn, tên máy, seri, tên khách, số điện thoại, email, ví.
- Lọc theo trạng thái (đang thuê, **quá hạn**, đã trả, đã hủy) và **khoảng ngày**.
- **Xem chi tiết đơn**: thông tin máy, khách, thời gian, tiền, mã giao dịch.
- **Xác nhận trả máy**: nhập số seri trên máy khách trả, nhập phí hư hỏng; web **ước tính trước** phí trễ và số tiền hoàn cho khách, rồi gửi giao dịch để hợp đồng chia tiền.

**Quản lý khách thuê**
- Danh sách khách kèm số đơn, đơn đang thuê, tổng đã chi, lần thuê gần nhất.
- Tìm kiếm theo tên, email, số điện thoại, ví; lọc khách đang thuê, đã thuê, chưa thuê, chưa liên kết ví; sắp xếp theo mới đăng ký, chi nhiều nhất, nhiều đơn nhất.
- **Hồ sơ chi tiết** dạng khung trượt: email và số điện thoại bấm được, ví đầy đủ kèm nút sao chép và link Etherscan, thống kê (tổng chi, phí trễ, hư hỏng, tiền đã hoàn, cọc đang giữ), lịch sử thuê.

**Nhật ký giao dịch và báo cáo**
- Nhật ký giao dịch blockchain (thuê, trả máy, hủy) kèm người thực hiện, số tiền, số khối, mã hash.
- **Xuất Excel (CSV)** danh sách đơn thuê, khách thuê, giao dịch theo đúng bộ lọc đang chọn.
- Giao diện quản trị riêng (thanh menu bên trái), dùng được trên điện thoại; chỉ tài khoản admin mới vào được.

### 📜 Smart contract
- **`rent`** – nhận tiền thuê + cọc; kiểm tra chữ ký báo giá của chủ cửa hàng, báo giá còn hạn, máy đang rảnh, số ngày hợp lệ và số tiền gửi đúng.
- **`cancelRental`** – cho khách hủy trong 1 giờ và hoàn 100%.
- **`confirmReturn`** – chỉ chủ cửa hàng gọi được; kiểm tra **số seri**, **tự tính phí trễ**, giới hạn phí hư hỏng không vượt quá cọc, **tự chuyển** tiền thuê cho cửa hàng và hoàn cọc cho khách.
- **`getRental`, `getRentalsOf`, `getRentalsOfCamera`, `donHienTai`** – ai cũng xem được thông tin đơn thuê.
- Phát sự kiện `Rented`, `Returned`, `Cancelled` cho mỗi thay đổi.
- **An toàn:** chữ ký báo giá theo chuẩn EIP-191 gắn với hợp đồng + mạng + mã máy + seri (không dùng lại được nơi khác), chặn chữ ký dễ biến dạng, cập nhật trạng thái trước khi chuyển tiền để chống tấn công reentrancy.

### 🔐 Máy chủ (API)
- Đăng ký, đăng nhập bằng **JWT**, mật khẩu băm **bcrypt**, phân quyền khách / admin.
- Quản lý máy ảnh, lưu ảnh tải lên (kiểm tra định dạng JPG, PNG, WEBP, GIF và dung lượng ≤ 3MB).
- **Kiểm tra mã hash trên blockchain** trước khi lưu: giao dịch thành công, gửi tới đúng hợp đồng, từ đúng ví khách → không ai lưu được giao dịch giả.
- **Đồng bộ đơn thuê** từ smart contract vào MySQL để hiển thị nhanh.
- Tự tạo cơ sở dữ liệu, bảng, 6 máy ảnh mẫu và tài khoản quản trị ở lần chạy đầu.

---

## 🛠️ Công nghệ sử dụng

### Blockchain
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Solidity** | 0.8.24 | Ngôn ngữ viết smart contract giữ cọc, tính phí, hoàn cọc |
| **Hardhat** | 2.28 | Biên dịch, chạy mạng thử trên máy, triển khai hợp đồng |
| **Hardhat Toolbox (Mocha + Chai)** | 5.0 | Viết và chạy 8 test case kiểm thử hợp đồng |
| **Ethereum Sepolia** | Testnet (chainId 11155111) | Mạng blockchain chạy hợp đồng, dùng ETH thử nghiệm miễn phí |
| **Etherscan** | – | Tra cứu hợp đồng, giao dịch, chuyển tiền nội bộ |
| **MetaMask** | – | Ví của khách và cửa hàng: kết nối, ký giao dịch, ký báo giá |

### Giao diện (Frontend)
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **React** | 19 | Xây dựng giao diện trang khách và trang quản trị |
| **Vite** | 8 | Chạy và đóng gói ứng dụng React |
| **React Router** | 7 | Điều hướng giữa các trang, tách khu vực khách và quản trị |
| **ethers.js** | 6 | Kết nối MetaMask, gọi smart contract, đọc số dư, ký báo giá |
| **CSS thuần** | – | Thiết kế giao diện, responsive cho điện thoại; biểu đồ vẽ bằng SVG, không dùng thư viện ngoài |

### Máy chủ và cơ sở dữ liệu (Backend)
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **PHP** | 8 | Viết API: tài khoản, máy ảnh, đơn thuê, giao dịch, quản trị |
| **PDO** | – | Kết nối MySQL an toàn (truy vấn có tham số, chống SQL injection) |
| **JWT** | – | Xác thực đăng nhập, phân quyền khách / admin |
| **bcrypt** | – | Băm mật khẩu người dùng |
| **JSON-RPC** | – | API đọc dữ liệu hợp đồng và kiểm tra giao dịch trên Sepolia |
| **MySQL / MariaDB** | XAMPP | Lưu tài khoản, máy ảnh, ảnh, đơn thuê, nhật ký giao dịch |
| **Apache + phpMyAdmin** | XAMPP | Chạy API PHP, quản lý cơ sở dữ liệu |

### Công cụ phát triển
| Công nghệ | Vai trò |
|---|---|
| **Visual Studio Code** | Viết code |
| **Node.js / npm** | Cài thư viện, chạy Hardhat và Vite |
| **Git, GitHub** | Quản lý mã nguồn, làm việc nhóm |

---

## ✅ Kết quả đạt được

**Về chức năng**
- Xây dựng hoàn chỉnh website cho thuê máy ảnh gồm **trang khách** và **trang quản trị**, chạy được trên máy tính và điện thoại.
- Viết và triển khai **smart contract** lên mạng Ethereum Sepolia, xử lý trọn vòng **thuê → hủy / trả máy → hoàn cọc** hoàn toàn tự động.
- Tiền cọc được giữ **minh bạch** trong hợp đồng; phí trễ, phí hư hỏng và số tiền hoàn được tính theo công thức công khai, ai cũng kiểm tra được trên Etherscan.
- Chống gian lận bằng **chữ ký số báo giá** (khách không sửa được giá) và **kiểm tra số seri** khi trả máy (chống tráo máy).
- Trang quản trị có **thống kê, biểu đồ, tìm kiếm, lọc, xuất Excel**, quản lý máy, đơn thuê, khách thuê và nhật ký giao dịch.

**Về kỹ thuật**
- Thiết kế **"blockchain giữ tiền – CSDL giữ thông tin"**: chỉ 3 thao tác có dòng tiền mới lên blockchain, các thao tác quản lý (thêm máy, đổi giá, sửa ảnh, bảo trì) **không tốn phí gas**.
- Máy chủ **kiểm tra mã hash trên blockchain** trước khi lưu, đảm bảo dữ liệu trong CSDL khớp với blockchain.
- Smart contract được kiểm thử bằng **8 test case** (Hardhat), áp dụng các biện pháp an toàn: chống reentrancy, chặn chữ ký dễ biến dạng, giới hạn phí không vượt quá cọc.
- Bảo mật tài khoản bằng **bcrypt + JWT**, phân quyền khách / quản trị; khóa riêng ví không lưu trong mã nguồn.
- Làm việc nhóm qua **Git / GitHub**, phân chia rõ phần việc của từng thành viên.

**Về kiến thức**
- Hiểu cách viết, kiểm thử, triển khai và tương tác với smart contract bằng Solidity, Hardhat, ethers.js, MetaMask.
- Hiểu cơ chế giao dịch, phí gas, chữ ký số, giao dịch nội bộ (internal transaction) trên Ethereum.
- Biết kết hợp blockchain với một hệ thống web truyền thống (React, PHP, MySQL).

---

## ⚠️ Hạn chế

- **Chỉ chạy trên mạng thử nghiệm Sepolia** với ETH thử nghiệm, chưa dùng tiền thật; giá thuê trong bản demo rất nhỏ nên có lúc **phí gas lớn hơn tiền thuê**.
- **Khách vẫn mất phí gas khi hủy đơn**, dù được hoàn 100% tiền thuê và cọc, vì hủy cũng là một giao dịch blockchain.
- **Giá thuê tính bằng ETH** nên giá trị thực thay đổi theo giá ETH trên thị trường.
- **Chỉ có một ví chủ cửa hàng**: hợp đồng chưa hỗ trợ thêm nhiều người quản trị hay chuyển quyền sở hữu; muốn đổi ví chủ phải triển khai lại hợp đồng.
- **Phí hư hỏng do admin tự nhập**, hợp đồng chỉ giới hạn không vượt quá cọc, chưa có cơ chế để khách khiếu nại hoặc bên thứ ba xác nhận.
- **Tiền cọc có thể thấp hơn giá trị máy**: nếu khách không trả máy, cửa hàng chỉ nhận được tối đa số tiền cọc.
- **Việc giao và nhận máy vẫn làm trực tiếp**, hệ thống chỉ quản lý phần tiền và thông tin.
- **Chạy cục bộ bằng XAMPP**, chưa đưa lên máy chủ thật; mỗi máy có CSDL và thư mục ảnh riêng nên dữ liệu không tự đồng bộ giữa các thành viên.
- **Quên mật khẩu** xác minh bằng email + số điện thoại, chưa gửi mã xác nhận qua email hoặc SMS.
- **Mã nguồn hợp đồng chưa được verify** trên Etherscan nên người xem chỉ thấy bytecode.
- Chưa có **thông báo** (email, tin nhắn) nhắc khách sắp đến hạn trả máy.

---

## 🔮 Hướng phát triển

**Giảm chi phí và mở rộng thanh toán**
- Triển khai hợp đồng lên mạng **Layer 2** (Base, Arbitrum, Polygon) để phí gas chỉ còn vài trăm đồng mỗi giao dịch.
- **Đặt giữ chỗ miễn phí** trong một khoảng thời gian, khách chỉ thanh toán lên blockchain khi chắc chắn thuê, hủy giữ chỗ không mất phí.
- Thanh toán bằng **stablecoin** (USDT, USDC) để giá thuê ổn định, không phụ thuộc giá ETH.
- Gom nhiều lần trả máy vào **một giao dịch** để giảm phí gas cho cửa hàng.

**Nâng cấp smart contract**
- Hỗ trợ **nhiều người quản trị** và **chuyển quyền sở hữu** hợp đồng.
- Cơ chế **khiếu nại phí hư hỏng**: khách đồng ý hoặc phản đối, có bên trung gian xác nhận.
- Tính **tiền cọc theo giá trị máy** và cho phép đặt trước theo lịch (chọn ngày nhận máy).
- **Verify mã nguồn** hợp đồng trên Etherscan và kiểm tra bảo mật (audit) trước khi chạy thật.

**Nâng cấp website**
- Triển khai lên **máy chủ thật** (hosting, tên miền, HTTPS) và dùng chung một cơ sở dữ liệu.
- Lưu ảnh máy trên dịch vụ lưu trữ đám mây hoặc **IPFS**.
- Gửi **email / thông báo** xác nhận đơn, nhắc hạn trả máy; đặt lại mật khẩu bằng mã gửi qua email.
- Thêm **đánh giá, bình luận** cho từng máy, chương trình khách hàng thân thiết.
- Làm **ứng dụng di động** và hỗ trợ thêm các ví khác (WalletConnect, Coinbase Wallet).

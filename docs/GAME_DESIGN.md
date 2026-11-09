# THIẾT KẾ GAME — ĐUA HEO / PIG RACING ARENA

## 1. Mục tiêu
Game web multiplayer 2D, với hiệu ứng heo chạy liên tục, 3 vòng đua, bảng thứ hạng trực tiếp và hai chế độ: AUTO (ngẫu nhiên) / CHALLENGE (phản xạ).

## 2. Hệ thống phòng
- Người chơi tạo hoặc tham gia phòng bằng mã; chủ phòng chọn chế độ, quy mô phòng và cấu hình.
- Trạng thái phòng: `WAITING → SELECTING → LOCKED → COUNTDOWN → RACING → SETTLEMENT → FINISHED`.
- Đồng hồ đếm ngược trước khi xuất phát. Trong trận không được đổi heo/chế độ/điểm cược.
- Cho phép theo dõi đua và xem kết quả; quy định riêng cho người mất kết nối.

## 3. Heo và đường đua
- Thuộc tính heo: ID, tên, màu, kiểu thân, phụ kiện, avatar (challenge), chủ sở hữu (nếu có).
- Ngoại hình không tác động đến xác suất thắng hoặc tốc độ.
- Heo chạy liên tục qua 3 vòng. Bảng đua hiển thị tốc độ tương đối, quãng đường, số vòng, thứ hạng và thời gian.
- Đồ họa 2D hoạt hình: chân chạy, bụi, vệt BOOST, hiệu ứng vượt mặt, ảnh chiến thắng.

## 4. Chế độ AUTO

### 4.1. Điều kiện mở trận
- Số người tham gia tối thiểu 2.
- Số heo tham gia = `ceil(số người chơi × 1.5)` (ví dụ: 2→3, 3→5, 5→8, 8→12).
- Mỗi người chọn 1 heo; cho phép nhiều người chọn cùng một heo.
- Cần ít nhất 2 heo **khác nhau** có người chọn. Heo chưa ai chọn vẫn được quyền đua.

### 4.2. Mô phỏng
- Vận tốc cơ bản như nhau cho tất cả heo (ví dụ 3 m/s).
- Mỗi 0,5 giây, server sinh vận tốc mục tiêu theo RNG (ví dụ hệ số 0,7–1,3), nội suy để mượt.
- Dùng cùng phân phối RNG cho mọi heo, không dùng người chọn, điểm cược, quỹ thưởng để ảnh hưởng kết quả.
- Máy chủ lưu ngẫu nhiên/seed và log mô phỏng để kiểm tra; không xác định người thắng trước.
- Kết quả xếp hạng theo tổng thời gian 3 vòng, đo bằng thời điểm vượt vạch đích do server tính.

### 4.3. Phân chia giải mẫu
`quy = số người chơi × điểm đặt mỗi người`.

- Nếu số heo **khác nhau được chọn >= 3**: heo về 1/2/3 lần lượt được 75%/20%/5% quỹ.
- Nếu **chỉ 2 heo khác nhau được chọn**: heo về nhất được 100%; không có giải hạng khác.
- Nhiều người chọn cùng một heo trúng giải: chia đều phần giải của heo đó.
- Heo về hạng được thưởng nhưng không ai chọn: khoản tương ứng không trả cho người chơi.
- Ví dụ 5 người × 50.000 điểm = 250.000 điểm: hạng nhất 187.500, nhì 50.000, ba 12.500. Nếu hạng nhất được 2 người chọn, mỗi người nhận 93.750.
- Để tránh lỗi làm tròn, dùng **số nguyên điểm**, phân chia theo công thức và quy tắc phân phối điểm dư công khai, deterministic.
- Ledger điểm phải idempotent: mỗi trận chỉ quyết toán một lần.

**Điểm cần thống nhất trước khi mở rộng:** Ở trường hợp chỉ có 2 heo được chọn nhưng heo **không ai chọn** về nhất, không ai nhận quỹ; cần xác nhận với chủ dự án rằng đây là quy tắc mong muốn. Những heo không ai chọn vẫn có thể về 1/2/3.

### 4.4. Giới hạn pháp lý
Phiên bản MVP sử dụng điểm ảo không thể đổi thành tiền hoặc hiện vật. Tính năng cược VNĐ, nạp/rút hay thu lợi nhà cái không nằm trong phạm vi triển khai khi chưa xác minh yêu cầu pháp lý và giấy phép.

## 5. Chế độ CHALLENGE

### 5.1. Chuẩn bị
- Mỗi người điều khiển một heo riêng, đặt tên và tải avatar.
- Khuyến nghị từ 2 đến 12 người trong một phòng.
- Mọi heo xuất phát với cùng vận tốc cơ bản, ví dụ 3 m/s.
- Heo **vẫn chạy liên tục** khi đang chờ/nhập câu hỏi.

### 5.2. Hai loại thử thách
**GÕ CHỮ:** Server chọn ngẫu nhiên cùng một chuỗi tiếng Việt hoặc Anh cho cả phòng. Có câu có nghĩa và chuỗi vô nghĩa. Người chơi gõ lại chính xác. Chuẩn hóa ký tự Unicode (NFC); quy định rõ có tính chữ hoa, dấu và khoảng trắng hay không.

**TÍNH TOÁN:** Cùng một phép toán cộng, trừ, nhân, chia cho cả phòng; từ dễ đến khó qua các vòng; ưu tiên phép chia có kết quả nguyên ở mức dễ. So đáp số ở server.

### 5.3. Xếp hạng và BOOST
- Một câu hỏi mở cùng thời điểm cho toàn phòng; ví dụ thời hạn 8 giây.
- Server xác nhận đáp án đúng rồi xếp hạng theo thời gian phản hồi hợp lệ; hạn chế spam và trả lời nhiều lần.
- BOOST mẫu cho 5 người: hạng 1: +2,0 m/s; hạng 2: +1,5; hạng 3: +1,0; hạng 4: +0,5; hạng 5: +0,25; sai/hết giờ: 0.
- BOOST kéo dài ví dụ 3 giây rồi tốc độ về cơ bản. Quãng đường đã có thêm **không bị mất**.
- Công thức trong khoảng boost: `speed = baseSpeed + boostSpeed`; mỗi tick `distance += speed * deltaSeconds`.
- Ví dụ heo đạt +2 m/s trong 3 giây sẽ tiến thêm 6 m so với heo duy trì tốc độ cơ bản.
- Chống cộng dồn BOOST quá lớn: quy định thay thế/giới hạn BOOST, thống nhất trước khi code.
- Kết thúc 3 vòng: heo chạm vạch đích đầu tiên thắng; lưu thời gian và thống kê.

### 5.4. Công bằng và kết nối
- Đồng bộ thời gian bắt đầu câu hỏi; dùng thời gian server và cơ chế chấp nhận sai lệch độ trễ mạng hợp lý.
- Server là nguồn chân lý cho trạng thái, chấm điểm, tăng tốc và thứ hạng.
- Quy định đồng hạng cho câu trả lời trong cùng ngưỡng thời gian nếu cần.
- Chống bot/auto typing/spam; rate limit trả lời, timeout và log bất thường.
- Khi ngắt mạng, vẫn mô phỏng vận tốc cơ bản; quy định thời gian reconnect, tránh tác động người chơi khác.

## 6. UI/UX gợi ý
1. Trang chủ: Chế độ AUTO / CHALLENGE.
2. Lobby: Danh sách người, màu heo, avatar, trạng thái sẵn sàng.
3. Màn AUTO: thẻ heo, chọn và khóa điểm, countdown, đường đua, bảng xếp hạng.
4. Màn CHALLENGE: đường đua phía trên, câu hỏi và ô nhập phía dưới (không che gameplay), hiệu ứng BOOST khi trả lời đúng.
5. Màn kết quả: heo chiến thắng, podium, thời gian từng vòng, tiền/điểm nhận (AUTO), số câu đúng/thời gian phản hồi (CHALLENGE).

## 7. Tiêu chí nghiệm thu MVP
- Phòng nhiều người đồng bộ trạng thái trận.
- Hai chế độ đều vận hành đủ 3 vòng, heo không ngừng chạy lúc trả lời.
- AUTO không ưu ái heo được chọn hay giá trị cược.
- CHALLENGE trả lời đúng nhanh hơn nhận BOOST lớn hơn và vẫn giữ quãng đường đã vượt.
- Kết quả và ledger điểm được tính duy nhất tại server; có thể tái hiện qua log.

> Các thông số tốc độ, thời hạn câu hỏi, chiều dài đường đua, loại hiệu ứng chỉ là cấu hình dự kiến và có thể đổi trong playtest.

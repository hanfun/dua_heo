# Prototype V2 — Đường đua 3 vòng + đặt tên heo

## Chạy thử ngay

Mở [pig-racing-v2.html](../prototype/pig-racing-v2.html) trên GitHub, nhấn **Download raw** rồi mở file bằng Chrome, Edge hoặc Firefox. Đây là **một file HTML độc lập**, không cần Node.js, không cần internet, không cần cài package.

## Luồng sử dụng

1. Khi mở game, màn **Chọn heo của bạn** hiển thị 20 nhân vật, mỗi con có tên, màu và lời giới thiệu.
2. Chọn một nhân vật, nhập **tên riêng 2–18 ký tự**. Có thể thêm avatar PNG/JPEG/WebP dưới 2 MB nếu muốn (avatar chỉ hiển thị trong màn cấu hình).
3. Nhấn **Lưu & sẵn sàng đua**, sau đó chọn **Bắt đầu đua**.
4. Tất cả 8 heo chạy liên tục qua 3 vòng; 7 đối thủ do máy mô phỏng.
5. Chọn thử thách **Gõ chữ**, **Tính toán** hoặc **Trộn câu**.
6. Khi gõ, **từ đúng tô xanh**, **từ sai tô đỏ**, **từ đang gõ còn đúng tô vàng**. Mọi câu có dấu tiếng Việt dùng Unicode NFC.
7. Gõ đầy đủ chính xác tự nộp; bài toán nhập đáp án rồi Enter (hoặc nút Gửi). Hoàn thành đúng càng nhanh, BOOST càng mạnh trong 3 giây.
8. Đường đua, thứ hạng, mini-map, vận tốc và thời gian BOOST được cập nhật trực tiếp.
9. Đến đích xuất hiện kết quả và âm thanh thắng/thua. Có thể **Chơi lại** hoặc **Chọn heo & đặt tên** để đổi nhân vật.

## Tính năng hoàn thành

| Thành phần | Trạng thái |
|---|---|
| UI nông trại hoạt hình, đường đua, bảng thứ hạng, câu hỏi phía dưới | Có trong V2 |
| Danh sách 20 heo có ngoại hình và phụ kiện khác nhau để chọn | Có (vẽ vector đơn giản, chưa phải sprite thành phẩm) |
| Tên riêng hiển thị trên đường đua, sidebar và thông báo kết quả | Có |
| Lưu tên và lựa chọn heo qua localStorage | Có |
| Tùy chọn avatar trong màn chọn heo | Có, chỉ trong phiên trình duyệt, **không upload lên server** |
| 8 heo đua 3 vòng, chạy liên tục khi gõ | Có |
| Gõ chữ đúng tô xanh / sai tô đỏ / đang gõ tô vàng | Có |
| Câu toán và hiệu ứng BOOST theo hạng phản hồi | Có |
| Âm đúng, âm sai, tăng tốc, xuất phát, chiến thắng và thất bại | Có, tổng hợp bằng Web Audio |
| Phòng online và multiplayer Socket.IO | **Chưa** |
| Phaser 3 / React / NestJS production | **Chưa** |
| 20 heo chạy đồng thời | **Chưa** (hiện chỉ chọn 20, hiển thị 8 heo mỗi trận demo) |
| Sprite PNG transparent/atlas đúng concept art | **Chưa**, cần dựng sprite tiếp |
| Điểm đặt cược / chia thưởng / tiền thật | **Chưa triển khai**, MVP thử thách thuần giải trí |

## Quy tắc đặt tên

- 2–18 ký tự sau khi trim khoảng trắng.
- Tên luôn được hiển thị qua `textContent` hoặc Canvas `fillText`; không dựng HTML từ tên người chơi.
- Trong trận, **không đổi tên hoặc ngoại hình**. Có thể đổi sau khi kết thúc/trước khi đua.
- Lưu `{id, name}` vào localStorage với key `pigRaceProfileV2`.
- Phần tên và avatar sẽ cần kiểm duyệt, giới hạn/đồng bộ phía server ở bản multiplayer.

## Sự tương đồng với concept art

Bản demo dựa trên [mô tả đường đua và âm thanh](TRACK_UX_SOUND.md): logo bảng hiệu vàng, nông trại màu sắc, heo vui nhộn, đường chạy có vạch, bảng điểm bên phải, panel gõ chữ tím ở dưới, hiệu ứng BOOST vàng và âm vui. **Đây là code thử nghiệm chức năng, chưa phải bản dựng 1:1 của ảnh minh họa.** Để đạt chất lượng hình ảnh final, cần tách bộ 20 heo thành sprite atlas và bổ sung các đối tượng khán đài, đích, cờ, particles, ánh sáng trong Phaser.

## Kiểm tra cơ bản

- Kiểm tra JavaScript syntax khi commit.
- Smoke test bằng DOM và Canvas giả lập: boot, tạo 20 lựa chọn, lưu tên, khởi động 8 heo, xử lý câu đúng, tạo BOOST và cập nhật tiến trình.
- Cần kiểm thử thủ công thêm trên Chrome/Edge/Firefox, đặc biệt gõ tiếng Việt qua Telex/VNI, bố cục màn hình điện thoại và chính sách phát âm thanh.

## Bước tiếp theo

Sau khi duyệt giao diện V2, di chuyển code thành React + Phaser 3 + TypeScript, dựng bộ sprite hoàn chỉnh, rồi kết nối server NestJS và Socket.IO để quyết định vận tốc/xếp hạng/đáp án công bằng trong chế độ online.

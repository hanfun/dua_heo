# THIẾT KẾ ĐƯỜNG ĐUA, HIỆU ỨNG & ÂM THANH

## 1. Nguyên mẫu chạy được

File: [prototype/challenge-race.html](../prototype/challenge-race.html)

**Cách dùng:** Tải riêng file HTML từ GitHub (nút Raw hoặc Download), mở bằng trình duyệt Chrome/Edge/Firefox. Nhấn **BẮT ĐẦU ĐUA**; chọn Gõ chữ / Tính toán / Trộn. Không cần cài Node.js hoặc tải asset khác.

Đây là nguyên mẫu **Canvas 2D + JavaScript thuần để kiểm chứng trải nghiệm**, không phải kiến trúc sản phẩm cuối. Bản production sẽ port logic trình diễn sang **React + Phaser 3 + TypeScript**, với **NestJS + Socket.IO** làm server authoritative.

### Phạm vi prototype

- 6 heo hoạt hình vector, kiểu dáng khác nhau (béo, ốm, cơ bắp, sọc, cầu vồng, ninja).
- Đường đua nông trại 6 làn, **3 vòng** liên tục; vạch 1/3, 2/3 và đích.
- Heo **luôn di chuyển**, kể cả khi người chơi gõ chữ.
- Chân heo vung nhịp, thân nảy lên xuống, bụi phía sau; khi BOOST có vệt tốc độ.
- Bảng thứ hạng cập nhật liên tục theo khoảng cách thực.
- Câu tiếng Việt/Anh hoặc phép tính; hiển thị phản hồi **theo từng từ**:
  - **Xanh:** từ đã gõ đầy đủ và khớp chính xác với đề.
  - **Đỏ:** từ nhập có ký tự sai; có thể sửa bằng Backspace.
  - **Vàng:** từ đang nhập và phần đã nhập còn đúng.
  - **Trắng/xám:** từ chưa nhập.
- Gõ đúng đủ câu sẽ tự gửi; bài toán gửi bằng Enter hoặc nút Gửi.
- Chấm thời gian và BOOST trong 3 giây; đối thủ hiện dùng thời gian trả lời giả lập.
- Web Audio tự phát âm đúng, sai, BOOST, xuất phát, thắng và thua. Có nút bật/tắt.

## 2. Bố cục cho game chính thức

**Desktop:**
- **Header (7–10% chiều cao):** logo, mode, vòng, đồng hồ, cài đặt âm thanh.
- **Đường đua (55–60%):** các làn đua, heo, tên, chênh lệch khoảng cách, vệt boost, cột mốc.
- **Sidebar (20–25% chiều ngang):** bảng thứ hạng và khoảng cách so với heo dẫn đầu.
- **Panel câu hỏi (25–30% chiều cao):** câu cần gõ/toán, ô nhập, đồng hồ trả lời, thông báo BOOST.

**Mobile:** sidebar thu thành top 3 + nút mở rộng; panel câu hỏi cố định phía dưới; không che đường đua; đảm bảo bàn phím ảo không chiếm chỗ quan sát quan trọng.

**Khi có 20 heo:** không cố hiển thị 20 làn nhỏ cùng lúc trên mobile; dùng camera theo heo của người chơi, hiển thị 5–8 làn lân cận + mini-map và toàn bộ thứ hạng ở panel cuộn. Cho phép xem khán giả/toàn cảnh trên desktop. Camera không bao giờ thay đổi kết quả vật lý.

## 3. Các trạng thái sprite heo game-ready

| State | Chuyển động | Sprite đề xuất |
|---|---|---|
| Idle | Nhún nhẹ, chớp mắt, phe phẩy đuôi | 4–6 frame |
| Run | Chân trước/sau chuyển pha, thân nảy, đuôi lắc | 8–12 frame |
| Boost | Nghiêng người, chân chạy nhanh hơn, vệt tốc độ/bụi sáng | 6–8 frame + particles |
| Celebrate | Heo bật nhảy/vẫy chân, pháo giấy | 8–12 frame |
| Lose | Heo chóng mặt/ngồi phịch xuống, biểu cảm dễ thương | 6–8 frame |

Tài sản đồ họa production nên tách **mỗi heo thành PNG trong suốt hoặc sprite sheet/atlas** (có metadata JSON); cùng anchor ở chân, tỷ lệ vẽ nhất quán; màu và tên riêng trong danh sách dữ liệu 20 heo. Không dùng ảnh roster nhiều heo như một sprite duy nhất.

Khung hình game chạy bằng requestAnimationFrame; vận tốc phải xuất phát từ simulation server, animation chỉ nội suy để mượt. Thử nghiệm 8–12 fps cho sprite và 60 fps cho canvas.

## 4. Luật phản hồi gõ từ

Ví dụ câu:

> Con heo cơ bắp đang bứt tốc về đích!

Nếu người chơi đã gõ `Con heo cơ bax`:
- `Con`, `heo`, `cơ` được tô **xanh**.
- `bắp` được tô **đỏ** (gõ sai `bax`).
- `đang bứt tốc về đích!` giữ trạng thái chưa nhập.

Nên lưu text của đề ở dạng **Unicode NFC** để hỗ trợ tiếng Việt có dấu. Phiên bản đầu yêu cầu **đúng dấu, đúng chữ hoa/thường, đúng dấu câu và khoảng trắng**. Với IME/Telex/VNI phải bỏ qua sự kiện đánh máy đang trong giai đoạn composition; chỉ báo lỗi sau khi composition hoàn tất.

Gợi ý tiến trình tại server:
1. Máy chủ phát chung một câu và timestamp bắt đầu.
2. Người chơi gõ trên thiết bị; UI tô đúng/sai ngay ở máy khách (không phải chờ mạng).
3. Khi đủ câu, gửi nguyên văn + questionId về server.
4. Server chuẩn hóa NFC và kiểm tra toàn bộ câu. Chỉ server mới xét thời gian phản hồi, thứ hạng và BOOST.
5. Mọi heo vẫn di chuyển trong thời gian chờ câu trả lời.

**Nguyên mẫu chỉ làm bước 2–3 ở client**, vì chưa có multiplayer server.

## 5. BOOST và cảm giác chạy

Đề xuất baseline = 13.7 m/s (prototype), BOOST hạng cao hơn được cộng vận tốc trong 3 giây. Hết 3 giây quay về baseline nhưng không kéo lùi vị trí. Vệt sáng và bụi phát nhiều hơn trong thời gian BOOST.

Đối với 20 heo, hiệu ứng cần gọn: chỉ heo được chọn, top 3 và những con vừa vượt mặt có hiệu ứng nổi bật, tránh làm màn hình rối.

## 6. Thiết kế âm thanh

| Sự kiện | Âm sắc đề xuất | Xử lý |
|---|---|---|
| Gõ đúng một từ | `ting` mảnh, cao, 60–90 ms | Rất nhỏ để không mệt tai |
| Gõ sai từ/ký tự | `boing/oink` trầm hài hước, 130–180 ms | Có giới hạn tần suất |
| Hoàn tất câu đúng | Tín hiệu tăng cao độ `whoosh!` | Kèm BOOST và vệt sáng |
| Đếm ngược / xuất phát | 3 tiếng pip + 1 tiếng GO | Đồng bộ mốc server |
| Chiến thắng | Jingle vui 1–2 giây, fanfare | Pháo giấy, podium |
| Thất bại | Chuỗi 3–4 nốt rơi cao độ, vui nhộn | Không bi lụy, cho chơi lại |
| Heo chạy | Bước chân/bụi ngắn theo nhịp | Nên chỉ nghe heo theo dõi hoặc top 3 |

Nguyên mẫu **tự tổng hợp âm** bằng Web Audio API, không cần tải nhạc/asset, và không lấy giai điệu có bản quyền của game khác. Sự kiện phím đúng/sai nên throttle khi tốc độ gõ cao; có nút Mute; chỉ phát âm sau hành động bắt đầu do trình duyệt có chính sách tự động phát.

### Bộ âm thanh có thể tải về dùng cho game

- **Kenney – UI Audio:** https://kenney.nl/assets/ui-audio — khoảng 50 âm UI click/switch, **CC0**.
- **Kenney – Interface Sounds:** https://kenney.nl/assets/interface-sounds — 100 âm UI, click, confirm, error, **CC0**.
- **Kenney – Impact Sounds:** https://kenney.nl/assets/impact-sounds — 130 âm impact/foley, **CC0**.
- **Kenney – Music Jingles:** https://kenney.nl/assets/music-jingles — 85 đoạn nhạc ngắn, tìm cue thắng/thua, **CC0**.
- **OpenGameArt – Victory Fanfare:** https://opengameart.org/content/victory-fanfare — nhạc ngắn **CC0**, nghe và kiểm tra có hợp phong cách heo vui nhộn trước khi dùng.

Trang của Kenney công bố tài sản CC0, dùng trong dự án thương mại mà không bắt buộc ghi công. Khi nhập âm thanh thật, giữ giấy phép trong thư mục asset, kiểm tra license trên từng gói; ưu tiên OGG cho web và có WAV dự phòng nếu cần.

> **Trạng thái asset:** mới cung cấp nguồn và lựa chọn âm thanh, **chưa đưa WAV/OGG bên thứ ba vào repository**. Nguyên mẫu hiện dùng tiếng tự tổng hợp.

## 7. Bước triển khai production

1. Tách 20 heo thành sprite/atlas, dữ liệu tên, skin, animation.
2. Xây dựng scene Phaser: track, lane/camera, pig entities, effect emitter và HUD.
3. Kết nối React text input để tô xanh/đỏ từng từ, làm nổi bật lỗi và chống lỗi IME.
4. Cấu hình Sound Manager với sound cues, mixer nhạc/SFX và mute.
5. Chuyển mô phỏng vị trí, chấm đáp án, xếp hạng, BOOST sang NestJS server, sử dụng Socket.IO snapshots.
6. Load test 20+ heo, hỗ trợ điện thoại, thử nghiệm tốc độ gõ thật.


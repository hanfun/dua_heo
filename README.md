# 🐷 ĐUA HEO — Pig Racing Arena

Game đua heo trực tuyến nhiều người chơi với hai chế độ **Đua may mắn (Auto Racing)** và **Đua thử thách (Challenge Racing)**.

> **Trạng thái:** Giai đoạn 0 — tài liệu định hướng và lựa chọn công nghệ, chưa có code game chạy được.

## Hai chế độ chơi

### 1. Đua may mắn (Auto Racing)

- Tối thiểu 2 người chơi; mỗi người chọn 1 heo; nhiều người được chọn cùng heo.
- Tổng số heo trên đường đua: `Math.ceil(số người chơi × 1.5)`; tối thiểu 2 **heo khác nhau được chọn** mới bắt đầu.
- Tên, màu, ngoại hình của heo được tạo ngẫu nhiên; heo không ai chọn **vẫn chạy và có thể thắng**.
- Máy chủ mô phỏng vận tốc ngẫu nhiên, công bằng, biến động liên tục; không phụ thuộc tiền cược.
- Mỗi trận gồm **3 vòng**, xếp hạng theo tổng thời gian hoàn thành.
- Nếu có ít nhất **3 heo khác nhau được chọn**: quỹ thưởng phân theo hạng nhất/nhì/ba lần lượt **75% / 20% / 5%**.
- Nếu chỉ có **2 heo khác nhau được chọn**: chỉ heo hạng nhất phân bổ **100%** quỹ.
- Nhiều người chọn cùng heo trúng giải: chia đều số thưởng của thứ hạng đó. Heo không ai chọn trúng giải: phần tiền tương ứng không trả thưởng.

**MVP chỉ sử dụng điểm/xu ảo, không quy đổi tiền thật.** Mô hình tiền cược thật phải được đánh giá pháp lý trước khi triển khai.

### 2. Đua thử thách (Challenge Racing)

- Mỗi người chơi tự đặt tên, chọn ngoại hình, tải avatar cho heo riêng.
- Tất cả heo xuất phát cùng vận tốc cơ bản, **vẫn chạy liên tục khi người chơi đang trả lời**.
- Hai loại câu hỏi chung trong phòng: gõ chính xác câu tiếng Việt/Anh; tính cộng, trừ, nhân, chia.
- Người trả lời đúng nhanh nhất nhận **BOOST tốc độ lớn nhất trong vài giây**; thứ hai, ba... nhận BOOST tương ứng.
- Hết BOOST, tốc độ trở lại cơ bản nhưng **khoảng cách đã tạo được vẫn giữ nguyên**; heo về đích đầu tiên sau 3 vòng chiến thắng.

## Ngôn ngữ và công nghệ

| Hạng mục | Đề xuất |
|---|---|
| Ngôn ngữ chính | **TypeScript** cho cả client và server; SQL cho cơ sở dữ liệu |
| UI | React + Vite + Tailwind CSS |
| Game 2D | Phaser 3 |
| Backend | Node.js + NestJS |
| Realtime multiplayer | Socket.IO (WebSocket) |
| Database | PostgreSQL + Prisma |
| Mở rộng | Redis, S3-compatible storage |
| Test | Vitest + Playwright |
| Quản lý mã nguồn | pnpm workspaces, Docker Compose |

**Kiến trúc chính:** Server authoritative — máy chủ xử lý tốc độ, vị trí, xếp hạng, câu trả lời và quỹ điểm. Client chỉ gửi thao tác và dựng hoạt ảnh.

## 🕹️ Xem thử bản đua heo tương tác

- **[Mở mã nguồn demo đua heo](prototype/challenge-race.html)** — file HTML độc lập, tải về và mở bằng trình duyệt, **không cần cài đặt**.
- Có 6 heo hoạt hình chạy liên tục qua 3 vòng, gõ chữ **đúng tô xanh / sai tô đỏ**, phép tính, BOOST và âm thanh vui nhộn tự tạo.
- **[Thiết kế đường đua, hiệu ứng và nguồn âm thanh CC0](docs/TRACK_UX_SOUND.md)**.
- **[Dữ liệu 20 heo (JSON)](assets/pigs/pig-roster.json)** — tên, lời giới thiệu, kiểu thân, màu sắc, họa tiết, phụ kiện và các trạng thái hoạt ảnh.
- Demo là **single-player với 5 đối thủ máy**, chưa phải game online realtime. Kiến trúc chính thức vẫn dùng TypeScript + Phaser + NestJS.

## Tài liệu chi tiết

- [Thiết kế & luật game](docs/GAME_DESIGN.md)
- [Công nghệ & kiến trúc](docs/TECH_STACK.md)
- [Lộ trình phát triển](docs/ROADMAP.md)

## Lộ trình

1. Giai đoạn 0: Chốt ý tưởng, luật, stack công nghệ (**tài liệu hiện tại**).
2. Giai đoạn 1: Tạo monorepo và gameplay đua heo 3 vòng.
3. Giai đoạn 2: Phòng multiplayer & đua may mắn bằng điểm ảo.
4. Giai đoạn 3: Đua thử thách, gõ chữ/toán, BOOST và avatar.
5. Giai đoạn 4: Test, chống gian lận, tối ưu và triển khai.

---
Các con số về tốc độ, số câu hỏi và thời lượng chỉ là mặc định đề xuất, sẽ tinh chỉnh qua playtest.

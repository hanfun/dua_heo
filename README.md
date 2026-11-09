# 🐷 ĐUA HEO — Pig Racing Arena

## 🎮 ĐUA HEO ARCADE — GIAO DIỆN THEO ẢNH THIẾT KẾ

**[▶ CHƠI NGAY TRÊN GITHUB PAGES](https://hanfun.github.io/dua_heo/)**

Bản game hiện tại là phiên bản giao diện mới, bám theo ảnh mẫu nông trại hoạt hình:

- [`index.html`](index.html): trang game chính (chạy ngay trên Pages).
- [`site/style.css`](site/style.css): HUD game arcade 1600×900, logo, header, bảng xếp hạng trái, minimap + khoảng cách phải, bảng gõ chữ màu tím, footer âm thanh.
- [`site/pigs.js`](site/pigs.js): dữ liệu và **20 heo vector riêng**; sáu trạng thái chân chạy cho mỗi heo, ngoại hình béo/ốm/cơ bắp, ninja, vằn vện, cầu vồng...
- [`site/game.js`](site/game.js): đua 3 vòng, game loop, tên heo riêng, avatar tùy chọn, bài gõ tiếng Việt/Anh, phép toán, chữ đúng xanh/chữ sai đỏ, BOOST, âm thanh tổng hợp.
- [`assets/scenes/race-farm.svg`](assets/scenes/race-farm.svg): cảnh nông trại có hàng rào, cờ, khán giả và cổng đích.

**Chạy demo local:** mở `index.html` bằng một static server, ví dụ `python3 -m http.server 8080` tại thư mục repo, sau đó vào `http://localhost:8080`. Vì `index.html` tham chiếu `site/*.js` và `assets/*.svg`, **không mở file HTML qua file://** trong phiên bản mới.

**Giới hạn hiện tại:** đây là demo **single-player + 7 heo bot** trên Canvas, chưa phải multiplayer hoặc Phaser; các nhân vật vector là phong cách gần ảnh thiết kế nhưng **không phải ảnh sprite 3D/chibi giống nguyên mẫu 100%**. Avatar chỉ dùng trên máy người chơi; demo chưa có backend. Giao diện 16:9 đẹp nhất ở màn hình ngang.

**GitHub Pages:** workflow `.github/workflows/pages.yml` đã tự động triển khai thành công ngày 09/11/2026. Nếu có commit mới, đợi job ở [GitHub Actions](https://github.com/hanfun/dua_heo/actions/workflows/pages.yml) xanh rồi làm mới trang.


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

## 🌐 GitHub Pages

**Trang game (sau khi bật Pages):** https://hanfun.github.io/dua_heo/

Repository đã có `index.html` và workflow [`pages.yml`](.github/workflows/pages.yml). **Cần một lần bật Pages thủ công** vì GitHub không tự tạo trang qua `GITHUB_TOKEN` mặc định:

1. Mở [Settings → Pages](https://github.com/hanfun/dua_heo/settings/pages).
2. Ở **Build and deployment → Source**, chọn **GitHub Actions** (không chọn Deploy from a branch).
3. Mở [Actions → Deploy Pig Racing to GitHub Pages](https://github.com/hanfun/dua_heo/actions/workflows/pages.yml), nhấn **Run workflow** trên nhánh `main` (hoặc re-run run bị lỗi).
4. Kiểm tra job xanh và thử mở trang game phía trên.

**Nếu thấy `Get Pages site failed: Not Found`**: bước 2 chưa hoàn thành. Không sửa lỗi này chỉ bằng `enablement: true` khi dùng `GITHUB_TOKEN` mặc định.

## 🐷 Demo thử nghiệm V2 — Đặt tên heo và đua 3 vòng

**[TẢI / MỞ DEMO V2 (HTML)](prototype/pig-racing-v2.html)** · **[Hướng dẫn chạy và giới hạn prototype](docs/PROTOTYPE_V2.md)**

- Chọn **1 trong 20 nhân vật** và **đặt tên riêng** (2–18 ký tự) trước khi đua. Tên lưu bằng localStorage.
- Có avatar tùy chọn, bảng xếp hạng, mini-map, đồng hồ, tên người chơi, tốc độ và BOOST.
- **8 heo chạy liên tục qua 3 vòng** trên đường đua nông trại; gõ đúng từ **xanh**, sai **đỏ**; kèm bài toán, âm thanh vui nhộn, thắng/thua.
- **Demo offline, không cần thư viện hay cài đặt**. Mở file HTML trong Chrome/Edge/Firefox là chạy.
- **Chưa phải multiplayer và chưa đạt chất lượng sprite 1:1 như tranh concept**; bản demo sử dụng Canvas 2D và đối thủ giả lập, dự định chuyển lên Phaser + TypeScript khi xác nhận giao diện.

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

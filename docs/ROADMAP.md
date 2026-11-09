# LỘ TRÌNH PHÁT TRIỂN — ĐUA HEO

**Phương châm:** Chốt luật trước → dựng gameplay chạy được → multiplayer → thử thách → hoàn thiện. Bản thử nghiệm đầu dùng **điểm ảo không quy đổi thành tiền**.

## Giai đoạn 0 — Tài liệu (hiện tại)
- [x] Mô tả Auto Racing và Challenge Racing.
- [x] Đề xuất TypeScript, React, Phaser 3, NestJS, Socket.IO, PostgreSQL.
- [x] Phác thảo nguyên tắc RNG, BOOST, 3 vòng và phân thưởng.
- [ ] Chốt quy tắc điểm dư khi chia thưởng.
- [ ] Chốt trường hợp heo không ai chọn về nhất trong chế độ chỉ có 2 heo được chọn.
- [ ] Chốt độ dài đường đua, thời lượng BOOST, số câu hỏi/1 vòng.

**Bàn giao:** README, GAME_DESIGN, TECH_STACK, ROADMAP.

## Giai đoạn 1 — Khung game và đua 3 vòng
- [ ] Tạo pnpm monorepo `apps/web`, `apps/server`, `packages/shared`, `packages/game-core`.
- [ ] Cài React, Vite, Phaser và NestJS.
- [ ] Dựng nhân vật heo với nhiều màu/kiểu, đường đua và lớp animation.
- [ ] Engine tick server, tính distance/time/lap/finish; snapshot nội suy phía client.
- [ ] Test 3 vòng và xác định thứ hạng chính xác.

**Nghiệm thu:** Demo đua heo 3 vòng chạy trên web, kết quả xác định ở server.

## Giai đoạn 2 — Multiplayer + AUTO
- [ ] Tạo phòng, mời/join bằng mã, host, ready, countdown.
- [ ] Sinh `ceil(players*1.5)` heo và chọn heo, tối thiểu 2 heo được chọn khác nhau.
- [ ] Chạy ngẫu nhiên công bằng, 3 vòng; cập nhật thứ hạng trực tiếp.
- [ ] Dùng điểm ảo, trả theo 75/20/5 hoặc 100% nếu đúng 2 heo được chọn.
- [ ] Tính thưởng nhiều người chọn chung heo, bỏ thưởng heo không người chọn.
- [ ] Ledger điểm ảo và test edge cases.

**Nghiệm thu:** 5 người chơi cùng phòng xem nhất quán một trận và cùng nhận kết quả.

## Giai đoạn 3 — CHALLENGE
- [ ] Tạo heo cá nhân: tên, avatar, màu, ngoại hình.
- [ ] Engine tạo câu gõ tiếng Việt/Anh và phép toán.
- [ ] Chấm đáp án tại server, xếp hạng tốc độ phản hồi.
- [ ] BOOST tốc độ có thời hạn, heo vẫn chạy liên tục khi gõ.
- [ ] HUD phía dưới đường đua; bảng thành tích sau 3 vòng.
- [ ] Xử lý latency, disconnect, spam và nộp đáp án trùng.

**Nghiệm thu:** Người phản hồi đúng nhanh hơn nhận gia tốc lớn hơn; khoảng cách vượt lên không bị mất sau BOOST.

## Giai đoạn 4 — Hoàn thiện và triển khai
- [ ] Mobile responsive, âm thanh, hiệu ứng vượt mặt/cúp.
- [ ] Anti-cheat, rate limiting, audit log, quản trị trận.
- [ ] Vitest, Playwright, load test realtime.
- [ ] Docker Compose, CI và triển khai staging.
- [ ] Tối ưu game loop và băng thông snapshot.

## Quy ước quản lý code
- Tách các tính năng bằng pull request theo một giai đoạn/nghiệp vụ.
- Unit test các quy tắc game trước khi merge.
- Luật cược, phần thưởng và ngẫu nhiên phải được ghi thành test có thể tái hiện.
- Không đưa tính năng cược tiền thật vào MVP nếu chưa có đánh giá pháp lý và điều kiện triển khai.

## Đề xuất bắt đầu lập trình
Bắt đầu từ **Giai đoạn 1**: canvas đường đua, heo di chuyển thật, server tính quãng đường và 3 vòng, sau đó thêm multiplayer. Cách này cho phép xem demo sớm và tái sử dụng engine cho cả hai chế độ.

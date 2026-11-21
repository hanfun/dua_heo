# Bảng điểm chung — máy chủ lưu file JSON

Để có **Top 10 chung giữa nhiều trình duyệt/máy**, chạy bản Node.js thay vì chỉ GitHub Pages.

```bash
node server/server.cjs
```

Mặc định: `http://localhost:8080`. Máy chủ phục vụ game trực tiếp, lưu điểm tại `server/data/scores.json` (không commit lên GitHub). Có thể tùy chỉnh `PORT` và `SCORE_FILE`.

## API

- `GET /api/top10`: danh sách Top 10 tổng điểm.
- `GET /api/scores`: dữ liệu JSON người chơi và lịch sử trận.
- `POST /api/results`: lưu kết quả `{matchId,playerName,pigName,mode,rank,correct,fastest,finishTime}`, tự tính điểm trên server và ghi file bằng thao tác thay thế file an toàn.

Frontend tự dùng API chung khi chạy qua máy chủ Node; trên GitHub Pages, cấu hình `site/config.js` mặc định dùng điểm cục bộ.

**Quan trọng:** Đây là server thử nghiệm, **không phải bảng xếp hạng chống gian lận**: kết quả và thời gian vẫn do game client gửi. Muốn tổ chức giải có thưởng, phải chuyển game engine và chấm đáp án sang server, thêm xác thực, chống bot, kiểm tra phiên thi đấu và kiểm toán dữ liệu.

**GitHub Pages không thể chạy Node.js hoặc ghi trực tiếp vào file trong repository khi người chơi kết thúc.** Để công khai bảng điểm chung cần triển khai máy chủ Node trên hosting hỗ trợ backend, với ổ đĩa bền vững, hoặc dùng cơ sở dữ liệu dịch vụ.

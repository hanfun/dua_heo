# NGÔN NGỮ & KIẾN TRÚC CODE — ĐUA HEO

## 1. Ngôn ngữ chính

**TypeScript** cho toàn bộ ứng dụng web, logic gameplay và máy chủ; **SQL** cho database; HTML/CSS cho giao diện. Chia sẻ các type/schema giữa hai phía giúp hạn chế lỗi đồng bộ.

**Vì sao TypeScript:** React, Phaser, NestJS, Socket.IO đều có hệ sinh thái TypeScript tốt; phù hợp web game 2D realtime; phát triển và bảo trì trong một monorepo đơn giản hơn so với nhiều ngôn ngữ khác nhau.

## 2. Công nghệ đề xuất

| Hạng mục | Công nghệ | Vai trò |
|---|---|---|
| Client | React + Vite + TypeScript | Giao diện lobby, chọn heo, câu hỏi, kết quả |
| Canvas game | Phaser 3 | Nhân vật, đường đua, animation, BOOST |
| CSS | Tailwind CSS | Bố cục responsive |
| Backend | Node.js + NestJS | API, phòng chơi, game service |
| Realtime | Socket.IO | Kết nối, input, snapshot và kết quả |
| Data | PostgreSQL + Prisma | Người dùng, trận đấu, bảng điểm, ledger |
| Cache sau MVP | Redis | Session, phân tán Socket.IO khi scale |
| Ảnh sau MVP | S3-compatible storage | Avatar; kiểm tra loại/dung lượng ảnh |
| Unit tests | Vitest | Physics, RNG, ranking, payout |
| E2E | Playwright | Luồng tham gia phòng và gameplay |
| Monorepo | pnpm workspaces | Shared package, một lệnh dev/test |
| Deploy | Docker Compose | Web, server, Postgres |

## 3. Kiến trúc

```text
BROWSER
  React UI + Phaser 3 canvas
       │  HTTPS / Socket.IO
       ▼
NestJS SERVER (authoritative)
  ├── RoomService / Lobby
  ├── RaceEngine / LapTiming
  ├── RandomSpeedPolicy (AUTO)
  ├── QuestionEngine (CHALLENGE)
  ├── BoostPolicy (CHALLENGE)
  ├── Ranking / VirtualPointSettlement
  └── Audit / Reconnect
       │ Prisma
       ▼
PostgreSQL
[Redis + S3 về sau]
```

### Trạng thái trên server, không nằm ở client

- Server tính `distance`, `speed`, `lap`, `finishTime`, `placement`, BOOST và điểm ảo.
- Client gửi hành động như `selectPig`, `ready`, `submitAnswer`; không cho client tự gửi tốc độ/kết quả.
- Tick mô phỏng gợi ý **20 Hz (50ms/tick)**; broadcast snapshot **10 Hz (100ms)**; Phaser nội suy vị trí giữa snapshot để chạy mượt khoảng 60 fps.
- Dùng đồng hồ monotonic cho khoảng thời gian vật lý; không dùng FPS của máy người chơi làm nguồn chân lý.
- Mỗi phòng chỉ có một server owner chạy mô phỏng; sau này có thể phân phối phòng trên nhiều máy với Redis adapter.

## 4. Cấu trúc thư mục dự kiến

```text
dua_heo/
├── README.md
├── docs/
│   ├── GAME_DESIGN.md
│   ├── TECH_STACK.md
│   └── ROADMAP.md
├── apps/
│   ├── web/               # React, Vite, Phaser
│   └── server/            # NestJS, Socket.IO
├── packages/
│   ├── shared/            # TypeScript types / validation schema
│   └── game-core/         # Physics, RNG, ranking, payout
├── infra/                 # Docker và cấu hình triển khai
├── pnpm-workspace.yaml
└── package.json
```

**Lưu ý:** Cấu trúc code trên mới là thiết kế, chưa triển khai trong giai đoạn tài liệu.

## 5. Những module nên tách riêng

1. **Rooms:** tạo/join/leave, host, ready, reconnect, khóa trận.
2. **PigFactory:** sinh tên và skin; challenge lưu avatar.
3. **RaceEngine:** tick dựa trên delta time; đổi vòng, tính thời gian về đích.
4. **RandomRacePolicy:** thay đổi vận tốc ngẫu nhiên theo cùng phân phối, không xem điểm cược.
5. **QuestionEngine:** sinh câu gõ/toán, thời hạn, xác minh đáp án, chống submit trùng.
6. **BoostPolicy:** cấp tăng vận tốc theo thứ hạng, hết hạn, giới hạn stacking.
7. **RankingService:** xác định vị trí qua thời điểm về đích.
8. **VirtualWalletService:** chỉ điểm ảo, giao dịch có tính nguyên tử/idempotent.
9. **AuditService:** log RNG, tốc độ, câu hỏi, kết quả và phân thưởng.

## 6. Shared types ví dụ

```ts
type GameMode = 'AUTO' | 'CHALLENGE';
type RoomState = 'WAITING' | 'SELECTING' | 'LOCKED' |
  'COUNTDOWN' | 'RACING' | 'SETTLEMENT' | 'FINISHED';

interface PigState {
  pigId: string;
  name: string;
  ownerPlayerId?: string;
  color: string;
  distanceMeters: number;
  speedMetersPerSecond: number;
  lap: number;
  finishedAtMs?: number;
}

interface RaceSnapshot {
  roomId: string;
  mode: GameMode;
  serverTimeMs: number;
  pigs: PigState[];
}
```

## 7. Protocol realtime đề xuất

| Client gửi | Server gửi |
|---|---|
| `room:join` | `room:state` |
| `pig:select` | `pig:selected` |
| `player:ready` | `race:countdown` |
| `answer:submit` | `question:opened`, `answer:result` |
| — | `race:snapshot`, `race:finished` |
| — | `settlement:result` |

**Tất cả message phải có type-safe schema, validate ở server, giới hạn tần suất và quyền thao tác.** Tất cả reward tính trên server.

## 8. Dữ liệu lâu dài

Những bảng dự kiến: `users`, `pigs`, `rooms`, `room_members`, `races`, `race_pigs`, `lap_times`, `bets_virtual`, `point_ledger`, `questions`, `answer_events`, `race_events`.

- Tối thiểu lưu id trận, timestamp, chế độ, danh sách heo, điểm vào/ra (ảo) và kết quả để kiểm tra.
- Unique key cho `raceId + playerId + transactionType` giúp tránh trả trùng.
- Khóa giao dịch PostgreSQL khi chốt quỹ và trả điểm.

## 9. Bảo mật, độ tin cậy

- Xác thực và phân quyền chủ phòng; xử lý disconnect/reconnect.
- Validate input ở server; chống spam câu trả lời, anti-bot cơ bản, kiểm tra avatar.
- RNG công bằng, có log và test phân phối; không dùng quyền client để tác động thứ hạng.
- Không ghi nhận tiền VNĐ, nạp/rút hoặc chuyển đổi điểm ảo thành tiền trong MVP.
- Test edge cases: 2 heo được chọn, heo không ai chọn thắng, nhiều người cùng chọn heo thắng, chia điểm lẻ, hòa thời gian, mất kết nối, gửi đáp án trùng.

## 10. Giai đoạn hiện tại

Đây là **đề xuất kiến trúc**, chưa có code triển khai. Chốt thiết kế và luật trước khi tạo workspace/app.

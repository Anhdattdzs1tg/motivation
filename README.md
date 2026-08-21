# Nhiệm Vụ Hôm Nay

Ứng dụng web theo dõi nhiệm vụ hằng ngày và chuỗi thói quen cá nhân (habit tracker), được tạo bởi **ANHDATDZS1TG#15**.

## Tính năng chính

- Checklist nhiệm vụ theo buổi: Sáng (0h–13h), Chiều (13h–18h), Tối (18h–24h), và mục Học bài linh hoạt cả ngày
- Tự động khoá nhiệm vụ khi hết buổi, có thông báo nhắc trước 1 tiếng và 30 phút
- Chuỗi ngày (streak) với cơ chế khôi phục theo mốc 10 / 30 / 100 / 200 ngày
- Bộ đếm Pomodoro cho việc học bài (45 phút học / 10 phút nghỉ, có âm báo)
- Lịch sử & thống kê theo tháng
- Ghi chú (nhật ký) tự do hằng ngày
- Hoạt động offline hoàn toàn (lưu trên thiết bị), đồng bộ đa thiết bị khi đăng nhập
- Cài đặt như ứng dụng thật trên điện thoại (PWA)

## Bắt đầu phát triển

```bash
npm install
npm run dev
```

## Kiểm thử logic cốt lõi

Bộ kiểm thử cho logic streak/khôi phục và khoá buổi (không cần trình duyệt):

```bash
npm test
```

## Cấu hình đăng nhập & đồng bộ (Firebase)

Xem hướng dẫn chi tiết từng bước trong [SETUP.md](./SETUP.md).

## Build & triển khai

```bash
npm run build
```

Thư mục `dist/` sau khi build có thể triển khai lên bất kỳ dịch vụ hosting tĩnh miễn phí nào (Vercel, Netlify, Firebase Hosting...). Xem SETUP.md để biết cách triển khai miễn phí.

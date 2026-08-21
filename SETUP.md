# Hướng dẫn cài đặt: Đăng nhập, Đồng bộ & Triển khai

Hướng dẫn này dành cho người chưa quen với Firebase hay GitHub. Làm theo từng bước, không cần biết lập trình.

Có 3 phần:
1. Tạo dự án Firebase miễn phí (để đăng nhập Google + đồng bộ dữ liệu + thông báo đẩy)
2. Kết nối app với Firebase
3. Đưa app lên mạng miễn phí để dùng trên điện thoại thật

---

## Phần 1: Tạo dự án Firebase (miễn phí)

1. Vào [console.firebase.google.com](https://console.firebase.google.com), đăng nhập bằng tài khoản Google của bạn.
2. Bấm **"Add project" / "Tạo dự án"**.
3. Đặt tên bất kỳ, ví dụ `nhiem-vu-hom-nay`. Bấm Continue.
4. Tắt Google Analytics nếu được hỏi (không cần cho app này). Bấm **Create project**.
5. Đợi vài giây, bấm **Continue** khi xong.

### 1.1. Bật đăng nhập Google

1. Trong menu bên trái, chọn **Build → Authentication**.
2. Bấm **Get started**.
3. Ở tab **Sign-in method**, chọn **Google**, bật công tắc **Enable**, chọn email hỗ trợ (email của bạn), bấm **Save**.

### 1.2. Tạo database (Firestore) để lưu dữ liệu đồng bộ

1. Trong menu bên trái, chọn **Build → Firestore Database**.
2. Bấm **Create database**.
3. Chọn vị trí server gần bạn nhất (ví dụ `asia-southeast1`), bấm **Next**.
4. Chọn **Start in production mode**, bấm **Create**.
5. Sau khi tạo xong, vào tab **Rules**, xoá hết nội dung và dán đoạn sau, rồi bấm **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Đoạn này đảm bảo chỉ bạn (sau khi đăng nhập) mới đọc/ghi được dữ liệu của chính mình.

### 1.3. Lấy thông tin cấu hình để dán vào app

1. Bấm biểu tượng bánh răng ⚙️ cạnh "Project Overview" → **Project settings**.
2. Kéo xuống phần **Your apps**, bấm biểu tượng **`</>`** (Web).
3. Đặt tên bất kỳ (ví dụ `nhiem-vu-web`), **không** cần tick Firebase Hosting, bấm **Register app**.
4. Bạn sẽ thấy một đoạn mã có dạng:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "nhiem-vu-hom-nay.firebaseapp.com",
  projectId: "nhiem-vu-hom-nay",
  storageBucket: "nhiem-vu-hom-nay.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

Giữ lại tab này, bạn sẽ cần copy các giá trị này ở Phần 2.

### 1.4. Bật thông báo đẩy (để nhận thông báo cả khi không mở app)

1. Trong **Project settings**, chọn tab **Cloud Messaging**.
2. Kéo xuống mục **Web configuration**, bấm **Generate key pair** nếu chưa có.
3. Copy giá trị **Key pair** (đây là VAPID key) — cũng sẽ dùng ở Phần 2.

---

## Phần 2: Kết nối app với Firebase

1. Trong thư mục dự án, tìm file `.env.example`, sao chép thành file mới tên `.env` (bỏ phần `.example`).
2. Mở file `.env`, điền các giá trị đã lấy ở Phần 1.3 và 1.4:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nhiem-vu-hom-nay.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nhiem-vu-hom-nay
VITE_FIREBASE_STORAGE_BUCKET=nhiem-vu-hom-nay.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_VAPID_KEY=(key pair đã copy ở bước 1.4)
```

3. Lưu file lại. Chạy lại `npm run dev` (hoặc build lại) — trang **Cài đặt → Tài khoản → Đăng nhập** sẽ hiện nút "Đăng nhập bằng Google" thay vì thông báo chưa cấu hình.

**Lưu ý quan trọng:** File `.env` chứa thông tin riêng của dự án bạn — không chia sẻ công khai file này (nó đã được thêm vào `.gitignore` nên sẽ không tự động bị đưa lên GitHub).

---

## Phần 3: Đưa app lên mạng (miễn phí) để dùng trên điện thoại thật

Cách đơn giản nhất là dùng **Vercel** (miễn phí, không cần biết code):

1. Vào [vercel.com](https://vercel.com), bấm **Sign up**, chọn đăng nhập bằng GitHub (Vercel sẽ tự tạo tài khoản GitHub liên kết nếu bạn chưa có, hoặc bạn có thể tạo tài khoản GitHub miễn phí tại [github.com](https://github.com) trước).
2. Sau khi đăng nhập, bấm **Add New → Project**.
3. Nếu code đã có trên GitHub: chọn repository của dự án này, bấm **Import**.
4. Ở phần **Environment Variables**, thêm từng dòng trong file `.env` của bạn (tên biến và giá trị tương ứng).
5. Bấm **Deploy**. Đợi khoảng 1–2 phút.
6. Xong! Bạn sẽ nhận được 1 đường link dạng `https://ten-du-an.vercel.app` — mở link này trên điện thoại.

### Cài app lên màn hình chính điện thoại (như app thật)

**Trên iPhone (Safari):**
1. Mở link app bằng trình duyệt **Safari** (bắt buộc phải là Safari, không phải Cốc Cốc/Chrome).
2. Bấm biểu tượng **Chia sẻ** (hình vuông có mũi tên) ở thanh dưới.
3. Chọn **"Thêm vào MH chính" (Add to Home Screen)**.
4. Bấm **Thêm**. Icon app sẽ xuất hiện trên màn hình chính như một app bình thường.

**Trên máy tính (Cốc Cốc / Chrome / Edge):**
1. Mở link app.
2. Tìm biểu tượng cài đặt (thường ở thanh địa chỉ, hình máy tính có mũi tên) hoặc vào menu trình duyệt → "Cài đặt ứng dụng này".

---

## Nếu bạn không muốn tự làm phần này

App vẫn hoạt động đầy đủ ở chế độ **ngoại tuyến trên 1 thiết bị** mà không cần làm bất kỳ bước nào ở trên — chỉ riêng tính năng **đăng nhập, đồng bộ đa thiết bị, và thông báo đẩy khi không mở app** sẽ chưa hoạt động cho tới khi bạn hoàn tất Phần 1 và 2.

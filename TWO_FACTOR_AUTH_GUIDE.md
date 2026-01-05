# Hướng dẫn thiết lập Xác thực 2 lớp (2FA)

## 📖 Tổng quan

Xác thực 2 lớp (Two-Factor Authentication - 2FA) bổ sung một lớp bảo mật cho tài khoản của bạn bằng cách yêu cầu mã xác thực 6 số từ ứng dụng Google Authenticator ngoài mật khẩu thông thường.

## 🎯 Tính năng

- ✅ Sử dụng chuẩn TOTP (Time-based One-Time Password)
- ✅ Tương thích với Google Authenticator
- ✅ QR code để dễ dàng thiết lập
- ✅ Tùy chọn bật/tắt linh hoạt
- ✅ Không ảnh hưởng đến đăng nhập bằng Google OAuth

## 📱 Yêu cầu

1. **Google Authenticator** (tải miễn phí):
   - iOS: [App Store](https://apps.apple.com/us/app/google-authenticator/id388497605)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)

2. Tài khoản đã đăng nhập vào hệ thống

## 🚀 Cách thiết lập 2FA

### Bước 1: Truy cập trang cá nhân
1. Đăng nhập vào hệ thống
2. Nhấn vào biểu tượng profile (góc trên bên phải)
3. Chọn **"Hồ sơ cá nhân"**

### Bước 2: Bắt đầu thiết lập
1. Cuộn xuống phần **"Xác thực 2 lớp (2FA)"**
2. Nhấn nút **"🔐 Bắt đầu thiết lập"**

### Bước 3: Quét mã QR
1. Mở ứng dụng **Google Authenticator** trên điện thoại
2. Nhấn nút **+** (góc dưới bên phải)
3. Chọn **"Quét mã QR"**
4. Quét mã QR hiển thị trên màn hình

### Bước 4: Nhập mã xác thực
1. Google Authenticator sẽ hiển thị mã 6 số
2. Nhập mã đó vào ô **"Nhập mã 6 số từ app"**
3. Nhấn **"Xác nhận & Bật 2FA"**

### Bước 5: Hoàn tất
✅ Xong! Tài khoản của bạn đã được bảo vệ bởi 2FA.

## 🔐 Cách đăng nhập với 2FA

### Đăng nhập thông thường:
1. Nhập **email** và **mật khẩu** như bình thường
2. Nhấn **"Đăng nhập"**
3. Hệ thống sẽ yêu cầu mã 2FA
4. Mở Google Authenticator trên điện thoại
5. Nhập mã 6 số hiển thị
6. Nhấn **"Xác nhận"**

### Đăng nhập bằng Google OAuth:
- Không cần mã 2FA (đã được xác thực qua Google)

## ❌ Cách tắt 2FA

1. Đăng nhập vào hệ thống
2. Truy cập **"Hồ sơ cá nhân"**
3. Cuộn xuống phần **"Xác thực 2 lớp (2FA)"**
4. Nhập **mật khẩu** để xác nhận
5. Nhấn **"Tắt 2FA"**

⚠️ **Cảnh báo**: Việc tắt 2FA sẽ làm giảm tính bảo mật tài khoản.

## 🔧 Xử lý sự cố

### Không quét được mã QR?
1. Nhấn vào **"Không quét được? Nhập thủ công"**
2. Copy mã secret key
3. Trong Google Authenticator:
   - Nhấn **+** → **"Nhập khóa thiết lập"**
   - Dán mã secret key
   - Chọn **"Dựa trên thời gian"**

### Mã 2FA không đúng?
- Kiểm tra giờ trên điện thoại (phải chính xác)
- Đảm bảo đồng hồ điện thoại đã bật đồng bộ tự động
- Mã mới sẽ được tạo sau mỗi 30 giây

### Mất điện thoại?
- Liên hệ với quản trị viên qua email: schoolfoodorder@gmail.com
- Cung cấp thông tin tài khoản để được hỗ trợ tắt 2FA

## 🛡️ Lợi ích của 2FA

1. **Bảo mật tăng cường**: Ngay cả khi mật khẩu bị lộ, tài khoản vẫn an toàn
2. **Phòng chống truy cập trái phép**: Chỉ bạn với điện thoại mới đăng nhập được
3. **Chuẩn công nghiệp**: Sử dụng chuẩn TOTP được tin dùng toàn cầu
4. **Không cần internet**: Google Authenticator hoạt động offline

## 📝 Lưu ý quan trọng

- ✅ Lưu lại mã secret key ở nơi an toàn (backup khi cần khôi phục)
- ✅ Có thể sử dụng nhiều thiết bị quét cùng một QR code
- ⚠️ Không chia sẻ mã 6 số với bất kỳ ai
- ⚠️ Mã 6 số chỉ có giá trị trong 30 giây

## 🔍 Câu hỏi thường gặp

**Q: Có thể sử dụng ứng dụng khác thay Google Authenticator?**
- A: Có, bất kỳ ứng dụng TOTP nào (Authy, Microsoft Authenticator, etc.)

**Q: 2FA có bắt buộc không?**
- A: Không, nhưng rất khuyến khích để bảo vệ tài khoản

**Q: Đăng nhập bằng Google có cần 2FA không?**
- A: Không, Google OAuth đã có bảo mật riêng

**Q: Tôi có thể bật 2FA cho nhiều tài khoản?**
- A: Có, Google Authenticator hỗ trợ nhiều tài khoản

## 📧 Hỗ trợ

Nếu gặp vấn đề, vui lòng liên hệ:
- Email: schoolfoodorder@gmail.com
- Hoặc liên hệ quản trị viên hệ thống

---

**Cập nhật lần cuối**: 2026-01-01  
**Phiên bản**: 1.0

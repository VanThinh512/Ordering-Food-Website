# Hướng Dẫn Cấu Hình Google OAuth

## 📋 Tổng Quan

Hướng dẫn này sẽ giúp bạn thiết lập Google OAuth để người dùng có thể đăng nhập bằng tài khoản Google.

---

## 🚀 Bước 1: Tạo Project trên Google Cloud Console

1. **Truy cập Google Cloud Console**
   - Mở trình duyệt và truy cập: https://console.cloud.google.com/
   - Đăng nhập bằng tài khoản Google của bạn

2. **Tạo Project mới**
   - Click vào dropdown "Select a project" ở thanh menu trên
   - Click nút **"NEW PROJECT"**
   - Nhập tên project: `School Food Order` (hoặc tên bạn muốn)
   - Click **"CREATE"**
   - Đợi vài giây để Google tạo project

---

## 🔑 Bước 2: Bật Google+ API

1. **Vào API Library**
   - Từ menu bên trái, chọn **"APIs & Services"** → **"Library"**
   
2. **Tìm và bật API**
   - Tìm kiếm: `Google+ API`
   - Click vào **"Google+ API"**
   - Click nút **"ENABLE"**

3. **Bật thêm Google Identity**
   - Quay lại Library
   - Tìm: `Google Identity Toolkit API`
   - Click **"ENABLE"**

---

## 🔐 Bước 3: Tạo OAuth 2.0 Credentials

1. **Vào Credentials**
   - Từ menu bên trái: **"APIs & Services"** → **"Credentials"**
   - Click nút **"+ CREATE CREDENTIALS"**
   - Chọn **"OAuth client ID"**

2. **Cấu hình OAuth Consent Screen** (nếu chưa có)
   - Nếu được yêu cầu, click **"CONFIGURE CONSENT SCREEN"**
   - Chọn **"External"** (cho testing)
   - Click **"CREATE"**

3. **Điền thông tin OAuth Consent Screen**
   - **App name**: `School Food Order`
   - **User support email**: Email của bạn
   - **Developer contact information**: Email của bạn
   - Click **"SAVE AND CONTINUE"**

4. **Scopes** (bước 2)
   - Click **"ADD OR REMOVE SCOPES"**
   - Chọn các scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

5. **Test users** (bước 3)
   - Click **"+ ADD USERS"**
   - Thêm email của bạn để test
   - Click **"SAVE AND CONTINUE"**
   - Click **"BACK TO DASHBOARD"**

---

## 🌐 Bước 4: Tạo OAuth Client ID

1. **Tạo Client ID**
   - Quay lại **"Credentials"** tab
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - **Application type**: Chọn **"Web application"**
   - **Name**: `School Food Order Web`

2. **Cấu hình Authorized URIs**
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost:8000
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:8000/api/v1/auth/google/callback
   http://localhost:5173/auth/google/callback
   ```

3. **Tạo và lưu credentials**
   - Click **"CREATE"**
   - Một popup hiện ra với **Client ID** và **Client Secret**
   - ⚠️ **QUAN TRỌNG**: Copy cả 2 giá trị này ngay!

---

## ⚙️ Bước 5: Cấu Hình Backend (.env)

1. **Mở file `.env`** trong folder `backend/`

2. **Thêm Google OAuth credentials:**

```env
# Existing configs...

# Google OAuth Settings
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

3. **Thay thế giá trị:**
   - `GOOGLE_CLIENT_ID`: Paste Client ID từ Google Console
   - `GOOGLE_CLIENT_SECRET`: Paste Client Secret từ Google Console

**Ví dụ:**
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEf123456789
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

---

## 📦 Bước 6: Cài Đặt Dependencies

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Hoặc cài đặt từng package:

```bash
pip install google-auth==2.27.0
pip install google-auth-oauthlib==1.2.0
pip install google-auth-httplib2==0.2.0
pip install httpx==0.27.0
```

### Frontend

Frontend không cần cài thêm package nào (sử dụng fetch API có sẵn).

---

## 🗄️ Bước 7: Chạy Database Migration (nếu cần)

Nếu database của bạn chưa có các field Google OAuth mới:

```bash
cd backend

# Option 1: Drop và recreate tables (CHỈ dùng cho development!)
# Xóa database và tạo lại

# Option 2: Hoặc chạy script SQL này trong SQL Server Management Studio:
```

```sql
-- Thêm các column mới vào bảng users
ALTER TABLE users ADD google_id NVARCHAR(255) NULL;
ALTER TABLE users ADD google_email NVARCHAR(255) NULL;
ALTER TABLE users ADD google_picture NVARCHAR(500) NULL;

-- Tạo index cho google_id
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
```

---

## ▶️ Bước 8: Chạy Ứng Dụng

### 1. Start Backend

```bash
cd backend
# Activate virtual environment (nếu có)
.venv\Scripts\Activate.ps1  # Windows PowerShell
# hoặc
source .venv/bin/activate    # Linux/Mac

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend

```bash
cd frontend/web-order-fe
npm run dev
```

---

## 🧪 Bước 9: Test Google Login

1. **Mở trình duyệt**
   - Truy cập: http://localhost:5173/login

2. **Click nút "Đăng nhập bằng Google"**

3. **Chọn tài khoản Google**
   - Google sẽ hiển thị danh sách email
   - Chọn email bạn đã thêm vào Test Users

4. **Cho phép quyền truy cập**
   - Google sẽ hỏi permission để truy cập thông tin
   - Click **"Continue"** hoặc **"Allow"**

5. **Được redirect về app**
   - Bạn sẽ thấy màn hình "Đang xử lý đăng nhập Google..."
   - Sau đó được redirect đến `/menu`

---

## ✅ Xác Nhận Hoạt Động

Sau khi đăng nhập thành công, kiểm tra:

1. **Browser DevTools → Application → Local Storage**
   - Phải có `access_token`

2. **Backend logs**
   - Xem có log tạo user mới hoặc link account

3. **Database**
   - Query bảng `users`:
   ```sql
   SELECT id, email, full_name, google_id, google_email, google_picture 
   FROM users 
   WHERE google_id IS NOT NULL;
   ```

---

## 🔧 Troubleshooting

### Lỗi: "Google OAuth is not configured"

**Nguyên nhân:** Backend không đọc được credentials từ `.env`

**Giải pháp:**
- Kiểm tra file `.env` có đúng vị trí không (trong folder `backend/`)
- Restart backend server
- Kiểm tra không có dấu cách thừa trong `.env`

---

### Lỗi: "redirect_uri_mismatch"

**Nguyên nhân:** Redirect URI không khớp với Google Console

**Giải pháp:**
1. Vào Google Console → Credentials
2. Click vào OAuth 2.0 Client ID đã tạo
3. Kiểm tra **Authorized redirect URIs** phải có:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
4. Lưu và thử lại

---

### Lỗi: "Access blocked: This app's request is invalid"

**Nguyên nhân:** OAuth Consent Screen chưa publish hoặc thiếu scopes

**Giải pháp:**
1. Vào **OAuth consent screen**
2. Thêm email vào **Test users**
3. Kiểm tra **Scopes** đã thêm đủ 3 scopes
4. Nếu cần, click **"PUBLISH APP"** (cho production)

---

### User được tạo nhưng không có thông tin đầy đủ

**Nguyên nhân:** Scopes không đủ quyền

**Giải pháp:**
1. Vào Google Console → OAuth consent screen
2. Click **"EDIT APP"**
3. Ở bước **Scopes**, đảm bảo có:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
4. Lưu lại
5. Xóa token cũ và đăng nhập lại

---

## 🌍 Production Setup

Khi deploy lên production:

1. **Update Redirect URIs** trong Google Console:
   ```
   https://yourdomain.com/api/v1/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```

2. **Update Environment Variables:**
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/auth/google/callback
   BACKEND_CORS_ORIGINS=https://yourdomain.com
   ```

3. **Publish OAuth Consent Screen:**
   - Vào **OAuth consent screen**
   - Click **"PUBLISH APP"**
   - Submit for Google verification (nếu cần nhiều hơn 100 users)

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. Backend logs: `uvicorn` console output
2. Frontend console: Browser DevTools → Console
3. Network tab: Xem request/response details
4. Google OAuth Playground: https://developers.google.com/oauthplayground/

---

## 📚 Tài Liệu Tham Khảo

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

---

**✨ Chúc bạn cấu hình thành công!**

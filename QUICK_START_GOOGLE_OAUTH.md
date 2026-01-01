# ⚡ Quick Start - Google OAuth Setup

## 📋 CHECKLIST - Làm theo thứ tự này

### ✅ Step 1: Install Backend Dependencies (2 phút)
```bash
cd backend
pip install google-auth==2.27.0 google-auth-oauthlib==1.2.0 google-auth-httplib2==0.2.0 httpx==0.27.0
```

---

### ✅ Step 2: Setup Google Cloud Console (5-10 phút)

1. **Truy cập:** https://console.cloud.google.com/
2. **Tạo project mới:** "School Food Order"
3. **Bật APIs:**
   - Google+ API
   - Google Identity Toolkit API
4. **Tạo OAuth 2.0 Credentials:**
   - App name: School Food Order
   - Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:8000`
   - Authorized redirect URIs: `http://localhost:8000/api/v1/auth/google/callback`
5. **Copy Client ID và Client Secret**

**📚 Chi tiết:** Xem file `GOOGLE_OAUTH_SETUP.md`

---

### ✅ Step 3: Update .env File (1 phút)

Mở file `backend/.env` và thêm/sửa:

```env
# Google OAuth (THAY ĐỔI GIÁ TRỊ NÀY!)
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

---

### ✅ Step 4: Update Database (2 phút)

**Option A: Tạo lại database (Development only)**
```bash
# Xóa và tạo lại database
# Backend sẽ tự động tạo tables với fields mới
```

**Option B: Chạy migration SQL**

Mở SQL Server Management Studio và chạy:

```sql
USE WebOrderDB;  -- Thay tên database của bạn

-- Thêm Google OAuth fields
ALTER TABLE users ADD google_id NVARCHAR(255) NULL;
ALTER TABLE users ADD google_email NVARCHAR(255) NULL;
ALTER TABLE users ADD google_picture NVARCHAR(500) NULL;

-- Tạo unique index
CREATE UNIQUE INDEX idx_users_google_id ON users(google_id) 
WHERE google_id IS NOT NULL;
```

---

### ✅ Step 5: Restart Servers (1 phút)

```bash
# Terminal 1: Backend
cd backend
.venv\Scripts\Activate.ps1  # Nếu có venv
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend/web-order-fe
npm run dev
```

---

### ✅ Step 6: Test (2 phút)

1. **Mở browser:** http://localhost:5173/login
2. **Click:** "Đăng nhập bằng Google"
3. **Chọn tài khoản Google**
4. **Cho phép quyền truy cập**
5. **✨ Thành công!** Bạn sẽ được chuyển đến trang menu

---

## 🔍 Verify It Works

### Check 1: LocalStorage có token
- Mở DevTools → Application → Local Storage
- Phải thấy `access_token`

### Check 2: Database có user
```sql
SELECT id, email, full_name, google_id, google_email, google_picture 
FROM users 
WHERE google_id IS NOT NULL;
```

### Check 3: Backend logs
```
INFO: User created/logged in via Google
INFO: Email: your-email@gmail.com
```

---

## ⚠️ Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "OAuth not configured" | Check `.env` file → Restart backend |
| "redirect_uri_mismatch" | Check Google Console redirect URIs |
| "Access blocked" | Add your email to Test Users |
| Button không hiện | Check browser console for errors |
| Database error | Run migration SQL above |

---

## 📞 Need Help?

1. **Setup Guide:** `GOOGLE_OAUTH_SETUP.md` (chi tiết từng bước)
2. **Implementation Details:** `GOOGLE_OAUTH_IMPLEMENTATION.md`
3. **API Docs:** http://localhost:8000/api/v1/docs

---

## 🎯 Expected Result

Sau khi setup xong:
- ✅ Button "Đăng nhập bằng Google" hiện trên login page
- ✅ Click button → Redirect đến Google login
- ✅ Chọn account → Redirect về app với token
- ✅ User được tạo/login tự động
- ✅ Navigate đến menu page

**Total Time:** ~15-20 phút

---

**🚀 Ready to go? Start with Step 1!**

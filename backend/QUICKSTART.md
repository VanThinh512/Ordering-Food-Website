# Quick Start Guide

## 1. Cài đặt Dependencies

```bash
pip install -r requirements.txt
```

## 2. Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong file `.env`:

```env
# Database
DATABASE_URL=mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server
DATABASE_NAME=WebOrderDB

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin Account
FIRST_SUPERUSER_EMAIL=admin@weborder.com
FIRST_SUPERUSER_PASSWORD=admin123
FIRST_SUPERUSER_FULLNAME=System Administrator

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 3. Test Database Connection

```bash
python test_connection.py
```

## 4. Chạy Application

### Development Mode (với auto-reload):

```bash
python -m app.main
```

Hoặc:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 5. Truy cập API Documentation

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## 6. Test API

### Register User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "student"
  }'
```

### Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

### Get Current User

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 7. Cấu trúc Database

Khi chạy lần đầu, application sẽ tự động:
- Tạo tất cả các bảng trong database
- Tạo tài khoản admin mặc định (từ biến môi trường)

## 8. Troubleshooting

### Lỗi kết nối database:
- Kiểm tra `DATABASE_URL` trong file `.env`
- Đảm bảo SQL Server đang chạy
- Kiểm tra ODBC Driver đã được cài đặt

### Lỗi import module:
- Đảm bảo đã cài đặt tất cả dependencies: `pip install -r requirements.txt`
- Chạy từ thư mục `backend`

### Lỗi CORS:
- Cập nhật `BACKEND_CORS_ORIGINS` trong file `.env` với URL của frontend

## 9. Development Tips

- Sử dụng Swagger UI để test API endpoints
- Tất cả endpoints đều có validation tự động
- JWT token hết hạn sau 30 phút (có thể thay đổi trong config)
- Admin account có quyền truy cập tất cả endpoints

## 10. Next Steps

1. Tạo categories cho sản phẩm
2. Thêm products vào từng category
3. Test cart và order flow
4. Tùy chỉnh business logic theo nhu cầu

# 📚 Documentation Index

Chào mừng đến với WebOrder API Backend! Dưới đây là danh sách tất cả các tài liệu hướng dẫn.

## 🚀 Bắt Đầu

### [START_HERE.md](START_HERE.md) ⭐
**Đọc file này trước tiên!**
- Tổng quan nhanh về dự án
- Các bước bắt đầu cơ bản
- Links đến các tài liệu khác

### [QUICKSTART.md](QUICKSTART.md)
**Hướng dẫn nhanh bằng tiếng Việt**
- Cài đặt dependencies
- Cấu hình environment
- Chạy application
- Test API
- Troubleshooting

## 📖 Documentation Chính

### [README.md](README.md)
**Documentation tổng quan**
- Giới thiệu dự án
- Cấu trúc thư mục
- Tính năng chính
- API endpoints overview
- Development guidelines

### [ARCHITECTURE.md](ARCHITECTURE.md)
**Kiến trúc hệ thống**
- Layered architecture diagram
- Request flow
- Module dependencies
- Database schema
- Authentication flow
- Order creation flow

### [API_REFERENCE.md](API_REFERENCE.md)
**Tài liệu API đầy đủ**
- Tất cả 35 API endpoints
- Request/Response examples
- Authentication
- Error responses
- Enums reference

## 🔧 Technical Documentation

### [RESTRUCTURE_SUMMARY.md](RESTRUCTURE_SUMMARY.md)
**Tóm tắt tái cấu trúc**
- Mục tiêu đã hoàn thành
- Cấu trúc mới vs cũ
- Files đã thay đổi
- Clean code principles
- Best practices implemented

### [SERVICE_LAYER.md](SERVICE_LAYER.md) ⭐ NEW
**Service Layer Documentation**
- Tổng quan về Service Layer
- Auth Service - Authentication logic
- Cart Service - Cart business logic
- Order Service - Order processing
- Best practices & examples
- Testing services

### [DEPLOYMENT.md](DEPLOYMENT.md)
**Production deployment checklist**
- Pre-deployment checklist
- Server setup
- Configuration
- Monitoring
- Backup strategy
- Rollback plan
- Security hardening

## 📁 Cấu Trúc Dự Án

```
backend/
├── app/
│   ├── api/v1/endpoints/    # 🌐 API endpoints
│   │   ├── auth.py          # Authentication
│   │   ├── users.py         # User management
│   │   ├── categories.py    # Category CRUD
│   │   ├── products.py      # Product CRUD + Search
│   │   ├── carts.py         # Shopping cart
│   │   ├── orders.py        # Order management
│   │   └── tables.py        # Table management
│   │
│   ├── models/              # 🗄️ Database models
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── table.py
│   │
│   ├── schemas/             # 📋 Pydantic schemas
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── table.py
│   │   └── token.py
│   │
│   ├── crud/                # 🔨 CRUD operations
│   │   ├── base.py          # Base CRUD class
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── table.py
│   │
│   ├── core/                # ⚙️ Core configuration
│   │   ├── config.py        # Settings
│   │   └── security.py      # JWT & Password
│   │
│   ├── db/                  # 💾 Database
│   │   ├── base.py          # Model imports
│   │   ├── session.py       # DB session
│   │   └── init_db.py       # Initialization
│   │
│   └── utils/               # 🛠️ Utilities
│       └── enums.py         # Enums
│
├── Documentation Files
├── test_connection.py       # Test DB connection
├── requirements.txt         # Dependencies
└── .env.example            # Environment template
```

## 🎯 Quick Links

### Development
- **Start Development**: `python -m app.main`
- **Test Database**: `python test_connection.py`
- **API Docs**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

### API Endpoints
- **Auth**: `/api/v1/auth/*`
- **Users**: `/api/v1/users/*`
- **Categories**: `/api/v1/categories/*`
- **Products**: `/api/v1/products/*`
- **Cart**: `/api/v1/cart/*`
- **Orders**: `/api/v1/orders/*`
- **Tables**: `/api/v1/tables/*`

### Default Credentials
```
Email: admin@weborder.com
Password: admin123
```
(Thay đổi trong `.env`)

## 📊 Statistics

- **Total API Endpoints**: 35
- **Database Models**: 8 (User, Category, Product, Table, Cart, CartItem, Order, OrderItem)
- **Pydantic Schemas**: 21
- **CRUD Classes**: 7
- **Lines of Code**: ~3000+
- **Documentation Pages**: 7

## 🔍 Tìm Thông Tin

### Tôi muốn...

#### ...bắt đầu nhanh
→ Đọc [START_HERE.md](START_HERE.md)

#### ...hiểu cấu trúc dự án
→ Đọc [README.md](README.md) và [ARCHITECTURE.md](ARCHITECTURE.md)

#### ...biết cách sử dụng API
→ Đọc [API_REFERENCE.md](API_REFERENCE.md)

#### ...cài đặt và chạy
→ Đọc [QUICKSTART.md](QUICKSTART.md)

#### ...deploy lên production
→ Đọc [DEPLOYMENT.md](DEPLOYMENT.md)

#### ...hiểu những thay đổi
→ Đọc [RESTRUCTURE_SUMMARY.md](RESTRUCTURE_SUMMARY.md)

## ✨ Tính Năng Nổi Bật

✅ **Clean Architecture** - Separation of concerns
✅ **Type Safety** - Full type hints
✅ **Auto Documentation** - Swagger UI & ReDoc
✅ **JWT Authentication** - Secure authentication
✅ **Role-based Authorization** - Admin, Staff, Student
✅ **Database Relationships** - Proper foreign keys
✅ **Input Validation** - Pydantic schemas
✅ **Error Handling** - Comprehensive error responses
✅ **CORS Support** - Configurable CORS
✅ **Production Ready** - Deployment checklist

## 🆘 Cần Giúp Đỡ?

1. **Lỗi cài đặt**: Xem [QUICKSTART.md](QUICKSTART.md) → Troubleshooting
2. **Lỗi API**: Xem [API_REFERENCE.md](API_REFERENCE.md) → Error Responses
3. **Lỗi database**: Chạy `python test_connection.py`
4. **Câu hỏi khác**: Đọc [README.md](README.md) hoặc [ARCHITECTURE.md](ARCHITECTURE.md)

## 📝 Ghi Chú

- Tất cả documentation được viết bằng Markdown
- Code examples sử dụng syntax highlighting
- Diagrams được tạo bằng ASCII art
- Documentation được cập nhật thường xuyên

## 🎓 Learning Path

### Người mới bắt đầu
1. [START_HERE.md](START_HERE.md)
2. [QUICKSTART.md](QUICKSTART.md)
3. [README.md](README.md)
4. Thực hành với Swagger UI

### Developer
1. [ARCHITECTURE.md](ARCHITECTURE.md)
2. [API_REFERENCE.md](API_REFERENCE.md)
3. Đọc source code trong `app/`
4. Tạo custom endpoints

### DevOps
1. [DEPLOYMENT.md](DEPLOYMENT.md)
2. [README.md](README.md) → Production section
3. Setup monitoring
4. Configure backups

---

**Version**: 1.0.0
**Last Updated**: 2025-12-18
**Maintainer**: Development Team

**Happy Coding! 🚀**

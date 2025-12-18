# 🍽️ WebOrder Backend

Backend API cho hệ thống order đồ ăn/cafe trong trường.

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.115.5
- **ORM**: SQLModel 0.0.22 (SQLAlchemy + Pydantic)
- **Database**: Microsoft SQL Server (ODBC Driver 17)
- **Migrations**: Alembic 1.14.0
- **Authentication**: JWT (python-jose) + bcrypt (passlib)
- **Python**: 3.13+

---

## 📋 Prerequisites

Trước khi bắt đầu, đảm bảo máy bạn đã cài:

1. **Python 3.13+** - [Download](https://www.python.org/downloads/)
2. **SQL Server** (SSMS 19) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
3. **ODBC Driver 17 for SQL Server** - [Download](https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
4. **Git** - [Download](https://git-scm.com/downloads)

---

## 🚀 Setup Instructions

### **1. Clone Repository**

```powershell
git clone https://github.com/VanThinh512/Ordering-Food-Website.git
cd WebOrder/backend
```

### **2. Create Virtual Environment**

```powershell
# Tạo venv
python -m venv .venv

# Kích hoạt venv
.venv\Scripts\Activate.ps1
```

### **3. Install Dependencies**

```powershell
pip install -r requirements.txt
```

### **4. Setup Database**

#### **4.1. Kiểm tra SQL Server đang chạy**

```powershell
Get-Service | Where-Object {$_.DisplayName -like "*SQL*"}
```

Đảm bảo **SQL Server (SQLEXPRESS)** đang **Running**.

#### **4.2. Tạo Database**

Mở **SQL Server Management Studio (SSMS)** và chạy:

```sql
CREATE DATABASE WebOrderDB;
GO
```

### **5. Configure Environment**

#### **5.1. Copy file .env**

```powershell
copy env.example .env
```

#### **5.2. Sửa file .env**

Mở file `.env` và cập nhật các giá trị sau:

**🔧 Chỉ cần sửa dòng này:**

```env
DATABASE_URL=mssql+pyodbc://localhost\SQLEXPRESS/WebOrderDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes
```

**Thay đổi theo máy của bạn:**
- `localhost\SQLEXPRESS` → Thay bằng server name của bạn
  - Kiểm tra trong SSMS → Connect to Server → Server name
  - Ví dụ: `GigabytecuaT\SQLEXPRESS`, `.\SQLEXPRESS`, `localhost\SQLEXPRESS`

**Lưu ý:**
- Dùng `\` (backslash) không cần encode
- Nếu dùng Windows Authentication, giữ nguyên `Trusted_Connection=yes`
- Nếu dùng SQL Authentication:
  ```env
  DATABASE_URL=mssql+pyodbc://username:password@localhost\SQLEXPRESS/WebOrderDB?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes
  ```

#### **5.3. Generate Secret Key (Optional)**

Nếu muốn secret key mạnh hơn:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy output và cập nhật vào `.env`:
```env
SECRET_KEY=<your-generated-secret-key>
```
python e:\Python_Project\WebOrder\backend\test_connection.py


Sau khi chạy, bạn sẽ thấy 8 tables trong database:
- `users`
- `categories`
- `products`
- `tables`
- `carts`
- `cart_items`
- `orders`
- `order_items`

### **7. Test Connection**

```powershell
python test_db.py
```

Kết quả mong đợi:
```
✅ CONNECTION SUCCESSFUL!
🖥️  Server: localhost\SQLEXPRESS
🗄️  Database: WebOrderDB
```

---

## 🎯 Running the Application

### **Development Mode**

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API sẽ chạy tại: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### **Production Mode**

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📁 Project Structure

```
backend/
├── alembic/                    # Database migrations
│   ├── versions/               # Migration files
│   ├── env.py                  # Alembic environment
│   └── script.py.mako          # Migration template
├── app/
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication routes
│   │   ├── cart.py            # Cart routes
│   │   ├── deps.py            # Dependencies
│   │   ├── menu.py            # Menu/Product routes
│   │   └── order.py           # Order routes
│   ├── core/                   # Core configurations
│   │   ├── config.py          # Settings
│   │   └── security.py        # Security utilities
│   ├── db/                     # Database
│   │   ├── models.py          # SQLModel models
│   │   └── session.py         # Database session
│   ├── services/               # Business logic
│   └── main.py                # FastAPI application
├── .env                        # Environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── alembic.ini                 # Alembic configuration
├── requirements.txt            # Python dependencies
├── test_db.py                  # Test database connection
└── README.md                   # This file
```

---

## 🗃️ Database Models

### **User**
- Roles: `admin`, `staff`, `student`
- Fields: email, password, full_name, phone, student_id, class_name

### **Category**
- Product categories (e.g., Coffee, Tea, Food)

### **Product**
- Menu items with price, description, stock, etc.

### **Table**
- Tables for dine-in orders
- Status: `available`, `occupied`, `reserved`

### **Cart & CartItem**
- Shopping cart (one per user)

### **Order & OrderItem**
- Order management with status workflow
- Status: `pending` → `confirmed` → `preparing` → `ready` → `completed`

Chi tiết: Xem [MODELS_DOCUMENTATION.md](MODELS_DOCUMENTATION.md)

---

## 🔧 Common Issues & Solutions

### **Issue 1: Cannot connect to SQL Server**

**Error:** `Named Pipes Provider: Could not open a connection`

**Solution:**
1. Start SQL Server Browser service (requires Admin):
   - Open Services (`services.msc`)
   - Find "SQL Server Browser" → Start
   - Set Startup type to Automatic

2. Or use `localhost\SQLEXPRESS` instead of computer name

### **Issue 2: ODBC Driver not found**

**Error:** `Data source name not found`

**Solution:**
1. Check installed drivers:
   ```powershell
   python -c "import pyodbc; print(pyodbc.drivers())"
   ```

2. If no SQL Server driver, install [ODBC Driver 17](https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)

### **Issue 3: ModuleNotFoundError**

**Error:** `ModuleNotFoundError: No module named 'pydantic_settings'`

**Solution:**
```powershell
# Activate venv first!
.venv\Scripts\Activate.ps1

# Then install
pip install -r requirements.txt
```

### **Issue 4: Database already exists**

**Error:** `Database 'WebOrderDB' already exists`

**Solution:** Drop and recreate database in SSMS:
```sql
DROP DATABASE WebOrderDB;
GO
CREATE DATABASE WebOrderDB;
GO
```

Then run migrations again.

---

## 📚 Alembic Commands

```powershell
# View current migration version
alembic current

# View migration history
alembic history --verbose

# Create new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base
```

---

## 🧪 Testing

```powershell
# Test database connection
python test_db.py

# Test API endpoints (after implementing main.py)
# Open browser: http://localhost:8000/docs
```

---

## 📝 Environment Variables

Chi tiết về các biến môi trường trong file `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQL Server connection string | `mssql+pyodbc://localhost\SQLEXPRESS/...` |
| `DATABASE_NAME` | Database name | `WebOrderDB` |
| `SECRET_KEY` | JWT secret key | `your-secret-key` |
| `ENVIRONMENT` | Environment mode | `development`, `production` |
| `DEBUG` | Debug mode | `True`, `False` |
| `API_V1_STR` | API version prefix | `/api/v1` |
| `BACKEND_CORS_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

---

## 🤝 Team Collaboration

### **For New Members:**

1. Clone repo
2. Follow setup instructions above (5 phút)
3. Chỉ cần sửa `DATABASE_URL` trong `.env`
4. Chạy migrations: `alembic upgrade head`
5. Test: `python test_db.py`
6. Done! ✅

### **Before Pushing Code:**

1. Kiểm tra không commit file `.env`
2. Test local trước khi push
3. Create migration nếu có thay đổi models

### **After Pulling Code:**

```powershell
# Update dependencies (nếu requirements.txt thay đổi)
pip install -r requirements.txt

# Apply new migrations (nếu có)
alembic upgrade head
```

---

## 📞 Support

Nếu gặp vấn đề, check:
1. README này (most common issues ở trên)
2. MODELS_DOCUMENTATION.md (chi tiết models)
3. Ask team lead

---

## 📄 License

[Your License Here]

---

## 👥 Contributors

- [Your Team Members]

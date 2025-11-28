# ⚡ Quick Setup Guide (5 minutes)

Hướng dẫn nhanh cho team members khi clone project lần đầu.

---

## ✅ Checklist

- [ ] Python 3.13+ installed
- [ ] SQL Server đang chạy
- [ ] ODBC Driver 17 installed

---

## 🚀 5 Bước Setup

### **1️⃣ Clone & Setup Venv (1 min)**

```powershell
git clone https://github.com/VanThinh512/Ordering-Food-Website.git
cd WebOrder/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### **2️⃣ Tạo Database trong SSMS (30 seconds)**

```sql
CREATE DATABASE WebOrderDB;
GO
```

### **3️⃣ Config .env (1 min)**

```powershell
# Copy file
copy env.example .env

# Mở .env và SỬA DUY NHẤT dòng này:
```

```env
DATABASE_URL=mssql+pyodbc://localhost\SQLEXPRESS/WebOrderDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes
```

**Thay `localhost\SQLEXPRESS` bằng server name của BẠN:**
- Check trong SSMS → Connect → Server name
- Ví dụ: `GigabytecuaT\SQLEXPRESS`, `.\SQLEXPRESS`, `localhost\SQLEXPRESS`

### **4️⃣ Run Migrations (1 min)**

```powershell
alembic upgrade head
```

Kết quả: 8 tables được tạo trong database.

### **5️⃣ Test Connection (30 seconds)**

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

## ✨ Done! Bạn đã sẵn sàng code!

---

## 🔧 Nếu Có Lỗi

### **Lỗi: Cannot connect to SQL Server**


thử thay `DATABASE_URL` bằng:

```env
# Option 1: Dot notation
DATABASE_URL=mssql+pyodbc://./SQLEXPRESS/WebOrderDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes

# Option 2: (local)
DATABASE_URL=mssql+pyodbc://(local)\SQLEXPRESS/WebOrderDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes

# Option 3: Computer name
DATABASE_URL=mssql+pyodbc://YourComputerName\SQLEXPRESS/WebOrderDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes
```

### **Lỗi: ODBC Driver not found**

Check drivers:
```powershell
python -c "import pyodbc; print(pyodbc.drivers())"
```

Nếu không có **ODBC Driver 17 for SQL Server**, download tại:
https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

### **Lỗi: Module not found**

```powershell
# Đảm bảo venv đã active!
.venv\Scripts\Activate.ps1

# Rồi install lại
pip install -r requirements.txt
```

---

## 📖 Chi Tiết Hơn

Xem [README.md](README.md) để biết thêm chi tiết.


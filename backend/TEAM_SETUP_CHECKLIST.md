# ✅ Team Setup Checklist

Checklist này giúp team members setup project một cách nhanh chóng.

---

## 📋 For New Team Members

### **Before Clone:**
- [ ] Python 3.13+ đã cài
- [ ] SQL Server đang chạy
- [ ] ODBC Driver 17 for SQL Server đã cài

### **After Clone:**

```powershell
# 1. Setup venv (1 min)
cd WebOrder/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Create database (trong SSMS)
CREATE DATABASE WebOrderDB;

# 3. Config environment
copy env.example .env
# ⚠️ Mở .env và SỬA dòng DATABASE_URL
# Thay "localhost\SQLEXPRESS" bằng server name của BẠN

# 4. Run migrations
alembic upgrade head

# 5. Test
python test_db.py
```

**✅ Done! Nếu test_db.py thành công → Bạn đã sẵn sàng!**

---

## 🔄 Daily Workflow

### **Trước khi bắt đầu code:**

```powershell
# Pull latest changes
git pull

# Check for new migrations
alembic current
alembic upgrade head  # if needed

# Update dependencies (if requirements.txt changed)
pip install -r requirements.txt
```

### **Khi có thay đổi models:**

```powershell
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head

# Commit both model changes và migration file
git add app/db/models.py alembic/versions/*.py
git commit -m "Add/Update models: description"
```

### **Trước khi push:**

- [ ] Code đã test local
- [ ] Không commit file `.env`
- [ ] Migrations đã được apply và test
- [ ] Không có linter errors

---

## 🚨 Common Issues for Team

### **Issue: Cannot connect to SQL Server**

**Giải pháp:** Thử các server name khác trong `.env`:

```env
# Try these one by one:
DATABASE_URL=mssql+pyodbc://localhost\SQLEXPRESS/WebOrderDB?...
DATABASE_URL=mssql+pyodbc://.\SQLEXPRESS/WebOrderDB?...
DATABASE_URL=mssql+pyodbc://(local)\SQLEXPRESS/WebOrderDB?...
```

Hoặc chạy:
```powershell
python test_connections.py  # Will find working connection
```

### **Issue: Alembic version conflict**

```powershell
# Check current version
alembic current

# If different from team:
alembic downgrade base
alembic upgrade head
```

### **Issue: Module not found**

```powershell
# Always activate venv first!
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---



---

## 🎯 Quick Commands Reference

```powershell
# Activate venv
.venv\Scripts\Activate.ps1

# Test connection
python test_db.py

# Check migrations
alembic current

# Apply migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "message"

# Run server (when main.py is ready)
uvicorn app.main:app --reload
```

---

## 📁 Important Files (DON'T COMMIT)

❌ **Never commit:**
- `.env` - Personal database config
- `__pycache__/` - Python cache
- `.venv/` - Virtual environment
- `*.pyc` - Compiled Python

✅ **Always commit:**
- `env.example` - Template for team
- `requirements.txt` - Dependencies
- `alembic/versions/*.py` - Migrations
- `app/**/*.py` - Source code
- README files

---

## 🎉 Success Criteria

Your setup is complete when:
- ✅ `python test_db.py` shows success
- ✅ `alembic current` shows latest version
- ✅ 8 tables exist in WebOrderDB
- ✅ No errors when importing models

**Happy Coding! 🚀**


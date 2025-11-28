"""
Test database connection to SQL Server.
Run: python test_db.py
"""
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

print("=" * 60)
print("🔍 TESTING SQL SERVER CONNECTION")
print("=" * 60)
print(f"\n📦 Project: {settings.PROJECT_NAME}")
print(f"🌍 Environment: {settings.ENVIRONMENT}")
print(f"🗄️  Database: {settings.DATABASE_NAME}")
print(f"🔗 Connection URL: {settings.DATABASE_URL[:50]}...")

print("\n" + "=" * 60)
print("⏳ Connecting to database...")
print("=" * 60)

try:
    # Create engine
    engine = create_engine(settings.DATABASE_URL, echo=False)
    
    # Test connection
    with engine.connect() as conn:
        # Get SQL Server version
        result = conn.execute(text("SELECT @@VERSION as version"))
        version = result.fetchone()
        
        # Get database name
        result = conn.execute(text("SELECT DB_NAME() as db_name"))
        db_name = result.fetchone()
        
        # Get server name
        result = conn.execute(text("SELECT @@SERVERNAME as server_name"))
        server_name = result.fetchone()
        
        print("\n✅ CONNECTION SUCCESSFUL!")
        print("=" * 60)
        print(f"🖥️  Server: {server_name[0]}")
        print(f"🗄️  Database: {db_name[0]}")
        print(f"\n📌 SQL Server Version:")
        print(f"   {version[0][:100]}...")
        print("\n" + "=" * 60)
        print("✨ Backend is ready to use!")
        print("=" * 60)
        
except Exception as e:
    print("\n❌ CONNECTION FAILED!")
    print("=" * 60)
    print(f"Error: {e}")
    print("\n💡 Troubleshooting:")
    print("   1. Kiểm tra SQL Server đang chạy")
    print("   2. Kiểm tra DATABASE_URL trong .env")
    print("   3. Kiểm tra database 'WebOrderDB' đã tồn tại")
    print("   4. Kiểm tra quyền Windows Authentication")
    print("   5. Thử: ODBC Driver 17 for SQL Server")
    print("=" * 60)
    sys.exit(1)


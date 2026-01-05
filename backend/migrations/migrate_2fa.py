"""Database migration: Add 2FA fields to users table."""
import pyodbc
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_connection_string():
    """Get database connection string from environment."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment")
    
    # Parse mssql+pyodbc URL to pyodbc connection string
    # Format: mssql+pyodbc://SERVER/DATABASE?driver=...&Trusted_Connection=yes
    if database_url.startswith("mssql+pyodbc://"):
        parts = database_url.replace("mssql+pyodbc://", "").split("/")
        server = parts[0]
        db_and_params = parts[1].split("?")
        database = db_and_params[0]
        
        # Build connection string
        conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;TrustServerCertificate=yes"
        return conn_str
    else:
        raise ValueError("Invalid DATABASE_URL format")

def migrate():
    """Run migration to add 2FA fields."""
    try:
        # Connect to database
        conn_str = get_connection_string()
        print(f"🔄 Connecting to database...")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('totp_secret', 'is_2fa_enabled')
        """)
        existing_count = cursor.fetchone()[0]
        
        if existing_count > 0:
            print(f"⚠️  Found {existing_count} existing 2FA columns. Skipping migration.")
            return
        
        print("✅ No existing 2FA columns found. Proceeding with migration...")
        
        # Add totp_secret column
        print("🔄 Adding totp_secret column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD totp_secret NVARCHAR(32) NULL
        """)
        conn.commit()
        print("✅ Added totp_secret column")
        
        # Add is_2fa_enabled column
        print("🔄 Adding is_2fa_enabled column...")
        cursor.execute("""
            ALTER TABLE users 
            ADD is_2fa_enabled BIT NOT NULL DEFAULT 0
        """)
        conn.commit()
        print("✅ Added is_2fa_enabled column")
        
        # Verify migration
        cursor.execute("""
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH, 
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('totp_secret', 'is_2fa_enabled')
        """)
        
        print("\n📊 Migration completed! New columns:")
        for row in cursor.fetchall():
            print(f"   - {row[0]}: {row[1]}{f'({row[2]})' if row[2] else ''} {'NULL' if row[3] == 'YES' else 'NOT NULL'}")
        
        cursor.close()
        conn.close()
        print("\n✅ Migration successful!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    migrate()

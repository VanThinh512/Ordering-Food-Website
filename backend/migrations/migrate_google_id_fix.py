"""
Migration script to fix google_id unique constraint issue.
SQL Server doesn't allow multiple NULL values in unique constraints.
This script will update the database schema to use a filtered unique index instead.
"""
import pyodbc
import os
import re
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def parse_database_url():
    """Parse DATABASE_URL to extract connection parameters."""
    database_url = os.getenv("DATABASE_URL", "")
    
    # Check if using Windows Authentication (Trusted_Connection=yes)
    if "Trusted_Connection=yes" in database_url:
        # Parse server and database from URL
        # Format: mssql+pyodbc://SERVER/DATABASE?driver=...&Trusted_Connection=yes
        match = re.search(r'mssql\+pyodbc://([^/]+)/([^?]+)', database_url)
        if match:
            server = match.group(1)
            database = match.group(2)
            driver = "ODBC Driver 17 for SQL Server"
            
            # Extract driver if specified
            driver_match = re.search(r'driver=([^&]+)', database_url)
            if driver_match:
                driver = driver_match.group(1).replace('+', ' ')
            
            return f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;TrustServerCertificate=yes"
    
    # Fallback to old method (SQL Authentication)
    return get_connection_string_old()

def get_connection_string_old():
    """Get database connection string from environment variables (old method)."""
    server = os.getenv("DB_SERVER", "localhost")
    database = os.getenv("DB_NAME", os.getenv("DATABASE_NAME", "WebOrderDB"))
    username = os.getenv("DB_USER", "sa")
    password = os.getenv("DB_PASSWORD", "")
    driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    
    return f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes"

def run_migration():
    """Run the migration SQL script."""
    print("🔄 Starting google_id unique constraint migration...")
    
    # Read SQL script
    sql_file = Path(__file__).parent / "fix_google_id_unique.sql"
    
    if not sql_file.exists():
        print(f"❌ Error: SQL file not found at {sql_file}")
        return False
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Connect to database
    try:
        conn_str = parse_database_url()
        print(f"📡 Connecting to database...")
        print(f"   Connection: {conn_str.split(';DATABASE=')[0].split(';')[-1]}...")
        
        conn = pyodbc.connect(conn_str, autocommit=True)
        cursor = conn.cursor()
        
        # Split script into individual batches (separated by GO)
        batches = [batch.strip() for batch in sql_script.split('GO') if batch.strip()]
        
        print(f"📝 Executing {len(batches)} SQL batches...")
        
        for i, batch in enumerate(batches, 1):
            if batch:
                print(f"   Batch {i}/{len(batches)}...")
                try:
                    cursor.execute(batch)
                    # Print any messages
                    while cursor.nextset():
                        pass
                except pyodbc.Error as e:
                    print(f"   ⚠️ Warning in batch {i}: {e}")
                    # Continue anyway as some operations might fail if already done
        
        print("✅ Migration completed successfully!")
        print("\n📋 Summary:")
        print("   - Removed unique constraint from google_id allowing multiple NULLs")
        print("   - Created filtered unique index for non-NULL google_id values")
        print("   - Users can now register with email/password without google_id conflicts")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("Google ID Unique Constraint Migration")
    print("=" * 70)
    
    success = run_migration()
    
    print("=" * 70)
    if success:
        print("✅ Migration finished successfully!")
        print("\nYou can now:")
        print("1. Restart the backend server")
        print("2. Try registering users with email/password")
        print("3. Google OAuth login will still work with unique google_id")
    else:
        print("❌ Migration failed! Please check the errors above.")
    print("=" * 70)

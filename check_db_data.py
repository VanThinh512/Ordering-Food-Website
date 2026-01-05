"""Check database orders for statistics."""
import pyodbc
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment from backend directory
backend_dir = Path(__file__).parent / 'backend'
env_file = backend_dir / '.env'
load_dotenv(env_file)

# Get connection string
database_url = os.getenv('DATABASE_URL', '')
print(f"DATABASE_URL found: {bool(database_url)}")

# Parse connection string - handle both formats
server = "LAPTOP-SM7ROTED"
database = "WebOrderDB"

conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;TrustServerCertificate=yes"

print(f"\nConnecting to: {server}/{database}")

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Check orders
    cursor.execute('SELECT COUNT(*) FROM orders')
    total = cursor.fetchone()[0]
    print(f'\n✅ Total orders: {total}')
    
    cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'completed'")
    completed = cursor.fetchone()[0]
    print(f'✅ Completed orders: {completed}')
    
    # Check reservations
    cursor.execute('SELECT COUNT(*) FROM table_reservations')
    total_res = cursor.fetchone()[0]
    print(f'✅ Total reservations: {total_res}')
    
    if total > 0:
        print(f'\n📋 Sample orders:')
        cursor.execute('SELECT TOP 5 id, status, total_amount, completed_at, created_at FROM orders ORDER BY created_at DESC')
        for row in cursor.fetchall():
            print(f'  Order {row[0]}: status={row[1]}, amount={row[2]}đ, completed={row[3]}, created={row[4]}')
    
    if total_res > 0:
        print(f'\n🪑 Sample reservations:')
        cursor.execute('SELECT TOP 5 id, status, start_time FROM table_reservations ORDER BY created_at DESC')
        for row in cursor.fetchall():
            print(f'  Reservation {row[0]}: status={row[1]}, time={row[2]}')
    
    conn.close()
    
    if total == 0:
        print('\n⚠️ WARNING: No orders in database!')
        print('💡 To test statistics, you need to:')
        print('   1. Create some orders through the app')
        print('   2. Update some orders to "completed" status')
        print('   3. Make sure completed_at field is set')
    
    if completed == 0 and total > 0:
        print('\n⚠️ WARNING: No completed orders!')
        print('💡 Revenue chart will be empty because only completed orders count.')
        print('   Run this SQL to mark some orders as completed:')
        print('   UPDATE orders SET status = ''completed'', completed_at = GETDATE() WHERE id IN (1,2,3)')

except Exception as e:
    print(f'\n❌ ERROR: {e}')
    print('\nTroubleshooting:')
    print('1. Check if SQL Server is running')
    print('2. Verify server name in .env file')
    print('3. Check database exists: WebOrderDB')

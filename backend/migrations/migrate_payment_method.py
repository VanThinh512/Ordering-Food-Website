"""Migration script to add payment_method and bank transfer fields to orders table."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import engine

try:
    with engine.connect() as conn:
        print('=== Adding payment_method column ===')
        try:
            conn.exec_driver_sql("""
                ALTER TABLE orders 
                ADD payment_method NVARCHAR(20) NOT NULL DEFAULT 'cash'
            """)
            conn.commit()
            print('✓ payment_method column added')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print('⚠ payment_method column already exists')
            else:
                raise
        
        print('\n=== Adding bank transfer columns ===')
        try:
            conn.exec_driver_sql("""
                ALTER TABLE orders 
                ADD bank_transfer_code NVARCHAR(100) NULL
            """)
            conn.commit()
            print('✓ bank_transfer_code column added')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print('⚠ bank_transfer_code column already exists')
            else:
                raise
        
        try:
            conn.exec_driver_sql("""
                ALTER TABLE orders 
                ADD bank_transfer_verified BIT NOT NULL DEFAULT 0
            """)
            conn.commit()
            print('✓ bank_transfer_verified column added')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print('⚠ bank_transfer_verified column already exists')
            else:
                raise
        
        print('\n=== Creating indexes ===')
        try:
            conn.exec_driver_sql("""
                CREATE INDEX idx_orders_payment_method ON orders(payment_method)
            """)
            conn.commit()
            print('✓ idx_orders_payment_method created')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print('⚠ idx_orders_payment_method already exists')
            else:
                print(f'⚠ Index creation skipped: {e}')
        
        try:
            conn.exec_driver_sql("""
                CREATE INDEX idx_orders_bank_transfer_code ON orders(bank_transfer_code)
            """)
            conn.commit()
            print('✓ idx_orders_bank_transfer_code created')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                print('⚠ idx_orders_bank_transfer_code already exists')
            else:
                print(f'⚠ Index creation skipped: {e}')
        
        print('\n=== Verifying columns ===')
        result = conn.exec_driver_sql("""
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH, 
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'orders' 
                AND COLUMN_NAME IN ('payment_method', 'bank_transfer_code', 'bank_transfer_verified')
            ORDER BY COLUMN_NAME
        """)
        
        print('\nColumns added:')
        for row in result:
            print(f'  Column: {row[0]:25} Type: {row[1]}({row[2] if row[2] else ""})\t Nullable: {row[3]}\t Default: {row[4] or "None"}')
        
        print('\n✅ Migration completed successfully!')
    
except Exception as e:
    print(f'\n❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

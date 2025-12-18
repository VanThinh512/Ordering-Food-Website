"""Test database connection and initialization."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
from sqlmodel import SQLModel


def test_connection():
    """Test database connection."""
    print("Testing database connection...")
    
    try:
        # Test connection
        with engine.connect() as conn:
            print("✓ Database connection successful!")
        
        # Create tables
        print("\nCreating database tables...")
        SQLModel.metadata.create_all(engine)
        print("✓ Tables created successfully!")
        
        # Initialize database with default data
        print("\nInitializing database with default data...")
        db = SessionLocal()
        try:
            init_db(db)
            print("✓ Database initialized successfully!")
        finally:
            db.close()
        
        print("\n" + "="*50)
        print("Database setup completed successfully!")
        print("="*50)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    test_connection()

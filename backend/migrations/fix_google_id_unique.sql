-- Fix google_id unique constraint for SQL Server
-- SQL Server doesn't allow multiple NULL values in unique index
-- This script drops the unique constraint and keeps only the index

-- USE [WebOrderDB];  -- Database is already selected in connection string
-- GO

-- Drop the unique constraint on google_id if it exists
IF EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_users_google_id' 
    AND object_id = OBJECT_ID('dbo.users')
    AND is_unique = 1
)
BEGIN
    PRINT 'Dropping unique index ix_users_google_id...';
    DROP INDEX ix_users_google_id ON dbo.users;
END
GO

-- Recreate as non-unique index
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'ix_users_google_id' 
    AND object_id = OBJECT_ID('dbo.users')
)
BEGIN
    PRINT 'Creating non-unique index ix_users_google_id...';
    CREATE NONCLUSTERED INDEX ix_users_google_id
    ON dbo.users (google_id)
    WHERE google_id IS NOT NULL;  -- Filtered index for SQL Server
END
GO

-- Add a unique constraint only for non-NULL google_id values
-- This is done via filtered unique index in SQL Server
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'uq_users_google_id_notnull' 
    AND object_id = OBJECT_ID('dbo.users')
)
BEGIN
    PRINT 'Creating unique filtered index for non-NULL google_id...';
    CREATE UNIQUE NONCLUSTERED INDEX uq_users_google_id_notnull
    ON dbo.users (google_id)
    WHERE google_id IS NOT NULL;
END
GO

PRINT 'Migration completed successfully!';
GO

-- Add 2FA columns to users table
-- Two-Factor Authentication (2FA) support

-- Add TOTP secret column (stores base32-encoded secret key)
ALTER TABLE users 
ADD totp_secret NVARCHAR(32) NULL;

-- Add 2FA enabled flag
ALTER TABLE users 
ADD is_2fa_enabled BIT NOT NULL DEFAULT 0;

-- Add comment for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'TOTP secret key for 2FA (base32-encoded, 16 chars)', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'users',
    @level2type = N'COLUMN', @level2name = N'totp_secret';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Whether 2FA is enabled for this user', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'users',
    @level2type = N'COLUMN', @level2name = N'is_2fa_enabled';

GO

-- Verify columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users' 
    AND COLUMN_NAME IN ('totp_secret', 'is_2fa_enabled');
GO

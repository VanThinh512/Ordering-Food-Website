-- Add payment_method and bank transfer fields to orders table

-- Add payment_method column
ALTER TABLE orders 
ADD payment_method NVARCHAR(20) NOT NULL DEFAULT 'cash';

-- Add bank transfer info columns
ALTER TABLE orders 
ADD bank_transfer_code NVARCHAR(100) NULL;

ALTER TABLE orders 
ADD bank_transfer_verified BIT NOT NULL DEFAULT 0;

-- Add index
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_bank_transfer_code ON orders(bank_transfer_code);

GO

-- Verify columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'orders' 
    AND COLUMN_NAME IN ('payment_method', 'bank_transfer_code', 'bank_transfer_verified');
GO

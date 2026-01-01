# 2FA Technical Implementation Guide

## 📚 Overview

This document provides technical details about the Two-Factor Authentication (2FA) implementation using TOTP (Time-based One-Time Password) protocol.

## 🏗️ Architecture

### Backend Components

1. **TOTP Service** (`app/services/totp_service.py`)
   - Secret generation (Base32)
   - QR code generation
   - Token verification with time window tolerance

2. **User Model** (`app/models/user.py`)
   ```python
   totp_secret: Optional[str]  # 32-char Base32 secret
   is_2fa_enabled: bool        # 2FA status flag
   ```

3. **API Endpoints** (`app/api/v1/endpoints/auth.py`)
   - `POST /auth/2fa/setup` - Generate secret & QR code
   - `POST /auth/2fa/enable` - Verify token & enable 2FA
   - `POST /auth/2fa/verify` - Verify 2FA during login
   - `POST /auth/2fa/disable` - Disable 2FA (requires password)
   - `GET /auth/2fa/status` - Check 2FA status

### Frontend Components

1. **TwoFactorAuth Component** (`src/components/common/TwoFactorAuth.jsx`)
   - Setup flow with QR code display
   - Enable/disable controls
   - Status indicator

2. **Login Flow** (`src/pages/LoginPage.jsx`)
   - Modified to handle 2FA verification step
   - Conditional rendering based on `requires_2fa` flag

3. **Auth Store** (`src/stores/authStore.js`)
   - Updated login function to detect 2FA requirement

## 🔐 Security Implementation

### TOTP Algorithm
- **Standard**: RFC 6238
- **Time Step**: 30 seconds
- **Digits**: 6
- **Algorithm**: SHA-1 (standard for TOTP)

### Secret Key
- **Length**: 16 characters (Base32)
- **Entropy**: ~80 bits
- **Storage**: Encrypted in database

### Verification Window
```python
# Allow ±30 seconds for clock drift
totp.verify(token, valid_window=1)
```

### Password Protection
- Disabling 2FA requires password confirmation
- Prevents unauthorized removal of security layer

## 🔄 Authentication Flow

### Standard Login with 2FA

```
1. User enters email + password
   ↓
2. Backend validates credentials
   ↓
3. Check is_2fa_enabled
   ↓ (if enabled)
4. Return {requires_2fa: true, user_id: X}
   ↓
5. Frontend shows 2FA input
   ↓
6. User enters 6-digit code
   ↓
7. POST /auth/2fa/verify
   ↓
8. Backend verifies TOTP
   ↓ (if valid)
9. Return JWT token
   ↓
10. User logged in
```

### Google OAuth Login
- Bypasses 2FA (already verified by Google)
- Direct token issuance after OAuth callback

## 📦 Dependencies

### Backend
```
pyotp==2.9.0        # TOTP implementation
qrcode[pil]==7.4.2  # QR code generation
```

### Frontend
- No additional dependencies (uses native fetch/axios)

## 🗄️ Database Schema

```sql
ALTER TABLE users 
ADD totp_secret NVARCHAR(32) NULL;

ALTER TABLE users 
ADD is_2fa_enabled BIT NOT NULL DEFAULT 0;
```

## 🔧 Configuration

### Environment Variables
No additional configuration needed. Uses existing:
- `PROJECT_NAME` - Shown in authenticator app
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token validity

### QR Code Format
```
otpauth://totp/{PROJECT_NAME}:{email}?secret={secret}&issuer={PROJECT_NAME}
```

## 🧪 Testing

### Setup Testing
1. Call `/auth/2fa/setup` to get secret
2. Generate test token:
   ```python
   from services.totp_service import totp_service
   token = totp_service.get_current_token(secret)
   ```
3. Call `/auth/2fa/enable?token={token}`

### Login Testing
1. Enable 2FA for test user
2. Login with email/password
3. Verify `requires_2fa: true` in response
4. Generate token and verify

### Clock Skew Testing
- Adjust system time ±30 seconds
- Token should still validate (window=1)

## 🛡️ Security Considerations

### Best Practices Implemented
✅ Secret stored per-user (not shared)
✅ Time window tolerance for clock drift
✅ Password required to disable
✅ QR code transmitted over HTTPS only
✅ No logging of TOTP secrets or codes

### Potential Improvements
- [ ] Backup codes generation
- [ ] SMS fallback option
- [ ] Recovery email verification
- [ ] Rate limiting on verification attempts
- [ ] IP-based suspicious activity detection

## 📊 API Reference

### POST /auth/2fa/setup
**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,...",
  "message": "Scan QR code..."
}
```

### POST /auth/2fa/enable
**Authentication**: Required (Bearer token)

**Parameters**:
- `token` (string): 6-digit code from authenticator

**Response**:
```json
{
  "message": "2FA enabled successfully",
  "is_2fa_enabled": true
}
```

### POST /auth/2fa/verify
**Authentication**: Not required

**Parameters**:
- `user_id` (int): User ID from login response
- `token` (string): 6-digit 2FA code

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbG...",
  "token_type": "bearer"
}
```

### POST /auth/2fa/disable
**Authentication**: Required (Bearer token)

**Parameters**:
- `password` (string): Current password

**Response**:
```json
{
  "message": "2FA disabled successfully",
  "is_2fa_enabled": false
}
```

### GET /auth/2fa/status
**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "is_2fa_enabled": true,
  "email": "user@example.com"
}
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Token used too early" error
- **Cause**: Clock skew between server and client
- **Solution**: Implemented `clock_skew_in_seconds=10` parameter

**Issue**: QR code not displaying
- **Cause**: Base64 encoding issue
- **Solution**: Check `data:image/png;base64,` prefix

**Issue**: 2FA not triggering on login
- **Cause**: `is_2fa_enabled` not set in database
- **Solution**: Verify database migration ran successfully

## 📝 Migration Steps

1. Install dependencies:
   ```bash
   pip install pyotp==2.9.0 qrcode[pil]==7.4.2
   ```

2. Run database migration:
   ```bash
   python backend/migrations/migrate_2fa.py
   ```

3. Restart backend server

4. Frontend automatically detects new endpoints

## 🔍 Monitoring & Logging

### Events to Monitor
- 2FA setup attempts
- Failed verification attempts
- 2FA disable requests
- Suspicious patterns (multiple failures)

### Suggested Logging
```python
logger.info(f"2FA enabled for user: {user.email}")
logger.warning(f"Failed 2FA attempt for user_id: {user_id}")
logger.info(f"2FA disabled for user: {user.email}")
```

## 📚 References

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [Google Authenticator](https://github.com/google/google-authenticator)
- [pyotp Documentation](https://pyauth.github.io/pyotp/)

---

**Version**: 1.0  
**Last Updated**: 2026-01-01  
**Author**: Development Team

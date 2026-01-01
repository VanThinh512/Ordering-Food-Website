"""TOTP Service for Two-Factor Authentication (2FA)."""
import pyotp
import qrcode
import io
import base64
from typing import Optional, Tuple

from app.core.config import settings


class TOTPService:
    """Service for handling TOTP-based 2FA operations."""

    @staticmethod
    def generate_secret() -> str:
        """
        Generate a new random TOTP secret.
        
        Returns:
            str: Base32-encoded secret key (16 characters)
        """
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(secret: str, email: str) -> str:
        """
        Generate provisioning URI for QR code.
        
        Args:
            secret: TOTP secret key
            email: User's email address
            
        Returns:
            str: Provisioning URI that can be encoded in QR code
        """
        totp = pyotp.TOTP(secret)
        issuer_name = settings.PROJECT_NAME or "WebOrder"
        return totp.provisioning_uri(
            name=email,
            issuer_name=issuer_name
        )

    @staticmethod
    def generate_qr_code(secret: str, email: str) -> str:
        """
        Generate QR code image as base64 string.
        
        Args:
            secret: TOTP secret key
            email: User's email address
            
        Returns:
            str: Base64-encoded PNG image of QR code
        """
        # Get provisioning URI
        uri = TOTPService.get_provisioning_uri(secret, email)
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"

    @staticmethod
    def verify_token(secret: str, token: str, window: int = 1) -> bool:
        """
        Verify a TOTP token.
        
        Args:
            secret: TOTP secret key
            token: 6-digit token from authenticator app
            window: Number of time windows to check (default 1 = ±30 seconds)
            
        Returns:
            bool: True if token is valid, False otherwise
        """
        if not secret or not token:
            return False
            
        try:
            totp = pyotp.TOTP(secret)
            # Verify with time window tolerance for clock drift
            return totp.verify(token, valid_window=window)
        except Exception:
            return False

    @staticmethod
    def get_current_token(secret: str) -> str:
        """
        Get current valid token for testing purposes.
        WARNING: Only use in development!
        
        Args:
            secret: TOTP secret key
            
        Returns:
            str: Current 6-digit token
        """
        totp = pyotp.TOTP(secret)
        return totp.now()


# Create singleton instance
totp_service = TOTPService()

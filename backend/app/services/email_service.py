"""Utility service for sending transactional emails via SMTP."""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Thin SMTP wrapper used for transactional emails."""

    @staticmethod
    def is_configured() -> bool:
        """Check whether SMTP credentials are present."""
        return bool(
            settings.SMTP_HOST
            and settings.SMTP_FROM_EMAIL
            and settings.SMTP_USERNAME
            and settings.SMTP_PASSWORD
        )

    def send_email(
        self,
        *,
        subject: str,
        to_email: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        """Send an email via SMTP. Returns True if the message was sent."""
        if not self.is_configured():
            logger.warning("SMTP settings are not configured; skipping email send.")
            return False

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = formataddr((settings.SMTP_FROM_NAME or "", settings.SMTP_FROM_EMAIL))
        message["To"] = to_email

        if text_body:
            message.attach(MIMEText(text_body, "plain", "utf-8"))
        message.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            if settings.SMTP_USE_SSL:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)

            with server:
                server.ehlo()
                if settings.SMTP_STARTTLS and not settings.SMTP_USE_SSL:
                    server.starttls()
                    server.ehlo()

                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], message.as_string())

            return True
        except Exception:  # noqa: BLE001
            logger.exception("Failed to send email to %s", to_email)
            return False


email_service = EmailService()

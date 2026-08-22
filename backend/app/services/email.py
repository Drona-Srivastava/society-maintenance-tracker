import requests

from app.core.config import settings


def send_password_reset_email(
    email: str,
    otp: str,
) -> None:
    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": "Society Maintenance Tracker",
            "email": settings.EMAIL_FROM,
        },
        "to": [
            {
                "email": email,
            }
        ],
        "subject": "Society Maintenance Tracker - Password Reset OTP",
        "textContent": (
            "Your password reset OTP is:\n\n"
            f"{otp}\n\n"
            "This OTP expires in 10 minutes.\n\n"
            "If you did not request a password reset, "
            "you can safely ignore this email."
        ),
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=10,
    )

    response.raise_for_status()
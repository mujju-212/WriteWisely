"""
services/email_service.py — Send OTP emails via MailerSend API
"""

import random
import httpx
from datetime import datetime, timedelta
from config import MAILERSEND_API_KEY, SENDER_EMAIL, SENDER_NAME, ALLOW_OTP_DEV_FALLBACK, get_db

MAILERSEND_URL = "https://api.mailersend.com/v1/email"


def _console_otp_fallback(email: str, otp: str, reason: str) -> bool:
    """Print OTP to terminal in development when email delivery is unavailable."""
    if ALLOW_OTP_DEV_FALLBACK:
        print(f"[DEV OTP] reason={reason} email={email} otp={otp}")
        return True
    return False


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


async def save_otp(email: str, otp: str, purpose: str = "signup"):
    """Save OTP to database with 10-minute expiry."""
    db = get_db()
    
    # Delete any existing OTP for this email and purpose
    await db.otp_store.delete_many({"email": email, "purpose": purpose})
    
    # Save new OTP
    await db.otp_store.insert_one({
        "email": email,
        "otp": otp,
        "purpose": purpose,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })


async def verify_otp(email: str, otp: str, purpose: str = "signup") -> bool:
    """Verify OTP from database for a given purpose. Returns True if valid and not expired."""
    db = get_db()
    
    otp_doc = await db.otp_store.find_one({
        "email": email,
        "otp": otp,
        "purpose": purpose,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if otp_doc:
        # Delete used OTP
        await db.otp_store.delete_one({"_id": otp_doc["_id"]})
        return True
    
    return False


async def send_otp_email(email: str, otp: str, purpose: str = "signup") -> bool:
    """Send OTP email via MailerSend API."""
    if not MAILERSEND_API_KEY:
        print("❌ MailerSend API key missing. Set MAILERSEND_API_KEY in backend/.env")
        return _console_otp_fallback(email, otp, "missing_api_key")
    if not SENDER_EMAIL:
        print("❌ Sender email missing. Set SENDER_EMAIL in backend/.env")
        return _console_otp_fallback(email, otp, "missing_sender_email")
    
    if purpose == "signup":
        subject = "WriteWisely - Verify Your Email"
        body_text = f"Welcome to WriteWisely! Your verification code is: {otp}"
    else:
        subject = "WriteWisely - Reset Your Password"
        body_text = f"Your password reset code is: {otp}"
    
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; 
                    border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4F46E5; text-align: center;">✍️ WriteWisely</h2>
            <p style="color: #333; font-size: 16px;">{body_text}</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                             color: #4F46E5; background: #EEF2FF; padding: 15px 30px; 
                             border-radius: 8px;">{otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
                This code expires in <strong>10 minutes</strong>.<br>
                If you didn't request this, please ignore this email.
            </p>
        </div>
    </body>
    </html>
    """
    
    # MailerSend API request
    payload = {
        "from": {
            "email": SENDER_EMAIL,
            "name": SENDER_NAME
        },
        "to": [
            {
                "email": email,
                "name": email.split("@")[0]
            }
        ],
        "subject": subject,
        "text": body_text,
        "html": html
    }
    
    headers = {
        "Authorization": f"Bearer {MAILERSEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(MAILERSEND_URL, json=payload, headers=headers)
            
            if response.status_code in [200, 202]:
                print(f"✅ OTP email sent to {email}")
                return True
            else:
                body_text = response.text or ""
                if (
                    ALLOW_OTP_DEV_FALLBACK
                    and response.status_code == 422
                    and "MS42225" in body_text
                ):
                    print(
                        "⚠️ MailerSend trial recipient limit reached. "
                        f"Dev fallback active; OTP for {email}: {otp}"
                    )
                    return True

                print(f"❌ MailerSend error {response.status_code}: {body_text}")
                return _console_otp_fallback(email, otp, f"mailersend_status_{response.status_code}")
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return _console_otp_fallback(email, otp, "exception")

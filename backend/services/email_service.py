"""
services/email_service.py — Send OTP emails via SMTP
"""

import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from config import SMTP_EMAIL, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT, get_db


def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


async def save_otp(email: str, otp: str, purpose: str = "signup"):
    """Save OTP to database with 10-minute expiry."""
    db = get_db()
    
    # Delete any existing OTP for this email
    await db.otp_store.delete_many({"email": email})
    
    # Save new OTP
    await db.otp_store.insert_one({
        "email": email,
        "otp": otp,
        "purpose": purpose,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    })


async def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP from database. Returns True if valid and not expired."""
    db = get_db()
    
    otp_doc = await db.otp_store.find_one({
        "email": email,
        "otp": otp,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if otp_doc:
        # Delete used OTP
        await db.otp_store.delete_one({"_id": otp_doc["_id"]})
        return True
    
    return False


def send_otp_email(email: str, otp: str, purpose: str = "signup"):
    """Send OTP email via SMTP."""
    
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
    
    # Build email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = email
    msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(html, "html"))
    
    # Send
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, email, msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return False

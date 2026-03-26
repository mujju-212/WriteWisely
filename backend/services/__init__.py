from services.llm_service import call_llm, call_llm_chat
from services.checker_service import check_text
from services.email_service import generate_otp, save_otp, verify_otp, send_otp_email
from services.pattern_service import (
    save_errors, get_error_summary, get_top_errors,
    add_credits, update_streak, get_badges, CREDIT_VALUES, BADGES
)

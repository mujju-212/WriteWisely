from datetime import datetime, timezone

import bcrypt
from pymongo import MongoClient


def main() -> None:
    client = MongoClient("mongodb://localhost:27017")
    db = client.writewisely

    email = "demo@writewisely.com"
    password = "Demo@12345"
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.users.update_one(
        {"email": email},
        {
            "$set": {
                "name": "Demo User",
                "email": email,
                "phone": "",
                "password_hash": password_hash,
                "role": "student",
                "email_verified": True,
                "created_at": datetime.now(timezone.utc),
                "last_login": None,
                "profile": {},
                "settings": {},
                "active_session_id": None,
            }
        },
        upsert=True,
    )

    print("SEEDED_USER", email)
    print("PASSWORD", password)


if __name__ == "__main__":
    main()
"""
Comprehensive backend API test runner for WriteWisely.

What this script validates:
- Health and root endpoints
- Auth lifecycle: signup, OTP verify, login, profile, password flows
- Assessment and learning endpoints
- Quiz and assignment submission
- Practice templates and submissions
- Checker API modes (practice_live, practice_analysis, project)
- Project CRUD
- Chat history/send/clear
- Analytics endpoints and settings/export
- Direct MongoDB state checks
- Direct LLM service checks (Gemini/OpenRouter/HF fallback chain)

Run:
  python test_backend_full.py
  python test_backend_full.py --base-url http://127.0.0.1:8000 --skip-direct-llm
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import traceback
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx
from dotenv import load_dotenv
from pymongo import MongoClient


ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")


@dataclass
class TestResult:
    name: str
    ok: bool
    status_code: Optional[int] = None
    duration_ms: Optional[int] = None
    details: str = ""
    response_excerpt: str = ""


class BackendTester:
    def __init__(self, base_url: str, skip_direct_llm: bool = False):
        self.base_url = base_url.rstrip("/")
        self.skip_direct_llm = skip_direct_llm
        self.results: List[TestResult] = []
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None

        suffix = uuid4().hex[:8]
        self.email = f"ww.test.{suffix}@example.com"
        self.name = "WriteWisely Test User"
        self.phone = "9876543210"
        self.password = "TestPass@123"
        self.new_password = "NewTestPass@123"

        self.project_id: Optional[str] = None
        self.practice_task_id: str = "email_01"

        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.mongo_client = MongoClient(mongodb_url, serverSelectionTimeoutMS=5000)
        self.db = self.mongo_client.writewisely

    def _add_result(
        self,
        name: str,
        ok: bool,
        status_code: Optional[int] = None,
        duration_ms: Optional[int] = None,
        details: str = "",
        response_excerpt: str = "",
    ) -> None:
        self.results.append(
            TestResult(
                name=name,
                ok=ok,
                status_code=status_code,
                duration_ms=duration_ms,
                details=details,
                response_excerpt=response_excerpt[:500],
            )
        )

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def _request(self, client: httpx.AsyncClient, method: str, path: str, json_body: Any = None) -> httpx.Response:
        return await client.request(
            method,
            f"{self.base_url}{path}",
            json=json_body,
            headers=self._headers(),
            timeout=35.0,
        )

    def _excerpt(self, response: httpx.Response) -> str:
        try:
            return json.dumps(response.json(), ensure_ascii=True)
        except Exception:
            return response.text

    def _otp_for(self, email: str) -> Optional[str]:
        doc = self.db.otp_store.find_one({"email": email}, sort=[("created_at", -1)])
        return None if not doc else doc.get("otp")

    async def run(self) -> Dict[str, Any]:
        started = datetime.utcnow()

        try:
            self.mongo_client.admin.command("ping")
            self._add_result("db.ping", True, details="MongoDB ping succeeded")
        except Exception as e:
            self._add_result("db.ping", False, details=f"MongoDB ping failed: {e}")

        # Cleanup any stale user with same email (unlikely due uuid, still safe)
        try:
            self.db.users.delete_many({"email": self.email})
            self.db.otp_store.delete_many({"email": self.email})
        except Exception as e:
            self._add_result("db.cleanup.pre", False, details=f"Pre-cleanup failed: {e}")

        async with httpx.AsyncClient() as client:
            await self._test_health(client)
            await self._test_auth_flow(client)
            if self.token:
                await self._test_profile_and_settings(client)
                await self._test_assessment(client)
                await self._test_learning(client)
                await self._test_checker(client)
                await self._test_practice(client)
                await self._test_projects(client)
                await self._test_chat(client)
                await self._test_analytics(client)
                await self._test_forgot_reset_flow(client)
                await self._test_db_state_checks()
                if not self.skip_direct_llm:
                    await self._test_direct_llm()
                await self._test_delete_account(client)

        ended = datetime.utcnow()
        return self._build_report(started, ended)

    async def _test_health(self, client: httpx.AsyncClient) -> None:
        for name, path in [("api.root", "/"), ("api.health", "/health")]:
            t0 = datetime.utcnow()
            try:
                r = await self._request(client, "GET", path)
                ms = int((datetime.utcnow() - t0).total_seconds() * 1000)
                ok = r.status_code == 200
                self._add_result(name, ok, r.status_code, ms, response_excerpt=self._excerpt(r))
            except Exception as e:
                self._add_result(name, False, details=str(e))

    async def _test_auth_flow(self, client: httpx.AsyncClient) -> None:
        payload = {
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "password": self.password,
            "role": "student",
        }

        # signup
        t0 = datetime.utcnow()
        r = await self._request(client, "POST", "/api/auth/signup", payload)
        self._add_result(
            "auth.signup",
            r.status_code == 200,
            r.status_code,
            int((datetime.utcnow() - t0).total_seconds() * 1000),
            response_excerpt=self._excerpt(r),
        )

        # verify otp from DB
        otp = self._otp_for(self.email)
        if not otp:
            self._add_result("auth.otp.fetch", False, details="OTP not found in otp_store")
            return
        self._add_result("auth.otp.fetch", True, details="OTP fetched from otp_store")

        # verify otp endpoint
        t0 = datetime.utcnow()
        r = await self._request(client, "POST", "/api/auth/verify-otp", {"email": self.email, "otp": otp})
        ok = r.status_code == 200 and "token" in (r.json() if r.headers.get("content-type", "").startswith("application/json") else {})
        if ok:
            body = r.json()
            self.token = body.get("token")
            self.user_id = body.get("user", {}).get("id")
        self._add_result(
            "auth.verify_otp",
            ok,
            r.status_code,
            int((datetime.utcnow() - t0).total_seconds() * 1000),
            response_excerpt=self._excerpt(r),
        )

        # login
        t0 = datetime.utcnow()
        r = await self._request(client, "POST", "/api/auth/login", {"email": self.email, "password": self.password})
        ok = r.status_code == 200 and "token" in (r.json() if "application/json" in r.headers.get("content-type", "") else {})
        if ok:
            self.token = r.json().get("token")
        self._add_result(
            "auth.login",
            ok,
            r.status_code,
            int((datetime.utcnow() - t0).total_seconds() * 1000),
            response_excerpt=self._excerpt(r),
        )

    async def _test_profile_and_settings(self, client: httpx.AsyncClient) -> None:
        # profile get
        r = await self._request(client, "GET", "/api/auth/profile")
        self._add_result("auth.profile.get", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

        # profile update
        r = await self._request(client, "PUT", "/api/auth/profile", {"name": "WriteWisely API Tester", "role": "professional"})
        self._add_result("auth.profile.update", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_assessment(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "GET", "/api/auth/assessment-questions")
        ok = r.status_code == 200 and isinstance(r.json().get("questions", []), list)
        self._add_result("auth.assessment_questions", ok, r.status_code, response_excerpt=self._excerpt(r))

        questions = r.json().get("questions", []) if ok else []
        answers = []
        for q in questions[:6]:
            answers.append({"question_id": q["id"], "selected": q.get("correct", 0)})
        if not answers:
            self._add_result("auth.assessment_submit", False, details="No assessment questions available")
            return

        r = await self._request(client, "POST", "/api/auth/submit-assessment", {"answers": answers})
        ok = r.status_code == 200 and "level" in r.json()
        self._add_result("auth.assessment_submit", ok, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_learning(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "GET", "/api/learning/levels")
        ok = r.status_code == 200 and isinstance(r.json().get("levels", []), list)
        self._add_result("learning.levels", ok, r.status_code, response_excerpt=self._excerpt(r))

        level_id = 1
        r = await self._request(client, "GET", f"/api/learning/levels/{level_id}")
        ok = r.status_code == 200
        self._add_result("learning.lesson_get", ok, r.status_code, response_excerpt=self._excerpt(r))

        # Quiz payload from local file for valid IDs
        quiz_file = ROOT_DIR / "data" / "quizzes" / "quiz_01.json"
        answers = []
        if quiz_file.exists():
            quiz = json.loads(quiz_file.read_text(encoding="utf-8-sig"))
            for q in quiz.get("questions", []):
                answers.append({"question_id": q["id"], "selected": q.get("correct", 0)})

        if answers:
            r = await self._request(client, "POST", f"/api/learning/quiz/{level_id}", {"answers": answers})
            ok = r.status_code == 200 and "percentage" in r.json()
            self._add_result("learning.quiz_submit", ok, r.status_code, response_excerpt=self._excerpt(r))
        else:
            self._add_result("learning.quiz_submit", False, details="Quiz file missing or empty")

        assignment_text = (
            "I recieved your message yesterday and i am writeing this assignment to improve grammar. "
            "This paragraph contains intentional mistakes for testing purpose."
        )
        r = await self._request(client, "POST", f"/api/learning/assignment/{level_id}", {"text": assignment_text})
        ok = r.status_code == 200 and "analysis" in r.json()
        self._add_result("learning.assignment_submit", ok, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_checker(self, client: httpx.AsyncClient) -> None:
        text = "I recieved teh package yesterady and it were very good"
        for mode in ["practice_live", "practice_analysis", "project"]:
            payload = {"text": text, "mode": mode, "context": "email"}
            r = await self._request(client, "POST", "/api/checker/check", payload)
            ok = r.status_code == 200 and isinstance(r.json().get("errors", []), list)
            self._add_result(f"checker.{mode}", ok, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_practice(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "GET", "/api/practice/templates")
        ok = r.status_code == 200 and isinstance(r.json().get("templates", []), list)
        self._add_result("practice.templates", ok, r.status_code, response_excerpt=self._excerpt(r))

        templates = r.json().get("templates", []) if ok else []
        if templates:
            self.practice_task_id = templates[0].get("task_id", self.practice_task_id)

        text = (
            "Subject: Request for day off\n"
            "Dear manager, I am requesting a day off next friday for medical appointment. "
            "I will complete urgent tasks before leave and update my team. Thank you."
        )
        payload = {"task_id": self.practice_task_id, "text": text, "mode": "after_analysis"}
        r = await self._request(client, "POST", "/api/practice/submit", payload)
        ok = r.status_code == 200 and "overall_score" in r.json()
        self._add_result("practice.submit", ok, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_projects(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "POST", "/api/project/create", {"title": "API Test Project", "doc_type": "email"})
        ok = r.status_code == 200 and "id" in r.json()
        if ok:
            self.project_id = r.json()["id"]
        self._add_result("project.create", ok, r.status_code, response_excerpt=self._excerpt(r))

        r = await self._request(client, "GET", "/api/project/list")
        self._add_result("project.list", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

        if self.project_id:
            r = await self._request(client, "GET", f"/api/project/{self.project_id}")
            self._add_result("project.get", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

            r = await self._request(
                client,
                "PUT",
                f"/api/project/{self.project_id}",
                {"title": "API Test Project Updated", "content": "This is a saved project content for API testing."},
            )
            self._add_result("project.update", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_chat(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "GET", "/api/chat/history")
        self._add_result("chat.history.initial", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

        r = await self._request(client, "POST", "/api/chat/send", {"message": "Please suggest how to improve my grammar quickly."})
        ok = r.status_code == 200 and "response" in r.json()
        self._add_result("chat.send", ok, r.status_code, response_excerpt=self._excerpt(r))

        r = await self._request(client, "GET", "/api/chat/history")
        ok = r.status_code == 200 and isinstance(r.json().get("messages", []), list)
        self._add_result("chat.history.after_send", ok, r.status_code, response_excerpt=self._excerpt(r))

        r = await self._request(client, "DELETE", "/api/chat/clear")
        self._add_result("chat.clear", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_analytics(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "GET", "/api/analytics/dashboard")
        ok = r.status_code == 200 and "user_stats" in r.json()
        self._add_result("analytics.dashboard", ok, r.status_code, response_excerpt=self._excerpt(r))

        for period in ["daily", "weekly", "monthly"]:
            r = await self._request(client, "GET", f"/api/analytics/overview?period={period}")
            ok = r.status_code == 200 and "stats" in r.json()
            self._add_result(f"analytics.overview.{period}", ok, r.status_code, response_excerpt=self._excerpt(r))

        r = await self._request(
            client,
            "PUT",
            "/api/analytics/settings",
            {
                "theme": "light",
                "font_size": "large",
                "notifications_enabled": True,
                "email_notifications": True,
                "reminder_time": "08:30",
            },
        )
        self._add_result("analytics.settings_update", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

        r = await self._request(client, "GET", "/api/analytics/export")
        ok = r.status_code == 200 and "learning_progress" in r.json()
        self._add_result("analytics.export", ok, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_forgot_reset_flow(self, client: httpx.AsyncClient) -> None:
        r = await self._request(client, "POST", "/api/auth/forgot-password", {"email": self.email})
        self._add_result("auth.forgot_password", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

        otp = self._otp_for(self.email)
        if not otp:
            self._add_result("auth.reset_password", False, details="No OTP found for reset flow")
            return

        r = await self._request(
            client,
            "POST",
            "/api/auth/reset-password",
            {"email": self.email, "otp": otp, "new_password": self.new_password},
        )
        ok = r.status_code == 200
        self._add_result("auth.reset_password", ok, r.status_code, response_excerpt=self._excerpt(r))

        # login with new password
        r = await self._request(client, "POST", "/api/auth/login", {"email": self.email, "password": self.new_password})
        ok = r.status_code == 200 and "token" in r.json()
        if ok:
            self.token = r.json()["token"]
            self.password = self.new_password
        self._add_result("auth.login.after_reset", ok, r.status_code, response_excerpt=self._excerpt(r))

    async def _test_db_state_checks(self) -> None:
        if not self.user_id:
            self._add_result("db.state.user", False, details="No user_id found to verify DB state")
            return

        # user
        user_doc = self.db.users.find_one({"_id": self._obj_id_or_none(self.user_id)})
        self._add_result("db.state.user", user_doc is not None, details="User document exists" if user_doc else "User missing")

        # expected collections after tests
        checks = {
            "db.state.learning_progress": self.db.learning_progress.count_documents({"user_id": self.user_id}) >= 1,
            "db.state.practice_records": self.db.practice_records.count_documents({"user_id": self.user_id}) >= 1,
            "db.state.chat_history": self.db.chat_history.count_documents({"user_id": self.user_id}) >= 1,
        }
        for name, ok in checks.items():
            self._add_result(name, ok)

    async def _test_direct_llm(self) -> None:
        try:
            from services.llm_service import call_llm, call_llm_chat
        except Exception as e:
            self._add_result("ai.direct.import", False, details=f"Import failed: {e}")
            return

        # structured LLM
        try:
            result = await call_llm(
                "Return valid JSON with keys: errors (array), score (number).",
                "Check this sentence: I recieved teh message yesterday.",
                json_mode=True,
            )
            ok = isinstance(result, dict)
            self._add_result("ai.direct.call_llm", ok, details="Direct LLM call completed", response_excerpt=json.dumps(result, ensure_ascii=True))
        except Exception as e:
            self._add_result("ai.direct.call_llm", False, details=f"Direct LLM call failed: {e}")

        # chat LLM
        try:
            response = await call_llm_chat([
                {"role": "system", "content": "You are a concise writing coach."},
                {"role": "user", "content": "Give 2 tips to avoid spelling mistakes."},
            ])
            ok = isinstance(response, str) and len(response.strip()) > 0
            self._add_result("ai.direct.call_llm_chat", ok, details="Direct chat LLM call completed", response_excerpt=response)
        except Exception as e:
            self._add_result("ai.direct.call_llm_chat", False, details=f"Direct chat LLM call failed: {e}")

    async def _test_delete_account(self, client: httpx.AsyncClient) -> None:
        # delete created project first if still exists
        if self.project_id:
            r = await self._request(client, "DELETE", f"/api/project/{self.project_id}")
            self._add_result("project.delete", r.status_code == 200, r.status_code, response_excerpt=self._excerpt(r))

        # delete account
        r = await self._request(client, "DELETE", "/api/auth/delete-account", {"password": self.password})
        ok = r.status_code == 200
        self._add_result("auth.delete_account", ok, r.status_code, response_excerpt=self._excerpt(r))

        # verify DB cleanup for user
        if self.user_id:
            user_exists = self.db.users.count_documents({"_id": self._obj_id_or_none(self.user_id)}) > 0
            self._add_result("db.cleanup.user_deleted", not user_exists, details="User removed" if not user_exists else "User still exists")

    @staticmethod
    def _obj_id_or_none(value: str):
        try:
            from bson import ObjectId
            return ObjectId(value)
        except Exception:
            return None

    def _build_report(self, started: datetime, ended: datetime) -> Dict[str, Any]:
        total = len(self.results)
        passed = sum(1 for r in self.results if r.ok)
        failed = total - passed

        summary = {
            "started_at": started.isoformat() + "Z",
            "ended_at": ended.isoformat() + "Z",
            "duration_seconds": round((ended - started).total_seconds(), 2),
            "base_url": self.base_url,
            "email_used": self.email,
            "totals": {"total": total, "passed": passed, "failed": failed},
            "pass_rate": round((passed / total * 100), 2) if total else 0,
            "results": [asdict(r) for r in self.results],
        }
        return summary


def write_reports(report: Dict[str, Any]) -> None:
    out_json = ROOT_DIR / "backend_test_report.json"
    out_txt = ROOT_DIR / "backend_test_report.txt"

    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")

    lines = []
    lines.append("WriteWisely Backend Test Report")
    lines.append("=" * 36)
    lines.append(f"Started:   {report['started_at']}")
    lines.append(f"Ended:     {report['ended_at']}")
    lines.append(f"Duration:  {report['duration_seconds']}s")
    lines.append(f"Base URL:  {report['base_url']}")
    lines.append(f"Email:     {report['email_used']}")
    lines.append("")
    totals = report["totals"]
    lines.append(f"Total tests: {totals['total']}")
    lines.append(f"Passed:      {totals['passed']}")
    lines.append(f"Failed:      {totals['failed']}")
    lines.append(f"Pass rate:   {report['pass_rate']}%")
    lines.append("")

    failed_items = [r for r in report["results"] if not r["ok"]]
    passed_items = [r for r in report["results"] if r["ok"]]

    lines.append("Failed Tests")
    lines.append("-" * 36)
    if not failed_items:
        lines.append("None")
    else:
        for r in failed_items:
            lines.append(f"- {r['name']} | status={r.get('status_code')} | details={r.get('details', '')}")

    lines.append("")
    lines.append("Passed Tests")
    lines.append("-" * 36)
    for r in passed_items:
        lines.append(f"- {r['name']}")

    out_txt.write_text("\n".join(lines), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run comprehensive WriteWisely backend API tests")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="Base URL for backend API")
    parser.add_argument(
        "--skip-direct-llm",
        action="store_true",
        help="Skip direct llm_service tests and only validate AI via API endpoints",
    )
    return parser.parse_args()


async def async_main() -> int:
    args = parse_args()
    tester = BackendTester(base_url=args.base_url, skip_direct_llm=args.skip_direct_llm)

    try:
        report = await tester.run()
    except Exception as e:
        report = {
            "started_at": datetime.utcnow().isoformat() + "Z",
            "ended_at": datetime.utcnow().isoformat() + "Z",
            "duration_seconds": 0,
            "base_url": args.base_url,
            "email_used": "n/a",
            "totals": {"total": 1, "passed": 0, "failed": 1},
            "pass_rate": 0,
            "results": [
                {
                    "name": "runner.crash",
                    "ok": False,
                    "status_code": None,
                    "duration_ms": None,
                    "details": f"Unhandled exception: {e}",
                    "response_excerpt": traceback.format_exc(),
                }
            ],
        }

    write_reports(report)

    print(f"Total: {report['totals']['total']} | Passed: {report['totals']['passed']} | Failed: {report['totals']['failed']} | Pass rate: {report['pass_rate']}%")
    print(f"Report JSON: {ROOT_DIR / 'backend_test_report.json'}")
    print(f"Report TXT:  {ROOT_DIR / 'backend_test_report.txt'}")

    return 0 if report["totals"]["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(async_main()))

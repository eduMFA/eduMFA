from sqlalchemy import text

from edumfa.api.health import _get_required_schema_head
from edumfa.models import db

from .base import MyTestCase


class APIHealthTestCase(MyTestCase):
    def _set_schema_head(self, head):
        db.session.execute(
            text(
                "CREATE TABLE IF NOT EXISTS alembic_version ("
                "version_num VARCHAR(32) NOT NULL, "
                "CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
            )
        )
        db.session.execute(text("DELETE FROM alembic_version"))
        db.session.execute(
            text("INSERT INTO alembic_version (version_num) VALUES (:head)"),
            {"head": head},
        )
        db.session.commit()

    def test_00_live_health_is_unauthenticated(self):
        with self.app.test_request_context("/health/live", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code, res.data)
            self.assertEqual({"status": "ok"}, res.json)

    def test_01_ready_health_checks_database(self):
        with self.app.test_request_context("/health/ready", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code, res.data)
            self.assertEqual("ok", res.json["status"])
            self.assertEqual("ok", res.json["checks"]["database"]["status"])
            self.assertNotIn("schema", res.json["checks"])

    def test_02_ready_health_checks_schema_when_requested(self):
        required_head = _get_required_schema_head()
        self._set_schema_head(required_head)

        with self.app.test_request_context("/health/ready?schema=true", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code, res.data)
            self.assertEqual("ok", res.json["status"])
            self.assertEqual("ok", res.json["checks"]["database"]["status"])
            self.assertEqual("ok", res.json["checks"]["schema"]["status"])
            self.assertEqual(required_head, res.json["checks"]["schema"]["required"])
            self.assertEqual(required_head, res.json["checks"]["schema"]["current"])

    def test_03_health_reports_schema_mismatch_when_requested(self):
        self._set_schema_head("wrong_revision")

        with self.app.test_request_context("/health/ready?schema=true", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertEqual(503, res.status_code, res.data)
            self.assertEqual("error", res.json["status"])
            self.assertEqual("ok", res.json["checks"]["database"]["status"])
            self.assertEqual("error", res.json["checks"]["schema"]["status"])

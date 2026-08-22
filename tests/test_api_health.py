from .base import MyTestCase


class APIHealthTestCase(MyTestCase):

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

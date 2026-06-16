"""
Race-condition tests for token validation.

Each test fires N concurrent requests carrying the same OTP value and asserts
that exactly one request succeeds while all duplicates are rejected.

Under SQLite the GIL + SQLite write-level locks serialise the requests, so the
test is deterministic there.  Under PostgreSQL the SELECT FOR UPDATE row-level
lock in _create_token_query(for_update=True) is what enforces the constraint.
"""

import logging
import threading

from edumfa.lib.token import init_token, remove_token
from edumfa.models import db

from .base import MyTestCase

# Number of concurrent threads that will race with the same OTP.
_CONCURRENCY = 4


class RaceConditionValidationTest(MyTestCase):
    
    def setUp(self):
        super().setUp()
        # Set edumfa loggers to DEBUG just for these tests
        for logger_name in logging.root.manager.loggerDict:
            if logger_name.startswith("edumfa"):  # covers all edumfa modules
                logging.getLogger(logger_name).setLevel(logging.DEBUG)


    def tearDown(self):
        # Restore loggers to INFO to not affect other tests
        for logger_name in logging.root.manager.loggerDict:
            if logger_name.startswith("edumfa"):
                logging.getLogger(logger_name).setLevel(logging.INFO)
        super().tearDown()

    
    """Test that concurrent replay attempts are rejected under concurrency."""

    # ------------------------------------------------------------------ #
    # helpers                                                              #
    # ------------------------------------------------------------------ #

    def _run_concurrent_validations(
        self, serial: str, otp: str, n: int
    ) -> list[tuple[bool, dict]]:
        """
        Fire *n* POST /validate/check requests simultaneously using a Barrier
        to maximise overlap between the DB transactions.

        Returns a list of ``(result_value, response_info)`` tuples where
        ``response_info`` contains ``status`` (HTTP status code) and ``body``
        (parsed JSON) for diagnosing failures.
        """
        results: list[tuple[bool, dict]] = []
        errors: list[str] = []
        lock = threading.Lock()
        barrier = threading.Barrier(n)

        def validate() -> None:
            try:
                with self.app.test_client() as client:
                    barrier.wait()  # synchronise all threads to the same instant
                    res = client.post(
                        "/validate/check",
                        data={"serial": serial, "pass": otp},
                    )
                    data = res.get_json() or {}
                    result_obj = data.get("result")
                    if result_obj is None or "value" not in result_obj:
                        raise AssertionError(
                            f"Unexpected response: status={res.status_code}, body={data}"
                        )
                    value = result_obj["value"]
                    with lock:
                        results.append((value, {"status": res.status_code, "body": data}))
            except Exception as exc:
                with lock:
                    errors.append(repr(exc))

        threads = [threading.Thread(target=validate, daemon=True) for _ in range(n)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=30)

        self.assertFalse(errors, f"Unexpected thread exceptions: {errors}")
        self.assertEqual(len(results), n, f"Not all threads finished: {results}")
        return results

    # ------------------------------------------------------------------ #
    # tests                                                                #
    # ------------------------------------------------------------------ #

    def test_hotp_concurrent_replay_is_rejected(self):
        """
        N threads submit the same HOTP OTP value concurrently.
        Exactly one must succeed; all others must be rejected (replay protection).

        The well-known test key at counter 0 produces '755224'.  We use it
        once before the concurrent requests so authentication-related
        tokeninfo rows are created outside the race.  The actual concurrent
        replay then uses counter 1, which produces '287082'.
        """
        if db.session.get_bind().dialect.name == "sqlite":
            self.skipTest("SQLite ignores SELECT FOR UPDATE row locks")

        serial = "RACEHOTP01"
        init_token(
            {"serial": serial, "type": "hotp", "otpkey": self.otpkey, "pin": ""},
        )
        try:
            with self.app.test_client() as client:
                warmup = client.post(
                    "/validate/check",
                    data={"serial": serial, "pass": self.valid_otp_values[0]},
                )
                self.assertTrue(
                    warmup.get_json()["result"]["value"],
                    "Warm-up validation should succeed",
                )

            otp = self.valid_otp_values[1]  # "287082" - counter 1
            results = self._run_concurrent_validations(serial, otp, _CONCURRENCY)

            values = [v for v, _ in results]
            successes = values.count(True)
            self.assertEqual(
                successes,
                1,
                f"Expected exactly 1 successful validation (replay protection), "
                f"got {successes} successes out of {_CONCURRENCY} concurrent requests.\n"
                f"Per-thread responses:\n"
                + "\n".join(
                    f"  [{i}] value={v} status={r['status']} body={r['body']}"
                    for i, (v, r) in enumerate(results)
                ),
            )
        finally:
            # Concurrent requests may have modified rows that the main-thread
            # session cached (e.g. tokeninfo on MariaDB).  Rollback to clear
            # stale state so remove_token() can run cleanly.
            db.session.rollback()
            remove_token(serial)

    def test_hotp_sequential_second_replay_is_rejected(self):
        """
        Sanity-check: a second sequential request with the same (already used)
        OTP value must be rejected.  This is the non-concurrent baseline.
        """
        serial = "RACEHOTP02"
        init_token(
            {"serial": serial, "type": "hotp", "otpkey": self.otpkey, "pin": ""},
        )
        try:
            otp = self.valid_otp_values[0]

            with self.app.test_client() as client:
                r1 = client.post(
                    "/validate/check", data={"serial": serial, "pass": otp}
                )
                self.assertTrue(
                    r1.get_json()["result"]["value"],
                    "First validation should succeed",
                )

                r2 = client.post(
                    "/validate/check", data={"serial": serial, "pass": otp}
                )
                self.assertFalse(
                    r2.get_json()["result"]["value"],
                    "Replay of the same OTP must be rejected",
                )
        finally:
            remove_token(serial)

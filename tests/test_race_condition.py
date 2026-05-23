"""
Race-condition tests for token validation.

Each test fires N concurrent requests carrying the same OTP value and asserts
that exactly one request succeeds while all duplicates are rejected.

Under SQLite the GIL + SQLite write-level locks serialise the requests, so the
test is deterministic there.  Under PostgreSQL the SELECT FOR UPDATE row-level
lock in _create_token_query(for_update=True) is what enforces the constraint.
"""

import threading

from edumfa.lib.token import init_token, remove_token

from .base import MyTestCase

# Number of concurrent threads that will race with the same OTP.
_CONCURRENCY = 4


class RaceConditionValidationTest(MyTestCase):
    """Test that concurrent replay attempts are rejected under concurrency."""

    # ------------------------------------------------------------------ #
    # helpers                                                              #
    # ------------------------------------------------------------------ #

    def _run_concurrent_validations(self, serial: str, otp: str, n: int) -> list[bool]:
        """
        Fire *n* POST /validate/check requests simultaneously using a Barrier
        to maximise overlap between the DB transactions.

        Returns a list of ``result.value`` booleans, one per thread.
        """
        results: list[bool] = []
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
                    value = res.get_json()["result"]["value"]
                    with lock:
                        results.append(value)
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

        The well-known test key at counter 0 produces '755224'.
        """
        serial = "RACEHOTP01"
        init_token(
            {"serial": serial, "type": "hotp", "otpkey": self.otpkey, "pin": ""},
        )
        try:
            otp = self.valid_otp_values[0]  # "755224" — counter 0
            results = self._run_concurrent_validations(serial, otp, _CONCURRENCY)

            successes = results.count(True)
            self.assertEqual(
                successes,
                1,
                f"Expected exactly 1 successful validation (replay protection), "
                f"got {successes} successes out of {_CONCURRENCY} concurrent requests: "
                f"{results}",
            )
        finally:
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

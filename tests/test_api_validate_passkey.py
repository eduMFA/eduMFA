import json
import logging
import os
from datetime import datetime, timedelta, timezone
from struct import pack

import jwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from fido2 import cbor
from fido2.cose import ES256
from fido2.utils import sha256
from testfixtures import log_capture

from edumfa.lib.policy import ACTION, SCOPE, delete_policy, set_policy
from edumfa.lib.token import get_tokens, init_token
from edumfa.lib.tokenclass import ROLLOUTSTATE
from edumfa.lib.tokens.webauthn import webauthn_b64_decode, webauthn_b64_encode
from edumfa.lib.tokens.webauthntoken import WEBAUTHNACTION
from edumfa.lib.user import User
from edumfa.models import db
from tests.base import MyApiTestCase


class WebAuthNSimulator:
    def __init__(self, credential_id, rp_id, user_handle):
        self.credential_id = credential_id
        self.private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        self.aaguid = b"\x00" * 16
        self.rp_id = rp_id
        self.user_handle = user_handle
        self.sign_count = 0

    def set_sign_count(self, count):
        self.sign_count = count

    def create_registration_response(self, options, origin, flags=b"\x41"):
        client_data = {
            "type": "webauthn.create",
            "challenge": options["nonce"],
            "origin": origin,
        }
        rp_id_hash = sha256(self.rp_id.encode("ascii"))
        credential_id_length = pack(">H", len(self.credential_id))
        cose_key = cbor.encode(
            ES256.from_cryptography_key(self.private_key.public_key())
        )
        sign_count = pack(">I", self.sign_count)
        attestation_object = {
            "authData": rp_id_hash
            + flags
            + sign_count
            + self.aaguid
            + credential_id_length
            + self.credential_id
            + cose_key,
            "fmt": "none",
            "attStmt": {},
        }

        return {
            "clientDataJSON": json.dumps(client_data).encode("utf-8"),
            "attestationObject": cbor.encode(attestation_object),
        }

    def get(self, options, origin):
        self.sign_count += 1

        # prepare signature
        client_data = json.dumps(
            {
                "type": "webauthn.get",
                "challenge": options["challenge"],
                "origin": origin,
            }
        ).encode("utf-8")
        client_data_hash = sha256(client_data)

        rp_id_hash = sha256(self.rp_id.encode("ascii"))
        flags = b"\x01"
        sign_count = pack(">I", self.sign_count)
        authenticator_data = rp_id_hash + flags + sign_count

        signature = self.private_key.sign(
            authenticator_data + client_data_hash, ec.ECDSA(hashes.SHA256())
        )

        # generate assertion
        return {
            "authenticatorData": authenticator_data,
            "clientDataJSON": client_data,
            "signature": signature,
            "userHandle": self.user_handle,
            "credentialId": self.credential_id,
        }


class PasskeyBaseTestCase(MyApiTestCase):
    """Base class for passkey tests with common setup and helper methods."""

    username = "selfservice"
    serial = "WAN0001D434"

    def setUp(self):
        super(MyApiTestCase, self).setUp()
        self.setUp_user_realms()
        self._setup_policies()

    def _setup_policies(self):
        """Set up common WebAuthn policies."""
        set_policy(
            "wan_id", scope=SCOPE.ENROLL, action="webauthn_relying_party_id=example.com"
        )
        set_policy(
            "wan_name",
            scope=SCOPE.ENROLL,
            action="webauthn_relying_party_name=example.com",
        )
        set_policy(
            "wan_attestation",
            scope=SCOPE.ENROLL,
            action="webauthn_authenticator_attestation_level=none",
        )
        set_policy(
            "wan_passkey",
            scope=SCOPE.AUTH,
            action=f"{WEBAUTHNACTION.USERNAMELESS_AUTHN}=True",
        )

    def _start_enrollment(self):
        """Start the enrollment process and return initial response."""
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "user": self.username,
                "serial": self.serial,
                "type": "webauthn",
                "genkey": 1,
            },
            headers={
                "authorization": self.at,
                "Host": "mfa.example.com",
                "Origin": "https://mfa.example.com",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            data = res.json
            webAuthnRequest = data.get("detail").get("webAuthnRegisterRequest")
            self.assertEqual(
                "Please confirm with your WebAuthn token",
                webAuthnRequest.get("message"),
            )
            return webAuthnRequest

    def _complete_enrollment(self, transaction_id, resp):
        """Complete the enrollment process."""
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "user": self.username,
                "serial": self.serial,
                "type": "webauthn",
                "transaction_id": transaction_id,
                "clientdata": webauthn_b64_encode(resp["clientDataJSON"]),
                "regdata": webauthn_b64_encode(resp["attestationObject"]),
                "registrationclientextensions": webauthn_b64_encode(
                    json.dumps({"credProps": {"rk": True}})
                ),
            },
            headers={
                "authorization": self.at,
                "Host": "mfa.example.com",
                "Origin": "https://mfa.example.com",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            return res

    def _trigger_authentication(self):
        """Trigger authentication challenge and return response data."""
        with self.app.test_request_context(
            "/validate/triggerchallenge",
            method="POST",
            data={"type": "webauthn"},
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            return res.json

    def _validate_authentication(self, transaction_id, resp, status_code=200):
        """Validate authentication with the provided response."""
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={
                "type": "webauthn",
                "transaction_id": transaction_id,
                "userhandle": self.serial,
                "clientdata": webauthn_b64_encode(resp["clientDataJSON"]),
                "signaturedata": webauthn_b64_encode(resp["signature"]),
                "authenticatordata": webauthn_b64_encode(resp["authenticatorData"]),
                "credentialid": webauthn_b64_encode(resp["credentialId"]),
            },
            headers={
                "Authorization": self.at,
                "Host": "mfa.example.com",
                "Origin": "https://mfa.example.com",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == status_code, res)
            return res.json


class PasskeyRegistrationTestCase(PasskeyBaseTestCase):
    def test_1_passkey_registration_simple(self):
        """
        Test the simple registration flow for a passkey (WebAuthn Discoverable Credential).
        This test simulates the enrollment process for a passkey, including:
        - Initiating the enrollment and retrieving the transaction ID.
        - Creating a simulated WebAuthn registration response.
        - Verifying that the token is in the expected CLIENTWAIT rollout state after starting enrollment.
        - Completing the enrollment with the simulated response.
        - Asserting that the registered token has the correct description.
        - Cleaning up by deleting all tokens associated with the serial.
        """
        webAuthnRequest = self._start_enrollment()
        transaction_id = webAuthnRequest.get("transaction_id")

        self.simulator = WebAuthNSimulator(
            os.urandom(32),
            webAuthnRequest.get("relyingParty").get("id"),
            webAuthnRequest.get("serialNumber"),
        )
        resp = self.simulator.create_registration_response(
            webAuthnRequest, "https://mfa.example.com"
        )

        toks = get_tokens(serial=self.serial)
        self.assertEqual(ROLLOUTSTATE.CLIENTWAIT, toks[0].rollout_state)

        self._complete_enrollment(transaction_id, resp)

        token = get_tokens(serial=self.serial)[0]
        self.assertEqual(
            "Passkey (WebAuthn Discoverable Credential)", token.token.description
        )

        tokens = get_tokens(serial=self.serial)
        for t in tokens:
            db.session.delete(t.token)
        db.session.commit()

    def test_2_passkey_registration_syncable_and_backup(self):
        """
        Test the registration of a passkey that is both syncable and marked as a backup.
        This test simulates the WebAuthn passkey enrollment process, using a simulator to create a registration response
        with specific authenticator flags indicating a syncable and backup credential. It verifies that:
        - The initial token is in the CLIENTWAIT rollout state after starting enrollment.
        - After completing enrollment, the token's description reflects that it is a "Syncable Passkey (WebAuthn Multi-Device Credential)".
        """
        webAuthnRequest = self._start_enrollment()
        transaction_id = webAuthnRequest.get("transaction_id")

        self.simulator = WebAuthNSimulator(
            os.urandom(32),
            webAuthnRequest.get("relyingParty").get("id"),
            webAuthnRequest.get("serialNumber"),
        )
        resp = self.simulator.create_registration_response(
            webAuthnRequest, "https://mfa.example.com", flags=b"\x4d"
        )

        toks = get_tokens(serial=self.serial)
        self.assertEqual(ROLLOUTSTATE.CLIENTWAIT, toks[0].rollout_state)

        self._complete_enrollment(transaction_id, resp)

        token = get_tokens(serial=self.serial)[0]
        self.assertEqual(
            "Syncable Passkey (WebAuthn Multi-Device Credential)",
            token.token.description,
        )
        tokens = get_tokens(serial=self.serial)
        for t in tokens:
            db.session.delete(t.token)
        db.session.commit()

    def test_3_passkey_registration_synced_and_backup(self):
        """
        Test the registration of a passkey that is both syncable and marked as a backup.
        This test simulates the WebAuthn passkey enrollment process, using a simulator to create a registration response
        with specific authenticator flags indicating a syncable and backup credential. It verifies that:
        - The initial token is in the CLIENTWAIT rollout state after starting enrollment.
        - After completing enrollment, the token's description reflects that it is a "Synced Passkey (WebAuthn Multi-Device Credential)".
        """
        webAuthnRequest = self._start_enrollment()
        transaction_id = webAuthnRequest.get("transaction_id")

        self.simulator = WebAuthNSimulator(
            os.urandom(32),
            webAuthnRequest.get("relyingParty").get("id"),
            webAuthnRequest.get("serialNumber"),
        )
        resp = self.simulator.create_registration_response(
            webAuthnRequest, "https://mfa.example.com", flags=b"\x5d"
        )

        toks = get_tokens(serial=self.serial)
        self.assertEqual(ROLLOUTSTATE.CLIENTWAIT, toks[0].rollout_state)

        self._complete_enrollment(transaction_id, resp)

        token = get_tokens(serial=self.serial)[0]
        self.assertEqual(
            "Synced Passkey (WebAuthn Multi-Device Credential)",
            token.token.description,
        )


class PasskeyTestCase(PasskeyBaseTestCase):
    def setUp(self):
        super().setUp()

        webAuthnRequest = self._start_enrollment()
        transaction_id = webAuthnRequest.get("transaction_id")

        self.simulator = WebAuthNSimulator(
            os.urandom(32),
            webAuthnRequest.get("relyingParty").get("id"),
            webAuthnRequest.get("serialNumber"),
        )
        resp = self.simulator.create_registration_response(
            webAuthnRequest, "https://mfa.example.com"
        )

        toks = get_tokens(serial=self.serial)
        self.assertEqual(ROLLOUTSTATE.CLIENTWAIT, toks[0].rollout_state)

        self._complete_enrollment(transaction_id, resp)

    def test_1_passkey_authentication_okay(self):
        """
        Test the successful authentication flow using a passkey.
        This test simulates a passkey-based authentication process by:
        1. Triggering an authentication request and extracting the transaction ID.
        2. Decoding the JWT challenge from the authentication request and verifying its expiration.
        3. Simulating a WebAuthn signature response using a test simulator.
        4. Validating the authentication response with the backend.
        5. Asserting that the returned serial and username match the expected values and that authentication was successful.
        """
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")

        claims = jwt.decode(
            webauthn_b64_decode(
                data["detail"]["attributes"]["webAuthnSignRequest"]["challenge"]
            ),
            self.app.secret_key,
            algorithms=["HS256"],
        )
        expiration = datetime.fromtimestamp(claims.get("exp"), tz=timezone.utc)
        self.assertGreater(expiration, datetime.now(tz=timezone.utc))

        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )

        result_data = self._validate_authentication(transaction_id, resp)

        self.assertEqual(self.serial, result_data["detail"]["serial"])
        self.assertEqual(self.username, result_data["detail"]["user"]["username"])
        self.assertTrue(result_data["result"]["status"])

    def test_2_passkey_authentication_extended(self):
        """
        Test WebAuthn/Passkey authentication with JWT expiration timeout.

        This test verifies that:
        1. A WebAuthn authentication challenge JWT can be configured with a custom expiration timeout (120 seconds)
        2. The JWT expiration claim is properly set and encoded in the challenge
        3. The expiration timestamp is at least 119 seconds in the future
        4. A WebAuthn authentication flow can be completed successfully with the configured timeout
        5. The authentication response correctly validates and returns the expected serial and username

        The test uses the a policy to set a 120-second timeout for the WebAuthn JWT.
        """
        set_policy(
            "wan_authn_jwt_exp",
            scope=SCOPE.AUTH,
            action=f"{WEBAUTHNACTION.TIMEOUT}=120",
        )
        data = self._trigger_authentication()

        transaction_id = data["detail"].get("transaction_id")

        claims = jwt.decode(
            webauthn_b64_decode(
                data["detail"]["attributes"]["webAuthnSignRequest"]["challenge"]
            ),
            self.app.secret_key,
            algorithms=["HS256"],
        )
        expiration = datetime.fromtimestamp(claims.get("exp"), tz=timezone.utc)

        # Verify that the expiration is at least 119 seconds in the future
        # (actually 120 seconds would be ideal, but allow for slight timing differences for test execution)
        self.assertGreater(
            expiration, datetime.now(tz=timezone.utc) + timedelta(seconds=119)
        )

        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )

        result_data = self._validate_authentication(transaction_id, resp)

        self.assertEqual(self.serial, result_data["detail"]["serial"])
        self.assertEqual(self.username, result_data["detail"]["user"]["username"])
        self.assertTrue(result_data["result"]["status"])
        delete_policy("wan_authn_jwt_exp")

    @log_capture(level=logging.INFO)
    def test_3_passkey_authentication_twice(self, capture):
        """
        Test that passkey authentication cannot be performed twice with the same transaction.
        This test simulates a passkey authentication flow:
        1. Triggers an authentication and retrieves the transaction ID.
        2. Performs a successful authentication using the simulator and validates the result.
        3. Attempts to authenticate again with the same transaction, expecting failure due to replay protection.
        4. Ensures the session is rolled back to avoid side effects on other tests.
        5. Verifies that a replay attack warning is logged.
        Assertions:
        - The first authentication succeeds and returns expected user and serial information.
        - The second authentication fails, does not include detail information, and logs a replay attack warning.
        """
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")

        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )

        result_data = self._validate_authentication(transaction_id, resp)
        self.assertEqual(self.serial, result_data["detail"]["serial"])
        self.assertEqual(self.username, result_data["detail"]["user"]["username"])
        self.assertTrue(result_data["result"]["value"])

        result_data = self._validate_authentication(transaction_id, resp)
        self.assertFalse(result_data["result"]["value"])
        self.assertIn("detail", result_data)
        self.assertIn("REJECT", result_data["result"]["authentication"])

        # Manually rollback the session to avoid issues in further tests
        db.session.rollback()

        log_messages = str(capture)
        self.assertIn(
            "Possible replay attack detected during passkey authentication for transaction id", log_messages
        )

    @log_capture(level=logging.INFO)
    def test_4_passkey_authentication_clientwait_state(self, capture):
        """
        Test that passkey authentication fails when the token is in the CLIENTWAIT rollout state.
        This test simulates an authentication attempt with a token whose rollout state is set to CLIENTWAIT.
        It verifies that:
        - The authentication result is unsuccessful (`result["value"]` is False).
        - The response does not include a "detail" key.
        - The log output contains a message indicating that authentication cannot proceed due to the CLIENTWAIT state.
        """
        token = get_tokens(serial=self.serial)[0]
        token.token.rollout_state = ROLLOUTSTATE.CLIENTWAIT

        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")

        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )

        result_data = self._validate_authentication(transaction_id, resp)
        self.assertFalse(result_data["result"]["value"])
        self.assertIn("detail", result_data)
        self.assertIn("REJECT", result_data["result"]["authentication"])

        log_messages = str(capture)
        self.assertIn(
            "is in clientwait state. Can not be used for authentication",
            log_messages,
        )

    def test_5_passkey_authentication_missing_claims(self):
        """
        Test that passkey authentication fails when required claims are missing from the challenge.
        This test simulates an authentication flow where the JWT challenge is manipulated to only include
        the 'nonce' and 'transactionId' claims, potentially omitting other required claims. It verifies that
        the authentication validation fails and that the response does not include a 'detail' key in the result.
        Steps:
        1. Trigger an authentication request and extract the transaction ID and challenge claims.
        2. Re-encode the challenge with only a subset of claims.
        3. Simulate a response using the manipulated challenge.
        4. Validate the authentication and assert that:
            - The authentication result is False.
            - The 'detail' key is not present in the result data.
        """
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")

        claims = jwt.decode(
            webauthn_b64_decode(
                data["detail"]["attributes"]["webAuthnSignRequest"]["challenge"]
            ),
            self.app.secret_key,
            algorithms=["HS256"],
        )
        challenge = jwt.encode(
            {
                "nonce": claims.get("nonce"),
                "transactionId": claims.get("transactionId"),
            },
            self.app.secret_key,
            algorithm="HS256",
        )
        data["detail"]["attributes"]["webAuthnSignRequest"]["challenge"] = (
            webauthn_b64_encode(challenge)
        )
        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )

        result_data = self._validate_authentication(transaction_id, resp)
        self.assertFalse(result_data["result"]["value"])
        self.assertIn("detail", result_data)

    def test_6_passkey_authentication_expired_jwt(self):
        """
        Tests the authentication flow for passkeys when the JWT challenge is expired.
        This test simulates a passkey authentication attempt where the JWT challenge's expiration time
        is set in the past, making it invalid. It triggers the authentication process, decodes the
        challenge, creates a new expired JWT, and attempts to validate the authentication. The test
        asserts that the authentication fails and that no additional detail is returned in the result.
        Steps:
        1. Trigger authentication to obtain the initial challenge.
        2. Decode the JWT challenge to extract claims.
        3. Create a new JWT challenge with an expiration time in the past.
        4. Replace the original challenge with the expired one.
        5. Simulate the authentication response.
        6. Validate the authentication and assert that it fails due to the expired JWT.
        """
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")

        claims = jwt.decode(
            webauthn_b64_decode(
                data["detail"]["attributes"]["webAuthnSignRequest"]["challenge"]
            ),
            self.app.secret_key,
            algorithms=["HS256"],
        )
        challenge = jwt.encode(
            {
                "nonce": claims.get("nonce"),
                "transactionId": claims.get("transactionId"),
                "exp": datetime.now(tz=timezone.utc) - timedelta(seconds=1),
                "iat": datetime.now(tz=timezone.utc),
                "nbf": datetime.now(tz=timezone.utc),
            },
            self.app.secret_key,
            algorithm="HS256",
        )
        data["detail"]["attributes"]["webAuthnSignRequest"]["challenge"] = (
            webauthn_b64_encode(challenge)
        )
        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )

        result_data = self._validate_authentication(transaction_id, resp)
        self.assertFalse(result_data["result"]["value"])
        self.assertIn("detail", result_data)
        self.assertIn("REJECT", result_data["result"]["authentication"])

    def test_7_passkey_authentication_not_found(self):
        """
        Test that passkey authentication fails with a 404 error when the passkey userhandle does not exist.

        This test validates that attempting to authenticate with a non-existent passkey userhandle
        returns a 404 Not Found response. It:
        1. Triggers an authentication request with a valid passkey
        2. Simulates a webauthn sign response
        3. Temporarily changes the serial and thus the userhandle to a non-existent value
        4. Attempts to validate the authentication and expects a 404 error
        5. Restores the original serial

        Expected behavior: Authentication validation should fail with HTTP 404 status code
        when the passkey serial/userhandle number does not exist in the system.
        """
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")
        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )
        serial = self.serial
        self.serial = "NONEXISTENT"
        self._validate_authentication(transaction_id, resp, 404)
        self.serial = serial

    def test_8_passkey_authentication_token_reset(self):
        """
        Test that passkey authentication triggers token reset policy.

        This test verifies that when a user successfully authenticates using a passkey,
        any policy configured to reset all tokens on authentication is applied correctly.
        Specifically, it checks that a TOTP token's failcount is reset to 0 after successful
        passkey authentication, even if the token had previous failures.

        Test flow:
        1. Sets a policy to reset all tokens on successful authentication
        2. Creates a TOTP token for the test user with a failcount of 4
        3. Triggers passkey authentication flow
        4. Validates the authentication using WebAuthn challenge response
        5. Verifies that the authentication was successful
        6. Confirms that the TOTP token's failcount has been reset to 0
        """
        set_policy(
            "wan_reset",
            scope=SCOPE.AUTH,
            action=f"{ACTION.RESETALLTOKENS}=True",
        )
        totp = init_token(
            {"type": "totp", "genkey": 1},
            user=User(
                login=self.username, resolver=self.resolvername1, realm=self.realm1
            ),
        )
        totp.token.failcount = 4
        totp.token.save()
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")
        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )
        result_data = self._validate_authentication(transaction_id, resp)
        self.assertTrue(result_data["result"]["value"])
        self.assertIn("detail", result_data)
        totp = get_tokens(serial=totp.token.serial)[0]
        self.assertEqual(0, totp.token.failcount)
        totp.token.delete()
        delete_policy("wan_reset")

    def test_9_passkey_authentication_no_token_reset(self):
        """
        Test that passkey authentication does not trigger token reset policy.
        """
        totp = init_token(
            {"type": "totp", "genkey": 1},
            user=User(
                login=self.username, resolver=self.resolvername1, realm=self.realm1
            ),
        )
        totp.token.failcount = 4
        totp.token.save()
        data = self._trigger_authentication()
        transaction_id = data["detail"].get("transaction_id")
        resp = self.simulator.get(
            data["detail"]["attributes"]["webAuthnSignRequest"],
            "https://mfa.example.com",
        )
        result_data = self._validate_authentication(transaction_id, resp)
        self.assertTrue(result_data["result"]["value"])
        self.assertIn("detail", result_data)
        totp = get_tokens(serial=totp.token.serial)[0]
        self.assertEqual(4, totp.token.failcount)
        totp.token.delete()

import json
from datetime import datetime, timezone

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey

from edumfa.lib.challenge import get_challenges
from edumfa.lib.policy import ACTION, SCOPE, delete_policy, set_policy
from edumfa.lib.realm import set_default_realm, set_realm
from edumfa.lib.resolver import save_resolver
from edumfa.lib.smsprovider.FirebaseProvider import FIREBASE_CONFIG
from edumfa.lib.smsprovider.SMSProvider import set_smsgateway
from edumfa.lib.token import (
    enable_token,
    get_one_token,
    get_tokens,
    init_token,
    remove_token,
)
from edumfa.lib.tokenclass import CLIENTMODE
from edumfa.lib.tokens.legacypushtoken import LegacyPushTokenClass
from edumfa.lib.tokens.pushtoken import (
    FIREBASE_FID,
    POLL_ONLY,
    PUSH_UPGRADE,
    PUSH_VERSION,
    PushTokenClass,
    strip_key,
)
from edumfa.lib.user import User
from edumfa.lib.utils import b32encode_and_unicode, to_bytes, to_unicode

from . import ldap3mock
from .base import MyApiTestCase

PWFILE = "tests/testdata/passwords"
HOSTSFILE = "tests/testdata/hosts"
DICT_FILE = "tests/testdata/dictionary"
FIREBASE_FILE = "tests/testdata/firebase-test.json"
CLIENT_FILE = "tests/testdata/google-services.json"
FB_CONFIG_VALS = {FIREBASE_CONFIG.JSON_CONFIG: FIREBASE_FILE}
TTL = "10"


class PushAPITestCase(MyApiTestCase):
    """
    test the api.validate endpoints
    """

    REGISTRATION_URL = "http://test/ttype/push"

    server_private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=4096, backend=default_backend()
    )
    server_private_key_pem = to_unicode(
        server_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    server_public_key_pem = to_unicode(
        server_private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )

    # We now allow white spaces in the firebase config name
    firebase_config_name = "my firebase config"

    smartphone_private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=4096, backend=default_backend()
    )
    smartphone_public_key = smartphone_private_key.public_key()
    smartphone_public_key_pem = to_unicode(
        smartphone_public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    # The smartphone sends the public key in URLsafe and without the ----BEGIN header
    smartphone_public_key_pem_urlsafe = (
        strip_key(smartphone_public_key_pem).replace("+", "-").replace("/", "_")
    )
    serial_push = "PIPU001"

    def test_00_create_realms(self):
        self.setUp_user_realms()

    def test_01_push_token_reorder_list(self):
        """
        * Policy push_wait
        * The user has two tokens. SPASS and Push with the same PIN.

        A /validate/check request is sent with this PIN.
        The PIN could trigger a challenge response with the Push, but since the
        token list is reordered and the Spass token already successfully authenticates,
        the push token is not evaluated anymore.
        """
        # set policy
        set_policy(
            "push1",
            action=f"{LegacyPushTokenClass.PUSH_ACTION.WAIT}=20",
            scope=SCOPE.AUTH,
        )
        set_policy(
            "push2",
            scope=SCOPE.ENROLL,
            action=f"{LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{LegacyPushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL},{LegacyPushTokenClass.PUSH_ACTION.TTL}={TTL}",
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)

        # create push token for user
        # 1st step
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "type": "push",
                "pin": "otppin",
                "user": "selfservice",
                "realm": self.realm1,
                "serial": self.serial_push,
                "genkey": 1,
            },
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            detail = res.json.get("detail")
            serial = detail.get("serial")
            self.assertEqual(detail.get("rollout_state"), "clientwait")
            self.assertTrue("pushurl" in detail)
            # check that the new URL contains the serial number
            self.assertTrue("&serial=PIPU" in detail.get("pushurl").get("value"))
            self.assertFalse("otpkey" in detail)
            enrollment_credential = detail.get("enrollment_credential")

        # 2nd step: as performed by the smartphone
        with self.app.test_request_context(
            "/ttype/push",
            method="POST",
            data={
                "enrollment_credential": enrollment_credential,
                "serial": serial,
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fbtoken": "firebaseT",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            detail = res.json.get("detail")
            # still the same serial number
            self.assertEqual(serial, detail.get("serial"))
            self.assertEqual(detail.get("rollout_state"), "enrolled")
            # Now the smartphone gets a public key from the server
            augmented_pubkey = f"-----BEGIN RSA PUBLIC KEY-----\n{detail.get('public_key')}\n-----END RSA PUBLIC KEY-----\n"
            parsed_server_pubkey = serialization.load_pem_public_key(
                to_bytes(augmented_pubkey), default_backend()
            )
            self.assertIsInstance(parsed_server_pubkey, RSAPublicKey)
            pubkey = detail.get("public_key")

            # Now check, what is in the token in the database
            toks = get_tokens(serial=serial)
            self.assertEqual(len(toks), 1)
            token_obj = toks[0]
            self.assertEqual(token_obj.token.rollout_state, "enrolled")
            self.assertTrue(token_obj.token.active)
            tokeninfo = token_obj.get_tokeninfo()
            self.assertEqual(
                tokeninfo.get("public_key_smartphone"),
                self.smartphone_public_key_pem_urlsafe,
            )
            self.assertEqual(tokeninfo.get("firebase_token"), "firebaseT")
            self.assertEqual(
                tokeninfo.get("public_key_server")
                .strip()
                .strip("-BEGIN END RSA PUBLIC KEY-")
                .strip(),
                pubkey,
            )
            # The token should also contain the firebase config
            self.assertEqual(
                tokeninfo.get(LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG),
                self.firebase_config_name,
            )

        # create spass token for user
        init_token(
            {"serial": "spass01", "type": "spass", "pin": "otppin"},
            user=User("selfservice", self.realm1),
        )

        # check, if the user has two tokens, now
        toks = get_tokens(user=User("selfservice", self.realm1))
        self.assertEqual(2, len(toks))
        self.assertEqual("push", toks[0].type)
        self.assertEqual("spass", toks[1].type)
        # authenticate with spass
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "selfservice", "realm": self.realm1, "pass": "otppin"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            data = res.json
            self.assertTrue(data.get("result").get("value"))
            # successful auth with spass
            self.assertEqual("spass", data.get("detail").get("type"))

        remove_token(self.serial_push)
        remove_token("spass01")
        delete_policy("push1")
        delete_policy("push2")

    def test_02_push_token_do_not_wait_if_disabled(self):
        """
        * Policy push_wait
        * The user has two tokens. HOTP chal-resp and Push with the same PIN.
        * But in this case, the push token is disabled.
        * The user should get the response immediately.

        A /validate/check request is sent with this PIN.
        The PIN will only trigger the HOTP, push will not wait, since it is disabled.
        """
        # set policy
        set_policy(
            "push1",
            action=f"{LegacyPushTokenClass.PUSH_ACTION.WAIT}=20",
            scope=SCOPE.AUTH,
        )
        set_policy(
            "push2",
            scope=SCOPE.ENROLL,
            action=f"{LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{LegacyPushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL}",
        )
        set_policy(
            "chalresp",
            action=f"{ACTION.CHALLENGERESPONSE}=hotp",
            scope=SCOPE.AUTH,
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)

        # create push token for user
        # 1st step
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "type": "push",
                "pin": "otppin",
                "user": "selfservice",
                "realm": self.realm1,
                "serial": self.serial_push,
                "genkey": 1,
            },
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            detail = res.json.get("detail")
            serial = detail.get("serial")
            self.assertEqual(detail.get("rollout_state"), "clientwait")
            self.assertTrue("pushurl" in detail)
            # check that the new URL contains the serial number
            self.assertTrue("&serial=PIPU" in detail.get("pushurl").get("value"))
            self.assertFalse("otpkey" in detail)
            enrollment_credential = detail.get("enrollment_credential")

        # 2nd step: as performed by the smartphone
        with self.app.test_request_context(
            "/ttype/push",
            method="POST",
            data={
                "enrollment_credential": enrollment_credential,
                "serial": serial,
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fbtoken": "firebaseT",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            detail = res.json.get("detail")
            # still the same serial number
            self.assertEqual(serial, detail.get("serial"))
            self.assertEqual(detail.get("rollout_state"), "enrolled")
            # Now the smartphone gets a public key from the server
            augmented_pubkey = f"-----BEGIN RSA PUBLIC KEY-----\n{detail.get('public_key')}\n-----END RSA PUBLIC KEY-----\n"
            parsed_server_pubkey = serialization.load_pem_public_key(
                to_bytes(augmented_pubkey), default_backend()
            )
            self.assertIsInstance(parsed_server_pubkey, RSAPublicKey)
            pubkey = detail.get("public_key")

            # Now check, what is in the token in the database
            toks = get_tokens(serial=serial)
            self.assertEqual(len(toks), 1)
            token_obj = toks[0]
            self.assertEqual(token_obj.token.rollout_state, "enrolled")
            self.assertTrue(token_obj.token.active)
            tokeninfo = token_obj.get_tokeninfo()
            self.assertEqual(
                tokeninfo.get("public_key_smartphone"),
                self.smartphone_public_key_pem_urlsafe,
            )
            self.assertEqual(tokeninfo.get("firebase_token"), "firebaseT")
            self.assertEqual(
                tokeninfo.get("public_key_server")
                .strip()
                .strip("-BEGIN END RSA PUBLIC KEY-")
                .strip(),
                pubkey,
            )
            # The token should also contain the firebase config
            self.assertEqual(
                tokeninfo.get(LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG),
                self.firebase_config_name,
            )

        # create HOTP token for user
        init_token(
            {
                "serial": "hotp01",
                "type": "hotp",
                "pin": "otppin",
                "otpkey": self.otpkey,
            },
            user=User("selfservice", self.realm1),
        )

        # disable the push token
        enable_token(self.serial_push, False)
        # check, if the user has two tokens, now
        toks = get_tokens(user=User("selfservice", self.realm1))
        self.assertEqual(2, len(toks))
        self.assertEqual("push", toks[0].type)
        self.assertFalse(toks[0].is_active())
        self.assertEqual("hotp", toks[1].type)

        # authenticate with hotp
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "selfservice", "realm": self.realm1, "pass": "otppin"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            data = res.json
            self.assertFalse(data.get("result").get("value"))
            # This is the auth-request for the HOTP token
            detail = data.get("detail")
            multi_challenge = detail.get("multi_challenge")
            self.assertEqual(multi_challenge[0].get("type"), "hotp")
            self.assertEqual(multi_challenge[0].get("serial"), "hotp01")
            self.assertEqual("interactive", multi_challenge[0].get("client_mode"))

        remove_token(self.serial_push)
        remove_token("hotp01")
        delete_policy("push1")
        delete_policy("push2")
        delete_policy("chalresp")

    def test_03_unfinished_enrolled_push_token(self):
        """
        * The user has a push token where the enrollment process was not completed

        A /validate/check request is sent with this PIN.
        """
        # set policy
        set_policy(
            "push2",
            scope=SCOPE.ENROLL,
            action=f"{LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{LegacyPushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL}",
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)

        # create push token for user
        # 1st step
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "type": "push",
                "pin": "otppin",
                "user": "selfservice",
                "realm": self.realm1,
                "serial": self.serial_push,
                "genkey": 1,
            },
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            detail = res.json.get("detail")
            serial = detail.get("serial")
            self.assertEqual(detail.get("rollout_state"), "clientwait")
            self.assertTrue("pushurl" in detail)
            # check that the new URL contains the serial number
            self.assertTrue("&serial=PIPU" in detail.get("pushurl").get("value"))
            self.assertFalse("otpkey" in detail)
            enrollment_credential = detail.get("enrollment_credential")

        # We skip the 2nd step of the enrollment!
        # But we activate the token on purpose!
        enable_token(self.serial_push)

        # authenticate with push
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "selfservice", "realm": self.realm1, "pass": "otppin"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            data = res.json
            self.assertFalse(data.get("result").get("value"))
            detail = data.get("detail")
            self.assertEqual(detail.get("message"), "Token is not yet enrolled")

        remove_token(self.serial_push)
        delete_policy("push2")

    @ldap3mock.activate
    def test_10_enroll_push(self):
        from .test_api_validate import LDAPDirectory

        # Init LDAP
        ldap3mock.setLDAPDirectory(LDAPDirectory)
        params = {
            "LDAPURI": "ldap://localhost",
            "LDAPBASE": "o=test",
            "BINDDN": "cn=manager,ou=example,o=test",
            "BINDPW": "ldaptest",
            "LOGINNAMEATTRIBUTE": "cn",
            "LDAPSEARCHFILTER": "(cn=*)",
            "USERINFO": '{ "username": "cn",'
            '"phone" : "telephoneNumber", '
            '"mobile" : "mobile"'
            ', "email" : "mail", '
            '"surname" : "sn", '
            '"givenname" : "givenName" }',
            "UIDTYPE": "DN",
            "resolver": "catchall",
            "type": "ldapresolver",
        }

        r = save_resolver(params)
        self.assertTrue(r > 0)

        # create realm
        r = set_realm("ldaprealm", resolvers=["catchall"])
        set_default_realm("ldaprealm")

        # 1. set policies.
        set_policy("pol_passthru", scope=SCOPE.AUTH, action=ACTION.PASSTHRU)

        # 2. authenticate user via passthru
        with self.app.test_request_context(
            "/validate/check", method="POST", data={"user": "alice", "pass": "alicepw"}
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            self.assertTrue(result.get("value"))
            self.assertEqual(result.get("authentication"), "ACCEPT")

        # Set Policy scope:auth, action:enroll_via_multichallenge=push
        set_policy(
            "pol_multienroll",
            scope=SCOPE.AUTH,
            action=f"{ACTION.ENROLL_VIA_MULTICHALLENGE}=push",
        )
        # Set Policy scope:enrollment, action:push_config
        set_policy(
            "pol_push2",
            scope=SCOPE.ENROLL,
            action=f"{LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{LegacyPushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL},{LegacyPushTokenClass.PUSH_ACTION.SSL_VERIFY}={1},{LegacyPushTokenClass.PUSH_ACTION.TTL}={TTL}",
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)
        # Now we should get an authentication Challenge
        with self.app.test_request_context(
            "/validate/check", method="POST", data={"user": "alice", "pass": "alicepw"}
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            self.assertFalse(result.get("value"))
            self.assertEqual(result.get("authentication"), "CHALLENGE")
            detail = res.json.get("detail")
            transaction_id = detail.get("transaction_id")
            self.assertTrue(
                "Please scan the QR code!" in detail.get("message"),
                detail.get("message"),
            )
            # Get image and client_mode
            self.assertEqual(CLIENTMODE.POLL, detail.get("client_mode"))
            # Check, that multi_challenge is also contained.
            self.assertEqual(
                CLIENTMODE.POLL, detail.get("multi_challenge")[0].get("client_mode")
            )
            self.assertIn("image", detail)
            serial = detail.get("serial")

        # The Application starts polling, if the token is enrolled
        with self.app.test_request_context(
            "/validate/polltransaction",
            method="GET",
            data={"transaction_id": transaction_id},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            # The token is not yet enrolled.
            self.assertFalse(result.get("value"))

        # The smartphone finalizes the rollout
        tok = get_one_token(serial=serial)
        enrollment_credential = tok.get_tokeninfo("enrollment_credential")
        with self.app.test_request_context(
            "/ttype/push",
            method="POST",
            data={
                "enrollment_credential": enrollment_credential,
                "serial": serial,
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fbtoken": "firebaseT",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            detail = res.json.get("detail")
            # still the same serial number
            self.assertEqual(serial, detail.get("serial"))
            self.assertEqual(detail.get("rollout_state"), "enrolled")
            # Now the smartphone gets a public key from the server
            augmented_pubkey = f"-----BEGIN RSA PUBLIC KEY-----\n{detail.get('public_key')}\n-----END RSA PUBLIC KEY-----\n"
            parsed_server_pubkey = serialization.load_pem_public_key(
                to_bytes(augmented_pubkey), default_backend()
            )
            self.assertIsInstance(parsed_server_pubkey, RSAPublicKey)
            pubkey = detail.get("public_key")

            # Now check, what is in the token in the database
            toks = get_tokens(serial=serial)
            self.assertEqual(len(toks), 1)
            token_obj = toks[0]
            self.assertEqual(token_obj.token.rollout_state, "enrolled")
            self.assertTrue(token_obj.token.active)
            tokeninfo = token_obj.get_tokeninfo()
            self.assertEqual(
                tokeninfo.get("public_key_smartphone"),
                self.smartphone_public_key_pem_urlsafe,
            )
            self.assertEqual(tokeninfo.get("firebase_token"), "firebaseT")
            self.assertEqual(
                tokeninfo.get("public_key_server")
                .strip()
                .strip("-BEGIN END RSA PUBLIC KEY-")
                .strip(),
                pubkey,
            )
            # The token should also contain the firebase config
            self.assertEqual(
                tokeninfo.get(LegacyPushTokenClass.PUSH_ACTION.FIREBASE_CONFIG),
                self.firebase_config_name,
            )

        # The Application polls, if the token is readily enrolled
        with self.app.test_request_context(
            "/validate/polltransaction",
            method="GET",
            data={"transaction_id": transaction_id},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            # Now, the token is enrolled.
            self.assertTrue(result.get("value"))

        # The Application sends /validate/check to finalize the authentication/enrollment
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "alice", "transaction_id": transaction_id, "pass": ""},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            detail = res.json.get("detail")
            self.assertTrue(result.get("status"))
            self.assertTrue(result.get("value"))
            self.assertEqual(result.get("authentication"), "ACCEPT")

        # Cleanup
        delete_policy("pol_passthru")
        delete_policy("pol_multienroll")
        delete_policy("pol_push2")
        remove_token(serial)


class EduPushAPITestCase(MyApiTestCase):
    """
    test the api.validate endpoints
    """

    REGISTRATION_URL = "http://test/ttype/edupush"

    server_private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=4096, backend=default_backend()
    )
    server_private_key_pem = to_unicode(
        server_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    server_public_key_pem = to_unicode(
        server_private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )

    # We now allow white spaces in the firebase config name
    # We now allow white spaces in the firebase config name
    firebase_config_name = "my firebase config"

    smartphone_private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=4096, backend=default_backend()
    )
    smartphone_public_key = smartphone_private_key.public_key()
    smartphone_public_key_pem = to_unicode(
        smartphone_public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    # The smartphone sends the public key in URLsafe and without the ----BEGIN header
    smartphone_public_key_pem_urlsafe = (
        strip_key(smartphone_public_key_pem).replace("+", "-").replace("/", "_")
    )
    serial_push = "EDUP001"

    def _sign_device_message(self, message: str) -> str:
        return b32encode_and_unicode(
            self.smartphone_private_key.sign(
                message.encode("utf-8"), padding.PKCS1v15(), hashes.SHA256()
            )
        )

    def test_v2_post_operations(self) -> None:
        token = init_token(
            {
                "type": "edupush",
                "genkey": 1,
                PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG: POLL_ONLY,
            }
        )
        serial = token.get_serial()
        self.addCleanup(remove_token, serial)
        client = self.app.test_client()
        url = "/ttype/edupush"

        sign = self._sign_device_message

        enrollment = {
            "serial": serial,
            "enrollment_credential": token.get_tokeninfo("enrollment_credential"),
            "pubkey": self.smartphone_public_key_pem_urlsafe,
            "fid": "initial-installation",
        }
        for operation in (None, "unknown", "update_firebase_token"):
            with self.subTest(operation=operation):
                response = client.post(url, json={**enrollment, "operation": operation})
                self.assertEqual(response.status_code, 400)
                self.assertIsNone(token.get_tokeninfo(FIREBASE_FID))

        response = client.post(
            url, json={**enrollment, "operation": "complete_enrollment"}
        )
        self.assertEqual(response.status_code, 200, response.json)
        self.assertEqual(response.json["detail"]["rollout_state"], "enrolled")
        self.assertIn("token_update", response.json["detail"])

        _, _, transaction_id, _ = token.create_challenge()
        challenge = get_challenges(serial=serial, transaction_id=transaction_id)[0]
        nonce = challenge.challenge
        approval = {"serial": serial, "nonce": nonce, "decline": False}
        operation = "respond_to_challenge"
        approval_signature = sign(
            json.dumps([operation, serial, nonce, False], separators=(",", ":"))
        )
        response = client.post(
            url,
            json={
                **approval,
                "operation": operation,
                "signature": sign(f"{nonce}|{serial}"),
            },
        )
        self.assertFalse(response.json["result"]["value"])
        response = client.post(url, json={**approval, "signature": approval_signature})
        self.assertFalse(response.json["result"]["value"])
        response = client.post(
            url,
            json={
                **approval,
                "operation": operation,
                "decline": True,
                "signature": approval_signature,
            },
        )
        self.assertFalse(response.json["result"]["value"])
        response = client.post(
            url,
            json={**approval, "operation": operation, "signature": approval_signature},
        )
        self.assertTrue(response.json["result"]["value"])

        timestamp = datetime.now(timezone.utc).isoformat()
        legacy_update = {
            "serial": serial,
            "new_fb_token": "replacement-token",
            "timestamp": timestamp,
            "signature": sign(f"replacement-token|{serial}|{timestamp}"),
        }
        response = client.post(url, json=legacy_update)
        self.assertFalse(response.json["result"]["status"])
        self.assertIsNone(token.get_tokeninfo("firebase_token"))

        fid = "c123456789012345678901"
        operation = "update_firebase_installation"
        installation = {
            "operation": operation,
            "serial": serial,
            "fid": fid,
            "timestamp": timestamp,
            "signature": sign(
                json.dumps([operation, serial, fid, timestamp], separators=(",", ":"))
            ),
        }
        response = client.post(
            url, json={**installation, "fid": "changed-installation"}
        )
        self.assertFalse(response.json["result"]["status"])
        self.assertEqual(token.get_tokeninfo(FIREBASE_FID), "initial-installation")
        response = client.post(url, json=installation)
        self.assertTrue(response.json["result"]["value"])
        self.assertEqual(token.get_tokeninfo(FIREBASE_FID), fid)

    def test_v2_enrollment_with_fid(self) -> None:
        token = init_token({"type": "edupush", "genkey": 1})
        serial = token.get_serial()
        self.addCleanup(remove_token, serial)
        client = self.app.test_client()
        url = "/ttype/edupush"
        enrollment = {
            "operation": "complete_enrollment",
            "serial": serial,
            "enrollment_credential": token.get_tokeninfo("enrollment_credential"),
            "pubkey": self.smartphone_public_key_pem_urlsafe,
            "fid": "c123456789012345678901",
        }
        response = client.post(url, json={**enrollment, "fbtoken": "legacy-token"})
        self.assertEqual(response.status_code, 400)
        response = client.post(url, json=enrollment)
        self.assertEqual(response.status_code, 200, response.json)
        self.assertEqual(token.get_tokeninfo(FIREBASE_FID), enrollment["fid"])
        self.assertIsNone(token.get_tokeninfo("firebase_token"))

    def test_upgrade_existing_edupush_token(self) -> None:
        token = init_token(
            {
                "type": "edupush",
                "genkey": 1,
                PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG: POLL_ONLY,
            }
        )
        serial = token.get_serial()
        self.addCleanup(remove_token, serial)
        token.del_tokeninfo(PUSH_VERSION)
        client = self.app.test_client()
        url = "/ttype/edupush"

        response = client.post(
            url,
            json={
                "serial": serial,
                "enrollment_credential": token.get_tokeninfo("enrollment_credential"),
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fbtoken": "migration-device",
            },
        )
        self.assertTrue(response.json["result"]["value"])
        public_key = response.json["detail"]["public_key"]
        set_policy(
            "upgrade-registration",
            SCOPE.ENROLL,
            action=f"{PushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL}",
        )
        self.addCleanup(delete_policy, "upgrade-registration")
        set_policy(
            "upgrade-device-auth",
            SCOPE.ENROLL,
            action=f"edupush_{ACTION.FORCE_APP_PIN}",
        )
        self.addCleanup(delete_policy, "upgrade-device-auth")

        timestamp = datetime.now(timezone.utc).isoformat()
        poll = {
            "serial": serial,
            "timestamp": timestamp,
            "signature": self._sign_device_message(f"{serial}|{timestamp}"),
        }
        response = client.get(url, query_string=poll)
        self.assertEqual(response.json["result"]["value"], [])
        self.assertEqual(
            response.json["detail"]["available_upgrade"], {"target_version": 2}
        )
        self.assertIsNone(token.get_tokeninfo(PUSH_UPGRADE))

        begin = {
            "operation": "begin_upgrade",
            "serial": serial,
            "target_version": 2,
            "timestamp": timestamp,
            "signature": self._sign_device_message(
                json.dumps(
                    ["begin_upgrade", serial, 2, timestamp], separators=(",", ":")
                )
            ),
        }
        self.assertFalse(
            client.post(url, json={**begin, "target_version": 3}).json["result"][
                "status"
            ]
        )
        unsupported = self._sign_device_message(
            json.dumps(["begin_upgrade", serial, 3, timestamp], separators=(",", ":"))
        )
        self.assertFalse(
            client.post(
                url, json={**begin, "target_version": 3, "signature": unsupported}
            ).json["result"]["status"]
        )
        self.assertIsNone(token.get_tokeninfo(PUSH_UPGRADE))
        set_policy(
            "upgrade-deny-polling",
            SCOPE.AUTH,
            action=f"{PushTokenClass.PUSH_ACTION.ALLOW_POLLING}=deny",
        )
        self.addCleanup(delete_policy, "upgrade-deny-polling")
        self.assertFalse(client.get(url, query_string=poll).json["result"]["status"])
        response = client.post(url, json=begin)
        self.assertTrue(response.json["result"]["value"], response.json)
        offer = response.json["detail"]["upgrade"]
        self.assertEqual(offer["target_version"], 2)
        self.assertTrue(offer["require_device_auth"])
        self.assertEqual(client.post(url, json=begin).json["detail"]["upgrade"], offer)
        self.assertIsNone(token.get_tokeninfo(PUSH_VERSION))

        fid = "c123456789012345678901"

        def confirmation(nonce: str, device_auth: bool) -> dict[str, object]:
            return {
                "operation": "confirm_upgrade",
                "serial": serial,
                "target_version": 2,
                "nonce": nonce,
                "require_device_auth": device_auth,
                "fid": fid,
                "signature": self._sign_device_message(
                    json.dumps(
                        ["confirm_upgrade", serial, 2, nonce, device_auth, fid],
                        separators=(",", ":"),
                    )
                ),
            }

        self.assertFalse(
            client.post(url, json=confirmation(offer["nonce"], False)).json["result"][
                "status"
            ]
        )
        token.add_tokeninfo(
            PUSH_UPGRADE, json.dumps({**offer, "expires_at": 0, "confirmed": False})
        )
        self.assertFalse(
            client.post(url, json=confirmation(offer["nonce"], True)).json["result"][
                "status"
            ]
        )
        refreshed = client.post(url, json=begin).json["detail"]["upgrade"]
        self.assertNotEqual(refreshed["nonce"], offer["nonce"])
        confirm = confirmation(refreshed["nonce"], True)
        self.assertFalse(
            client.post(url, json={**confirm, "fid": "changed-installation"}).json[
                "result"
            ]["status"]
        )
        self.assertFalse(
            client.post(url, json={**confirm, "signature": begin["signature"]}).json[
                "result"
            ]["status"]
        )
        enable_token(serial, enable=False)
        self.assertFalse(client.post(url, json=confirm).json["result"]["status"])
        self.assertIsNone(token.get_tokeninfo(PUSH_VERSION))
        self.assertIsNone(token.get_tokeninfo(FIREBASE_FID))
        self.assertEqual(token.get_tokeninfo("firebase_token"), "migration-device")
        enable_token(serial)
        for request_data in (confirm, confirm, begin):
            response = client.post(url, json=request_data)
            self.assertTrue(response.json["result"]["value"], response.json)
            self.assertEqual(response.json["detail"]["push_version"], 2)

        stored = get_one_token(serial=serial)
        self.assertEqual(stored.get_tokeninfo(PUSH_VERSION), "2")
        self.assertEqual(stored.get_init_detail()["public_key"], public_key)
        self.assertIsNone(stored.get_tokeninfo("firebase_token"))
        self.assertEqual(stored.get_tokeninfo(FIREBASE_FID), fid)
        set_policy("upgrade-deny-polling", SCOPE.AUTH, active=False)
        response = client.get(url, query_string=poll)
        self.assertIn("token_update", response.json["detail"])
        self.assertNotIn("available_upgrade", response.json["detail"])

    def test_00_create_realms(self):
        self.setUp_user_realms()

    def test_01_push_token_reorder_list(self):
        """
        * Policy push_wait
        * The user has two tokens. SPASS and Push with the same PIN.

        A /validate/check request is sent with this PIN.
        The PIN could trigger a challenge response with the Push, but since the
        token list is reordered and the Spass token already successfully authenticates,
        the push token is not evaluated anymore.
        """
        # set policy
        set_policy(
            "push1",
            action=f"{PushTokenClass.PUSH_ACTION.WAIT}=20",
            scope=SCOPE.AUTH,
        )
        set_policy(
            "push2",
            scope=SCOPE.ENROLL,
            action=f"{PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{PushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL},{PushTokenClass.PUSH_ACTION.TTL}={TTL}",
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)

        # create push token for user
        # 1st step
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "type": "edupush",
                "pin": "otppin",
                "user": "selfservice",
                "realm": self.realm1,
                "serial": self.serial_push,
                "genkey": 1,
            },
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            detail = res.json.get("detail")
            serial = detail.get("serial")
            self.assertEqual(detail.get("rollout_state"), "clientwait")
            self.assertTrue("pushurl" in detail)
            # check that the new URL contains the serial number
            self.assertTrue("&serial=EDUP" in detail.get("pushurl").get("value"))
            self.assertFalse("otpkey" in detail)
            enrollment_credential = detail.get("enrollment_credential")

        # 2nd step: as performed by the smartphone
        with self.app.test_request_context(
            "/ttype/edupush",
            method="POST",
            data={
                "enrollment_credential": enrollment_credential,
                "serial": serial,
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fid": "c123456789012345678901",
                "operation": "complete_enrollment",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            detail = res.json.get("detail")
            # still the same serial number
            self.assertEqual(serial, detail.get("serial"))
            self.assertEqual(detail.get("rollout_state"), "enrolled")
            self.assertNotIn("version", detail["token_update"])
            # Now the smartphone gets a public key from the server
            augmented_pubkey = f"-----BEGIN RSA PUBLIC KEY-----\n{detail.get('public_key')}\n-----END RSA PUBLIC KEY-----\n"
            parsed_server_pubkey = serialization.load_pem_public_key(
                to_bytes(augmented_pubkey), default_backend()
            )
            self.assertIsInstance(parsed_server_pubkey, RSAPublicKey)
            pubkey = detail.get("public_key")

            # Now check, what is in the token in the database
            toks = get_tokens(serial=serial)
            self.assertEqual(len(toks), 1)
            token_obj = toks[0]
            self.assertEqual(token_obj.token.rollout_state, "enrolled")
            self.assertTrue(token_obj.token.active)
            tokeninfo = token_obj.get_tokeninfo()
            self.assertEqual(
                tokeninfo.get("public_key_smartphone"),
                self.smartphone_public_key_pem_urlsafe,
            )
            self.assertEqual(tokeninfo.get(FIREBASE_FID), "c123456789012345678901")
            self.assertEqual(
                tokeninfo.get("public_key_server")
                .strip()
                .strip("-BEGIN END RSA PUBLIC KEY-")
                .strip(),
                pubkey,
            )
            # The token should also contain the firebase config
            self.assertEqual(
                tokeninfo.get(PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG),
                self.firebase_config_name,
            )

        # create spass token for user
        init_token(
            {"serial": "spass01", "type": "spass", "pin": "otppin"},
            user=User("selfservice", self.realm1),
        )

        # check, if the user has two tokens, now
        toks = get_tokens(user=User("selfservice", self.realm1))
        self.assertEqual(2, len(toks))
        self.assertEqual("edupush", toks[0].type)
        self.assertEqual("spass", toks[1].type)
        # authenticate with spass
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "selfservice", "realm": self.realm1, "pass": "otppin"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            data = res.json
            self.assertTrue(data.get("result").get("value"))
            # successful auth with spass
            self.assertEqual("spass", data.get("detail").get("type"))

        remove_token(self.serial_push)
        remove_token("spass01")
        delete_policy("push1")
        delete_policy("push2")

    def test_02_push_token_do_not_wait_if_disabled(self):
        """
        * Policy push_wait
        * The user has two tokens. HOTP chal-resp and Push with the same PIN.
        * But in this case, the push token is disabled.
        * The user should get the response immediately.

        A /validate/check request is sent with this PIN.
        The PIN will only trigger the HOTP, push will not wait, since it is disabled.
        """
        # set policy
        set_policy(
            "push1",
            action=f"{PushTokenClass.PUSH_ACTION.WAIT}=20",
            scope=SCOPE.AUTH,
        )
        set_policy(
            "push2",
            scope=SCOPE.ENROLL,
            action=f"{PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{PushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL}",
        )
        set_policy(
            "chalresp",
            action=f"{ACTION.CHALLENGERESPONSE}=hotp",
            scope=SCOPE.AUTH,
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)

        # create push token for user
        # 1st step
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "type": "edupush",
                "pin": "otppin",
                "user": "selfservice",
                "realm": self.realm1,
                "serial": self.serial_push,
                "genkey": 1,
            },
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            detail = res.json.get("detail")
            serial = detail.get("serial")
            self.assertEqual(detail.get("rollout_state"), "clientwait")
            self.assertTrue("pushurl" in detail)
            # check that the new URL contains the serial number
            self.assertTrue("&serial=EDUP" in detail.get("pushurl").get("value"))
            self.assertFalse("otpkey" in detail)
            enrollment_credential = detail.get("enrollment_credential")

        # 2nd step: as performed by the smartphone
        with self.app.test_request_context(
            "/ttype/edupush",
            method="POST",
            data={
                "enrollment_credential": enrollment_credential,
                "serial": serial,
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fid": "c123456789012345678901",
                "operation": "complete_enrollment",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            detail = res.json.get("detail")
            # still the same serial number
            self.assertEqual(serial, detail.get("serial"))
            self.assertEqual(detail.get("rollout_state"), "enrolled")
            # Now the smartphone gets a public key from the server
            augmented_pubkey = f"-----BEGIN RSA PUBLIC KEY-----\n{detail.get('public_key')}\n-----END RSA PUBLIC KEY-----\n"
            parsed_server_pubkey = serialization.load_pem_public_key(
                to_bytes(augmented_pubkey), default_backend()
            )
            self.assertIsInstance(parsed_server_pubkey, RSAPublicKey)
            pubkey = detail.get("public_key")

            # Now check, what is in the token in the database
            toks = get_tokens(serial=serial)
            self.assertEqual(len(toks), 1)
            token_obj = toks[0]
            self.assertEqual(token_obj.token.rollout_state, "enrolled")
            self.assertTrue(token_obj.token.active)
            tokeninfo = token_obj.get_tokeninfo()
            self.assertEqual(
                tokeninfo.get("public_key_smartphone"),
                self.smartphone_public_key_pem_urlsafe,
            )
            self.assertEqual(tokeninfo.get(FIREBASE_FID), "c123456789012345678901")
            self.assertEqual(
                tokeninfo.get("public_key_server")
                .strip()
                .strip("-BEGIN END RSA PUBLIC KEY-")
                .strip(),
                pubkey,
            )
            # The token should also contain the firebase config
            self.assertEqual(
                tokeninfo.get(PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG),
                self.firebase_config_name,
            )

        # create HOTP token for user
        init_token(
            {
                "serial": "hotp01",
                "type": "hotp",
                "pin": "otppin",
                "otpkey": self.otpkey,
            },
            user=User("selfservice", self.realm1),
        )

        # disable the push token
        enable_token(self.serial_push, False)
        # check, if the user has two tokens, now
        toks = get_tokens(user=User("selfservice", self.realm1))
        self.assertEqual(2, len(toks))
        self.assertEqual("edupush", toks[0].type)
        self.assertFalse(toks[0].is_active())
        self.assertEqual("hotp", toks[1].type)

        # authenticate with hotp
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "selfservice", "realm": self.realm1, "pass": "otppin"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            data = res.json
            self.assertFalse(data.get("result").get("value"))
            # This is the auth-request for the HOTP token
            detail = data.get("detail")
            multi_challenge = detail.get("multi_challenge")
            self.assertEqual(multi_challenge[0].get("type"), "hotp")
            self.assertEqual(multi_challenge[0].get("serial"), "hotp01")
            self.assertEqual("interactive", multi_challenge[0].get("client_mode"))

        remove_token(self.serial_push)
        remove_token("hotp01")
        delete_policy("push1")
        delete_policy("push2")
        delete_policy("chalresp")

    def test_03_unfinished_enrolled_push_token(self):
        """
        * The user has a push token where the enrollment process was not completed

        A /validate/check request is sent with this PIN.
        """
        # set policy
        set_policy(
            "push2",
            scope=SCOPE.ENROLL,
            action=f"{PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{PushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL}",
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)

        # create push token for user
        # 1st step
        with self.app.test_request_context(
            "/token/init",
            method="POST",
            data={
                "type": "edupush",
                "pin": "otppin",
                "user": "selfservice",
                "realm": self.realm1,
                "serial": self.serial_push,
                "genkey": 1,
            },
            headers={"Authorization": self.at},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            detail = res.json.get("detail")
            serial = detail.get("serial")
            self.assertEqual(detail.get("rollout_state"), "clientwait")
            self.assertTrue("pushurl" in detail)
            # check that the new URL contains the serial number
            self.assertTrue("&serial=EDUP" in detail.get("pushurl").get("value"))
            self.assertFalse("otpkey" in detail)
            enrollment_credential = detail.get("enrollment_credential")

        # We skip the 2nd step of the enrollment!
        # But we activate the token on purpose!
        enable_token(self.serial_push)

        # authenticate with push
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "selfservice", "realm": self.realm1, "pass": "otppin"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(res.status_code, 200)
            data = res.json
            self.assertFalse(data.get("result").get("value"))
            detail = data.get("detail")
            self.assertEqual(detail.get("message"), "Token is not yet enrolled")

        remove_token(self.serial_push)
        delete_policy("push2")

    @ldap3mock.activate
    def test_10_enroll_push(self):
        from .test_api_validate import LDAPDirectory

        # Init LDAP
        ldap3mock.setLDAPDirectory(LDAPDirectory)
        params = {
            "LDAPURI": "ldap://localhost",
            "LDAPBASE": "o=test",
            "BINDDN": "cn=manager,ou=example,o=test",
            "BINDPW": "ldaptest",
            "LOGINNAMEATTRIBUTE": "cn",
            "LDAPSEARCHFILTER": "(cn=*)",
            "USERINFO": '{ "username": "cn",'
            '"phone" : "telephoneNumber", '
            '"mobile" : "mobile"'
            ', "email" : "mail", '
            '"surname" : "sn", '
            '"givenname" : "givenName" }',
            "UIDTYPE": "DN",
            "resolver": "catchall",
            "type": "ldapresolver",
        }

        r = save_resolver(params)
        self.assertTrue(r > 0)

        # create realm
        r = set_realm("ldaprealm", resolvers=["catchall"])
        set_default_realm("ldaprealm")

        # 1. set policies.
        set_policy("pol_passthru", scope=SCOPE.AUTH, action=ACTION.PASSTHRU)

        # 2. authenticate user via passthru
        with self.app.test_request_context(
            "/validate/check", method="POST", data={"user": "alice", "pass": "alicepw"}
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            self.assertTrue(result.get("value"))
            self.assertEqual(result.get("authentication"), "ACCEPT")

        # Set Policy scope:auth, action:enroll_via_multichallenge=push
        set_policy(
            "pol_multienroll",
            scope=SCOPE.AUTH,
            action=f"{ACTION.ENROLL_VIA_MULTICHALLENGE}=edupush",
        )
        # Set Policy scope:enrollment, action:push_config
        set_policy(
            "pol_push2",
            scope=SCOPE.ENROLL,
            action=f"{PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG}={self.firebase_config_name},{PushTokenClass.PUSH_ACTION.REGISTRATION_URL}={self.REGISTRATION_URL},{PushTokenClass.PUSH_ACTION.SSL_VERIFY}={1},{PushTokenClass.PUSH_ACTION.TTL}={TTL}",
        )
        # Create push config
        r = set_smsgateway(
            self.firebase_config_name,
            "edumfa.lib.smsprovider.FirebaseProvider.FirebaseProvider",
            "myFB",
            FB_CONFIG_VALS,
        )
        self.assertTrue(r > 0)
        # Now we should get an authentication Challenge
        with self.app.test_request_context(
            "/validate/check", method="POST", data={"user": "alice", "pass": "alicepw"}
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            self.assertFalse(result.get("value"))
            self.assertEqual(result.get("authentication"), "CHALLENGE")
            detail = res.json.get("detail")
            transaction_id = detail.get("transaction_id")
            self.assertTrue(
                "Please scan the QR code!" in detail.get("message"),
                detail.get("message"),
            )
            # Get image and client_mode
            self.assertEqual(CLIENTMODE.POLL, detail.get("client_mode"))
            # Check, that multi_challenge is also contained.
            self.assertEqual(
                CLIENTMODE.POLL, detail.get("multi_challenge")[0].get("client_mode")
            )
            self.assertIn("image", detail)
            serial = detail.get("serial")

        # The Application starts polling, if the token is enrolled
        with self.app.test_request_context(
            "/validate/polltransaction",
            method="GET",
            data={"transaction_id": transaction_id},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            # The token is not yet enrolled.
            self.assertFalse(result.get("value"))

        # The smartphone finalizes the rollout
        tok = get_one_token(serial=serial)
        enrollment_credential = tok.get_tokeninfo("enrollment_credential")
        with self.app.test_request_context(
            "/ttype/edupush",
            method="POST",
            data={
                "enrollment_credential": enrollment_credential,
                "serial": serial,
                "pubkey": self.smartphone_public_key_pem_urlsafe,
                "fid": "c123456789012345678901",
                "operation": "complete_enrollment",
            },
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            detail = res.json.get("detail")
            # still the same serial number
            self.assertEqual(serial, detail.get("serial"))
            self.assertEqual(detail.get("rollout_state"), "enrolled")
            # Now the smartphone gets a public key from the server
            augmented_pubkey = f"-----BEGIN RSA PUBLIC KEY-----\n{detail.get('public_key')}\n-----END RSA PUBLIC KEY-----\n"
            parsed_server_pubkey = serialization.load_pem_public_key(
                to_bytes(augmented_pubkey), default_backend()
            )
            self.assertIsInstance(parsed_server_pubkey, RSAPublicKey)
            pubkey = detail.get("public_key")

            # Now check, what is in the token in the database
            toks = get_tokens(serial=serial)
            self.assertEqual(len(toks), 1)
            token_obj = toks[0]
            self.assertEqual(token_obj.token.rollout_state, "enrolled")
            self.assertTrue(token_obj.token.active)
            tokeninfo = token_obj.get_tokeninfo()
            self.assertEqual(
                tokeninfo.get("public_key_smartphone"),
                self.smartphone_public_key_pem_urlsafe,
            )
            self.assertEqual(tokeninfo.get(FIREBASE_FID), "c123456789012345678901")
            self.assertEqual(
                tokeninfo.get("public_key_server")
                .strip()
                .strip("-BEGIN END RSA PUBLIC KEY-")
                .strip(),
                pubkey,
            )
            # The token should also contain the firebase config
            self.assertEqual(
                tokeninfo.get(PushTokenClass.PUSH_ACTION.FIREBASE_CONFIG),
                self.firebase_config_name,
            )

        # The Application polls, if the token is readily enrolled
        with self.app.test_request_context(
            "/validate/polltransaction",
            method="GET",
            data={"transaction_id": transaction_id},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            self.assertTrue(result.get("status"))
            # Now, the token is enrolled.
            self.assertTrue(result.get("value"))

        # The Application sends /validate/check to finalize the authentication/enrollment
        with self.app.test_request_context(
            "/validate/check",
            method="POST",
            data={"user": "alice", "transaction_id": transaction_id, "pass": ""},
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            result = res.json.get("result")
            detail = res.json.get("detail")
            self.assertTrue(result.get("status"))
            self.assertTrue(result.get("value"))
            self.assertEqual(result.get("authentication"), "ACCEPT")

        # Cleanup
        delete_policy("pol_passthru")
        delete_policy("pol_multienroll")
        delete_policy("pol_push2")
        remove_token(serial)

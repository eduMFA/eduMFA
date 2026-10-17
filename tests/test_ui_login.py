"""
This file tests the web UI Login

implementation is contained webui/login.py
"""

import re

import flask_babel as babel

from edumfa.app import create_app
from edumfa.lib.policy import (
    ACTION,
    SCOPE,
    PolicyClass,
    delete_all_policies,
    set_policy,
)
from edumfa.lib.utils import to_unicode
from edumfa.models import db, save_config_timestamp

from .base import MyApiTestCase, MyTestCase


class AlternativeWebUI(MyTestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app("altUI", "")
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()
        # save the current timestamp to the database to avoid hanging cached
        # data
        save_config_timestamp()
        db.session.commit()

    def test_01_normal_login(self):
        # We just test, if the alterrnative page is called
        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertEqual(res.mimetype, "text/html", res)
            self.assertIn(b"This is an alternative UI", res.data)


class LoginUITestCase(MyTestCase):
    def setUp(self):
        super().setUp()
        self.app.config["EDUMFA_REACT_UI"] = True

    def tearDown(self):
        self.app.config.pop("EDUMFA_REACT_UI", None)
        super().tearDown()

    def test_legacy_is_default_and_react_is_opt_in(self):
        self.app.config.pop("EDUMFA_REACT_UI")
        client = self.app.test_client()
        for url in ("/", "/?ui=react"):
            res = client.get(url)
            self.assertIn(b"static/app.js", res.data)
            self.assertNotIn(b"Switch to new UI", res.data)
            self.assertNotIn(b'id="react-root"', res.data)
            self.assertNotIn("Set-Cookie", res.headers)

    def test_switch_interfaces_and_remember_preference(self):
        client = self.app.test_client()
        default = client.get("/")
        self.assertIn(b"static/app.js", default.data)
        self.assertIn(b"Switch to new UI", default.data)
        react = client.get("/?ui=react")
        self.assertIn(b'id="react-root"', react.data)
        self.assertNotIn(b"static/app.js", react.data)
        self.assertIn("edumfa_ui=react", react.headers["Set-Cookie"])
        self.assertIn(b'id="react-root"', client.get("/").data)
        legacy = client.get("/?ui=legacy")
        self.assertIn(b"static/app.js", legacy.data)
        self.assertNotIn(b"static/react-dist/assets/main.js", legacy.data)
        self.assertIn(b"static/app.js", client.get("/").data)

    def test_unknown_ui_does_not_select_a_template_or_set_a_cookie(self):
        with self.app.test_request_context("/?ui=../../deactivated.html"):
            response = self.app.full_dispatch_request()
            self.assertIn(b"static/app.js", response.data)
            self.assertNotIn("Set-Cookie", response.headers)

    def test_legacy_interface_respects_mount_path_and_page_settings(self):
        with self.app.test_request_context(
            "/?ui=legacy", environ_overrides={"SCRIPT_NAME": "/mfa"}
        ):
            response = self.app.full_dispatch_request()
            self.assertIn(b"/mfa/static/app.js", response.data)
            self.assertIn(b'id="REALMS"', response.data)
            self.assertIn(b'id="HSM_READY" value="True"', response.data)
            self.assertIn("Path=/mfa/", response.headers["Set-Cookie"])

    def test_deactivated_ui_cannot_be_bypassed_with_ui_selection(self):
        original = self.app.config.get("EDUMFA_UI_DEACTIVATED")
        self.app.config["EDUMFA_UI_DEACTIVATED"] = True
        try:
            with self.app.test_request_context("/?ui=legacy"):
                response = self.app.full_dispatch_request()
                self.assertIn(b"The eduMFA WebUI is deactivated.", response.data)
                self.assertNotIn(b"Switch to new UI", response.data)
                self.assertNotIn(b"ui-view", response.data)
        finally:
            self.app.config["EDUMFA_UI_DEACTIVATED"] = original

    def test_01_normal_login(self):
        # We just test, if the login page can be called.
        with self.app.test_request_context("/?ui=react", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertEqual(res.mimetype, "text/html", res)
            self.assertTrue(b'id="react-root"' in res.data)
            self.assertTrue(b'id="edumfa-ui-config"' in res.data)
            self.assertTrue(b"static/react-dist/assets/main.css" in res.data)
            self.assertTrue(b"static/react-dist/assets/main.js" in res.data)
            # The default React page does not load the Angular shell.
            self.assertFalse(b"static/templates/menu.html" in res.data)
            self.assertFalse(b"static/app.js" in res.data)

    def test_02_deactivated(self):
        self.app.config["EDUMFA_UI_DEACTIVATED"] = True
        with self.app.test_request_context("/?ui=react", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertEqual(res.mimetype, "text/html", res)
            self.assertTrue(b"The eduMFA WebUI is deactivated." in res.data)
        self.app.config["EDUMFA_UI_DEACTIVATED"] = False

    def test_03_realm_dropdown(self):
        set_policy(
            "realmdrop",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.REALMDROPDOWN}=Hello World",
        )
        with self.app.test_request_context("/?ui=react", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertIsNotNone(
                re.search(r'"realms":\s*\["Hello World"\]', to_unicode(res.data)), res
            )

    def test_05_custom_login_text(self):
        set_policy(
            "logtext",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.LOGIN_TEXT}=Go for it!",
        )
        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertTrue(b"Go for it!" in res.data)

    def test_06_remote_user(self):
        delete_all_policies()
        # test login when no policies are set
        self.assertEqual(len(PolicyClass().policies), 0, PolicyClass().policies)
        with self.app.test_request_context(
            "/?ui=react", method="GET", environ_base={"REMOTE_USER": "foo"}
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertIsNotNone(
                re.search(r'"remote_user":\s*""', to_unicode(res.data)), res
            )

        # test login with remote_user policy set
        set_policy(
            "remote_user",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.REMOTE_USER}=allowed",
        )
        with self.app.test_request_context(
            "/?ui=react", method="GET", environ_base={"REMOTE_USER": "foo"}
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertIsNotNone(
                re.search(r'"remote_user":\s*"foo"', to_unicode(res.data)), res
            )

    def test_07_privacy_statement_link(self):
        set_policy(
            "gdpr_link",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.GDPR_LINK}=https://edumfa.io/",
        )
        with self.app.test_request_context("/?ui=react", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertTrue(b"https://edumfa.io/" in res.data)

    def test_08_ui_config_json(self):
        with self.app.test_request_context("/?ui=react", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            data = to_unicode(res.data)
            self.assertIsNotNone(re.search(r'"hsm_ready":\s*true', data), res)
            self.assertIsNotNone(re.search(r'"logo":\s*"eduMFA-logo.png"', data), res)
            self.assertIsNotNone(re.search(r'"instance":\s*""', data), res)


class LanguageTestCase(MyApiTestCase):
    def test_01_check_for_english_translation(self):
        with self.app.test_request_context(
            "/auth/rights",
            method="GET",
            headers={"Authorization": self.at, "Accept-Language": "en"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(
                res.json["result"]["value"]["totp"],
                "TOTP: Time based One Time Passwords.",
            )


class LanguageGermanTestCase(MyApiTestCase):
    locale = "de"

    def test_01_check_for_german_translation(self):
        with self.app.test_request_context(
            "/auth/rights",
            method="GET",
            headers={"Authorization": self.at, "Accept-Language": "de"},
        ):
            res = self.app.full_dispatch_request()
            self.assertEqual(
                res.json["result"]["value"]["totp"],
                "TOTP: Zeitbasiertes Einmalpasswort.",
            )

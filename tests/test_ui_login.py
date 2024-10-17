# -*- coding: utf-8 -*-

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

    def test_01_normal_login(self):
        # We just test, if the login page can be called.
        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertEqual(res.mimetype, "text/html", res)
            self.assertTrue(b"/static/templates/baseline.html" in res.data)
            self.assertTrue(b"/static/templates/menu.html" in res.data)

    def test_02_deactivated(self):
        self.app.config["EDUMFA_UI_DEACTIVATED"] = True
        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertEqual(res.mimetype, "text/html", res)
            self.assertTrue(b"The eduMFA WebUI is deactivated." in res.data)
        self.app.config["EDUMFA_UI_DEACTIVATED"] = False

    def test_03_realm_dropdown(self):
        set_policy(
            "realmdrop",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.REALMDROPDOWN!s}=Hello World",
        )
        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertIsNotNone(
                re.search(r'id="REALMS" value=".*World.*"', to_unicode(res.data)), res
            )

    def test_04_custom_menu_baseline(self):
        # We provide a non-existing file, so we can not read "eduMFA" in the footer.
        set_policy(
            "custom1",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.CUSTOM_BASELINE!s}=mytemplates/nonexist_base.html",
        )
        set_policy(
            "custom2",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.CUSTOM_MENU!s}=mytemplates/nonexist_menu.html",
        )

        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertTrue(b"/static/mytemplates/nonexist_base.html" in res.data)
            self.assertTrue(b"/static/mytemplates/nonexist_menu.html" in res.data)

    def test_05_custom_login_text(self):
        set_policy(
            "logtext", scope=SCOPE.WEBUI, action=f"{ACTION.LOGIN_TEXT!s}=Go for it!"
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
            "/", method="GET", environ_base={"REMOTE_USER": "foo"}
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertTrue(b'<input type=hidden id=REMOTE_USER value="">' in res.data)

        # test login with remote_user policy set
        set_policy(
            "remote_user", scope=SCOPE.WEBUI, action=f"{ACTION.REMOTE_USER!s}=allowed"
        )
        with self.app.test_request_context(
            "/", method="GET", environ_base={"REMOTE_USER": "foo"}
        ):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertTrue(
                b'<input type=hidden id=REMOTE_USER value="foo">' in res.data
            )

    def test_07_privacy_statement_link(self):
        set_policy(
            "gdpr_link",
            scope=SCOPE.WEBUI,
            action=f"{ACTION.GDPR_LINK!s}=https://edumfa.io/",
        )
        with self.app.test_request_context("/", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertTrue(res.status_code == 200, res)
            self.assertTrue(b"https://edumfa.io/" in res.data)


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

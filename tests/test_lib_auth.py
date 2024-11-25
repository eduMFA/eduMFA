"""
This tests the files
  lib/auth.py and
"""

from flask import current_app

from edumfa.lib.auth import (
    check_webui_user,
    create_db_admin,
    db_admin_exist,
    delete_db_admin,
    verify_db_admin,
)
from edumfa.lib.user import User

from .base import MyTestCase


class AuthTestCase(MyTestCase):
    """
    Test the Auth module
    """

    def test_01_db_admin(self):
        create_db_admin("mytestadmin", email="admin@localhost", password="PSTwort")
        r = verify_db_admin("mytestadmin", "PSTwort")
        self.assertTrue(r)

        self.assertTrue(db_admin_exist("mytestadmin"))
        self.assertFalse(db_admin_exist("noKnownUser"))

        # Delete the admin
        delete_db_admin("mytestadmin")

    def test_02_users(self):
        r, role, detail = check_webui_user(User("cornelius"), "test")
        self.assertFalse(r)
        self.assertEqual(role, "user")

    def test_03_empty_passsword(self):
        create_db_admin("mytestadmin", email="admin@localhost", password="PSTwort")
        r = verify_db_admin("mytestadmin", None)
        self.assertFalse(r)

        # Delete the admin
        delete_db_admin("mytestadmin")

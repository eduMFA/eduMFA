#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2026 eduMFA Project-Team
#
# This code is free software; you can redistribute it and/or
# modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
# License as published by the Free Software Foundation; either
# version 3 of the License, or any later version.
#
# This code is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU AFFERO GENERAL PUBLIC LICENSE for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
"""
Tests for the database migration 1b2262ddbf6b, which stores the credential id
of WebAuthn tokens unencrypted.
"""

import importlib.util
import os
from pathlib import Path

from edumfa.lib.utils import hexlify_and_unicode, to_bytes
from edumfa.models import Token, db

from .base import MyTestCase

MIGRATION_FILE = (
    Path(__file__).resolve().parent.parent
    / "migrations"
    / "versions"
    / "1b2262ddbf6b_.py"
)


def load_migration():
    spec = importlib.util.spec_from_file_location(
        "edumfa_migration_1b2262ddbf6b", MIGRATION_FILE
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class WebAuthnCredentialIdMigrationTestCase(MyTestCase):
    serials = ["WANMIG1", "WANMIG2", "WANMIG3", "HOTPMIG1"]

    def tearDown(self):
        for serial in self.serials:
            Token.query.filter_by(serial=serial).delete()
        db.session.commit()
        super().tearDown()

    def test_01_upgrade_and_downgrade(self):
        migration = load_migration()
        cred_id1 = hexlify_and_unicode(os.urandom(64))
        cred_id2 = hexlify_and_unicode(os.urandom(32))
        hotp_key = "3132333435363738393031323334353637383930"

        # A token enrolled before the migration stores the credential id encrypted
        legacy = Token("WANMIG1", tokentype="webauthn")
        legacy.set_otpkey(cred_id1)
        legacy.count = 42
        legacy.failcount = 3
        legacy.save()
        # A token that already stores the credential id unencrypted
        plain = Token("WANMIG2", tokentype="webauthn")
        plain.set_otpkey(cred_id2, encrypted=False)
        plain.save()
        # A token in the first enrollment step does not have a credential id, yet
        clientwait = Token("WANMIG3", tokentype="webauthn")
        clientwait.rollout_state = "clientwait"
        clientwait.save()
        # Other token types must not be touched
        hotp = Token("HOTPMIG1", tokentype="hotp")
        hotp.set_otpkey(hotp_key)
        hotp.save()
        hotp_key_enc, hotp_key_iv = hotp.key_enc, hotp.key_iv
        db.session.commit()

        migrated, failed = migration.decrypt_credential_ids(db.session.connection())
        db.session.commit()
        self.assertEqual(2, migrated)
        self.assertEqual(0, failed)

        legacy = Token.query.filter_by(serial="WANMIG1").first()
        self.assertFalse(legacy.is_otpkey_encrypted())
        self.assertEqual(cred_id1, legacy.key_enc)
        self.assertEqual("", legacy.key_iv)
        self.assertEqual(to_bytes(cred_id1), legacy.get_otpkey().getKey())
        # The sign counter and the failcounter are preserved
        self.assertEqual(42, legacy.count)
        self.assertEqual(3, legacy.failcount)

        plain = Token.query.filter_by(serial="WANMIG2").first()
        self.assertEqual(cred_id2, plain.key_enc)
        self.assertEqual("", plain.key_iv)

        clientwait = Token.query.filter_by(serial="WANMIG3").first()
        self.assertEqual("", clientwait.key_enc)
        self.assertEqual("", clientwait.key_iv)

        hotp = Token.query.filter_by(serial="HOTPMIG1").first()
        self.assertEqual(hotp_key_enc, hotp.key_enc)
        self.assertEqual(hotp_key_iv, hotp.key_iv)
        self.assertEqual(to_bytes(hotp_key), hotp.get_otpkey().getKey())

        # Running the upgrade again does not change anything
        migrated, failed = migration.decrypt_credential_ids(db.session.connection())
        db.session.commit()
        self.assertEqual(0, migrated)
        self.assertEqual(0, failed)

        # The downgrade encrypts the credential ids again
        migrated = migration.encrypt_credential_ids(db.session.connection())
        db.session.commit()
        self.assertEqual(3, migrated)
        for serial, cred_id in (
            ("WANMIG1", cred_id1),
            ("WANMIG2", cred_id2),
            ("WANMIG3", ""),
        ):
            token = Token.query.filter_by(serial=serial).first()
            self.assertTrue(token.is_otpkey_encrypted(), serial)
            self.assertNotEqual(cred_id, token.key_enc, serial)
            self.assertEqual(to_bytes(cred_id), token.get_otpkey().getKey(), serial)
        legacy = Token.query.filter_by(serial="WANMIG1").first()
        self.assertEqual(42, legacy.count)
        self.assertEqual(3, legacy.failcount)
        hotp = Token.query.filter_by(serial="HOTPMIG1").first()
        self.assertEqual(hotp_key_enc, hotp.key_enc)
        self.assertEqual(hotp_key_iv, hotp.key_iv)

        # Running the downgrade again does not change anything
        migrated = migration.encrypt_credential_ids(db.session.connection())
        db.session.commit()
        self.assertEqual(0, migrated)

    def test_02_broken_token_is_skipped(self):
        migration = load_migration()
        cred_id = hexlify_and_unicode(os.urandom(64))
        legacy = Token("WANMIG1", tokentype="webauthn")
        legacy.set_otpkey(cred_id)
        legacy.save()
        # A token with a corrupt key can not be decrypted
        broken = Token("WANMIG2", tokentype="webauthn")
        broken.key_enc = "00"
        broken.key_iv = hexlify_and_unicode(os.urandom(16))
        broken.save()
        db.session.commit()

        migrated, failed = migration.decrypt_credential_ids(db.session.connection())
        db.session.commit()
        self.assertEqual(1, migrated)
        self.assertEqual(1, failed)

        legacy = Token.query.filter_by(serial="WANMIG1").first()
        self.assertFalse(legacy.is_otpkey_encrypted())
        self.assertEqual(cred_id, legacy.key_enc)
        # The broken token is left untouched
        broken = Token.query.filter_by(serial="WANMIG2").first()
        self.assertTrue(broken.is_otpkey_encrypted())
        self.assertEqual("00", broken.key_enc)

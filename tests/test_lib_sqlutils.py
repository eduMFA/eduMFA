"""
This file contains the tests for lib/sqlutils.py
"""

import tempfile
import unittest
import warnings
from datetime import datetime
from unittest.mock import MagicMock

from sqlalchemy import create_engine, text
from sqlalchemy.exc import MultipleResultsFound
from sqlalchemy.testing import AssertsCompiledSQL

from edumfa.lib.sqlutils import DeleteLimit, delete_matching_rows, is_db_stamped
from edumfa.models import Audit as LogEntry

from .base import MyTestCase


class SQLUtilsCompilationTestCase(MyTestCase, AssertsCompiledSQL):
    def test_01_delete_limit(self):
        stmt = DeleteLimit(LogEntry.__table__, LogEntry.id < 100)
        self.assertEqual(stmt.limit, 1000)
        stmt = DeleteLimit(LogEntry.__table__, LogEntry.id < 100, 1234)
        self.assertEqual(stmt.limit, 1234)
        with self.assertRaises(RuntimeError):
            DeleteLimit(LogEntry.__table__, LogEntry.id < 100, None)
        with self.assertRaises(RuntimeError):
            DeleteLimit(LogEntry.__table__, LogEntry.id < 100, "not an integer")
        with self.assertRaises(RuntimeError):
            DeleteLimit(LogEntry.__table__, LogEntry.id < 100, 0)
        with self.assertRaises(RuntimeError):
            DeleteLimit(LogEntry.__table__, LogEntry.id < 100, -10)

    def test_02_compile_delete_limit(self):
        now = datetime.now()
        stmt_age = DeleteLimit(LogEntry.__table__, LogEntry.date < now)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=BytesWarning)
            self.assert_compile(
                stmt_age,
                "DELETE FROM mfa_audit WHERE mfa_audit.id IN "
                "(SELECT mfa_audit.id FROM mfa_audit WHERE "
                "mfa_audit.date < :date_1 LIMIT :param_1)",
                checkparams={"date_1": now, "param_1": 1000},
                dialect="default",
            )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=BytesWarning)
            self.assert_compile(
                stmt_age,
                "DELETE FROM mfa_audit WHERE mfa_audit.date < %s LIMIT 1000",
                checkpositional=(now,),
                dialect="mysql",
            )

        stmt_id = DeleteLimit(LogEntry.__table__, LogEntry.id < 1000, 1234)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=BytesWarning)
            self.assert_compile(
                stmt_id,
                "DELETE FROM mfa_audit WHERE mfa_audit.id IN "
                "(SELECT mfa_audit.id FROM mfa_audit WHERE "
                "mfa_audit.id < :id_1 LIMIT :param_1)",
                checkparams={"id_1": 1000, "param_1": 1234},
                dialect="default",
            )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=BytesWarning)
            self.assert_compile(
                stmt_id,
                "DELETE FROM mfa_audit WHERE mfa_audit.id < %s LIMIT 1234",
                checkpositional=(1000,),
                dialect="mysql",
            )

    def test_03_delete(self):
        session = MagicMock()

        fake_results = [1000, 1000, 500]

        def fake_execute_delete1(stmt):
            result = MagicMock()
            result.rowcount = fake_results.pop(0)
            return result

        session.execute.side_effect = fake_execute_delete1
        # delete chunked
        result = delete_matching_rows(
            session, LogEntry.__table__, LogEntry.id < 1234, 1000
        )
        # was called three times to delete 2500 entries
        self.assertEqual(len(session.execute.mock_calls), 3)
        self.assertEqual(result, 2500)

        session.execute.reset_mock()

        def fake_execute_delete2(stmt):
            result = MagicMock()
            result.rowcount = 2500
            return result

        session.execute.side_effect = fake_execute_delete2
        # delete in one statement
        result = delete_matching_rows(session, LogEntry.__table__, LogEntry.id < 1234)
        self.assertEqual(len(session.execute.mock_calls), 1)
        self.assertEqual(result, 2500)


class DbIsStampedTest(unittest.TestCase):
    """Tests the `is_db_stamped` method with a sqlite DB."""

    def setUp(self):
        # Create a clean db for each test - this could get expensive with a lot
        # of them!
        self.database_fp = tempfile.NamedTemporaryFile()
        self.engine = create_engine(f"sqlite:///{self.database_fp.name}")

    def tearDown(self):
        self.engine.dispose()
        self.database_fp.close()

    def test_01_stamped_database(self):
        with self.engine.connect() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num TEXT PRIMARY KEY)")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES ('2a74c6522937')")
            )
            connection.commit()
        is_stamped = is_db_stamped(self.engine)
        self.assertTrue(is_stamped)

    def test_02_unstamped_database_no_table(self):
        is_stamped = is_db_stamped(self.engine)
        self.assertFalse(is_stamped)

    def test_03_unstamped_database_no_row(self):
        with self.engine.connect() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num TEXT PRIMARY KEY)")
            )
            connection.commit()
        is_stamped = is_db_stamped(self.engine)
        self.assertFalse(is_stamped)

    def test_04_unstamped_database_empty_row(self):
        with self.engine.connect() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num TEXT PRIMARY KEY)")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES ('')")
            )
            connection.commit()
        is_stamped = is_db_stamped(self.engine)
        self.assertFalse(is_stamped)

    def test_05_malformed_database_multiple_rows(self):
        """Tests if multiple rows in the alembic_version table leads to an
        exception. I don't think this will ever happen.
        """
        with self.engine.connect() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num TEXT PRIMARY KEY)")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES ('2a74c6522937')")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES ('2a74c6522938')")
            )
            connection.commit()
        with self.assertRaises(MultipleResultsFound):
            is_db_stamped(self.engine)

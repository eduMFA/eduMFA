# -*- coding: utf-8 -*-

import os
import tempfile
import unittest

from edumfa.app import create_app
from edumfa.commands.manage.main import cli as edumfa_manage
from edumfa.models import db, EventHandler


class ScriptsTestCase(unittest.TestCase):
    app = None
    app_context = None

    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_name="testing", config_file="", silent=True)
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.commit()
        db.session.close()

    @classmethod
    def tearDownClass(cls):
        db.drop_all()
        db.engine.dispose()
        cls.app_context.pop()

    def test_01_edumfa_admin(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(edumfa_manage, ["admin", "add", "Admin-User"], input="Test\nTest")
        assert result.exit_code == 0
        assert "was registered successfully" in result.output
        result = runner.invoke(edumfa_manage, ["admin", "list"])
        assert result.exit_code == 0
        assert "Admin-User" in result.output
        result = runner.invoke(edumfa_manage, ["admin", "delete", "Admin-User"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["admin", "list"])
        assert result.exit_code == 0
        assert "Admin-User" not in result.output
        result = runner.invoke(edumfa_manage, ["admin", "delete", "Admin-User"])
        assert result.exit_code == 1

    def test_02_edumfa_resolvers(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(edumfa_manage, ["resolver", "list"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["resolver", "create_internal", "test-resolver"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["resolver", "list"])
        assert result.exit_code == 0
        assert "test-resolver" in result.output

    def test_03_edumfa_realms(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(edumfa_manage, ["realm", "list"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["resolver", "create_internal", "test-resolver"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["realm", "create", "test-realm", "test-resolver"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["realm", "delete", "test-realm"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["realm", "delete", "test-realm"])
        assert result.exit_code == 1

    def test_04_edumfa_event(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(edumfa_manage, ["event", "list"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["event", "import", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 3
        result = runner.invoke(edumfa_manage, ["event", "e_import", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 3
        assert "Event reset exists" in result.output
        result = runner.invoke(edumfa_manage, ["event", "import", "-u", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 3
        assert "Updated" in result.output

        event = "enroll"
        handlermodule = "usernotice"
        action = "email"
        condition = "always"
        options = {}
        conditions = {"user_type": "admin"}
        eh1 = EventHandler(
            "event-test",
            event,
            handlermodule=handlermodule,
            action=action,
            condition=condition,
            options=options,
            conditions=conditions,
        )
        eh1.save()
        events = EventHandler.query.all()
        assert len(events) == 4
        result = runner.invoke(edumfa_manage, ["event", "import", "-u", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 4
        assert "Updated" in result.output
        result = runner.invoke(
            edumfa_manage,
            ["event", "import", "-c", "-u", "-f", "tests/testdata/event.conf"],
        )
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 3
        assert "Added" in result.output

    def test_05_core_commands(self):
        runner = self.app.test_cli_runner()
        dir = tempfile.mkdtemp()
        path = os.path.join(dir, "something")
        self.app.config.update({"EDUMFA_AUDIT_KEY_PRIVATE": path})
        result = runner.invoke(edumfa_manage, ["create_audit_keys"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["create_audit_keys"])
        assert result.exit_code == 1
        os.remove(path)
        self.app.config.update({"EDUMFA_ENCFILE": path})
        result = runner.invoke(edumfa_manage, ["create_enckey"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["create_enckey"])
        assert result.exit_code == 1
        os.remove(path)
        os.rmdir(dir)

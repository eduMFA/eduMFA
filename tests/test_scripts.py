# -*- coding: utf-8 -*-

import datetime
import os
import tempfile
import unittest

from edumfa.app import create_app
from edumfa.commands.manage.main import cli as edumfa_manage
from edumfa.models import db, EventHandler, Policy
from edumfa.lib.auditmodules.sqlaudit import LogEntry


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
        result = runner.invoke(edumfa_manage, ["admin", "add", "Admin-User", "-p", "Test"])
        assert result.exit_code == 0
        assert "was registered successfully" in result.output

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
        eh1 = EventHandler("event-test", event, handlermodule=handlermodule,
                           action=action, condition=condition,
                           options=options, conditions=conditions)
        eh1.save()
        events = EventHandler.query.all()
        assert len(events) == 4
        result = runner.invoke(edumfa_manage, ["event", "import", "-u", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 4
        assert "Updated" in result.output
        result = runner.invoke(edumfa_manage, ["event", "import", "-c", "-u", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 3
        assert "Added" in result.output
        event = "enroll"
        handlermodule = "usernotice"
        action = "email"
        condition = "always"
        options = {}
        conditions = {"user_type": "admin"}
        eh1 = EventHandler(
            "event-test-2",
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
        result = runner.invoke(edumfa_manage, ["event", "import", "-p", "-u", "-f", "tests/testdata/event.conf"])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert "event-test-2" not in [e.name for e in events]
        assert len(events) == 3
        assert "Purged" in result.output

        result = runner.invoke(edumfa_manage, ["event", "delete", str(events[0].id)])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert len(events) == 2
        disable = events[1].id
        result = runner.invoke(edumfa_manage, ["event", "disable", str(disable)])
        assert result.exit_code == 0
        events = EventHandler.query.all()
        assert not [x for x in events if x.id == disable][0].active
        result = runner.invoke(edumfa_manage, ["event", "list"])
        assert result.exit_code == 0

    def test_05_edumfa_policy(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(edumfa_manage, ["policy", "list"])
        assert result.exit_code == 0
        result = runner.invoke(edumfa_manage, ["policy", "import", "-f", "tests/testdata/policy.conf"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 2
        assert "Added policy hide_welcome with result 1\nAdded policy user-UI-TOTP with result 2" in result.output

        # Test non updating import
        result = runner.invoke(edumfa_manage, ["policy", "import", "-f", "tests/testdata/policy.conf"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 2
        assert "Policy hide_welcome exists and -u is not specified, skipping import.\nPolicy user-UI-TOTP exists and -u is not specified, skipping import." in result.output

        # Test Updating Policies
        policies[0].active = False
        result = runner.invoke(edumfa_manage, ["policy", "import", "-u", "-f", "tests/testdata/policy.conf"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 2
        assert "Updated policy hide_welcome with result 1\nUpdated policy user-UI-TOTP with result 2" in result.output
        assert policies[0].active

        Policy(name="ui-totp", active=True).save()
        policies = Policy.query.all()
        assert len(policies) == 3
        result = runner.invoke(edumfa_manage, ["policy", "import", "-u", "-f", "tests/testdata/policy.conf"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 3

        result = runner.invoke(edumfa_manage, ["policy", "import", "-c", "-u", "-f", "tests/testdata/policy.conf"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 2
        assert "Deleted policy ui-totp with result 3" in result.output

        Policy(name="ui-totp", active=True).save()
        result = runner.invoke(edumfa_manage, ["policy", "import", "-p", "-u", "-f", "tests/testdata/policy.conf"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 2
        assert "Purged policy ui-totp with result 3" in result.output

        result = runner.invoke(edumfa_manage, ["policy", "delete", "hide_welcome"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert len(policies) == 1

        result = runner.invoke(edumfa_manage, ["policy", "disable", "user-UI-TOTP"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert not policies[0].active

        result = runner.invoke(edumfa_manage, ["policy", "enable", "user-UI-TOTP"])
        assert result.exit_code == 0
        policies = Policy.query.all()
        assert policies[0].active

    def test_06_core_commands(self):
        runner = self.app.test_cli_runner()
        dir = tempfile.mkdtemp()
        path = os.path.join(dir, 'something')
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

    def test_07_audit_rotate(self):
        runner = self.app.test_cli_runner()
        result = runner.invoke(edumfa_manage, ["audit", "rotate"])
        assert result.exit_code == 0
        assert "Cleaning up with high: 10000, low: 5000.\nThe log audit log has 0 entries, the last one is 0" in result.output

        for i in range(0, 20_000):
            db.session.add(LogEntry())

        db.session.commit()
        result = runner.invoke(edumfa_manage, ["audit", "rotate"])
        assert result.exit_code == 0
        assert (
            "Cleaning up with high: 10000, low: 5000.\nThe log audit log has 20000 entries, the last one is 20000\nMore than 10000 entries, deleting...\nDeleting entries smaller than 15000\n"
            in result.output
        )

        LogEntry.query.delete()

        l = LogEntry()
        l.date = datetime.datetime.now() - datetime.timedelta(days=365)
        l.save()
        assert len(LogEntry.query.all()) == 1
        result = runner.invoke(edumfa_manage, ["audit", "rotate", "--age", "30"])
        assert result.exit_code == 0
        assert len(LogEntry.query.all()) == 0

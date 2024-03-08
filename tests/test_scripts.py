# -*- coding: utf-8 -*-

import os
import unittest
from importlib.machinery import SourceFileLoader
from importlib.util import spec_from_loader, module_from_spec

from edumfa.commands.manage.main import cli as edumfa_manage
from edumfa.app import create_app
from edumfa.models import (db)


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
# -*- coding: utf-8 -*-

import os
import unittest
from importlib.machinery import SourceFileLoader
from importlib.util import spec_from_loader, module_from_spec

SCRIPTS = [
    'creategoogleauthenticator-file',
    'getgooglecodes',
#    '-convert-base32.py',
    'edumfa-create-ad-users',
    'edumfa-create-certificate',
    'edumfa-create-pwidresolver-user',
    'edumfa-create-sqlidresolver-user',
    'edumfa-cron',
    'edumfa-expired-users',
    'edumfa-export-linotp-counter.py',
    'edumfa-export-edumfa-counter.py',
    'edumfa-fix-access-rights',
    'edumfa-get-serial',
    'edumfa-get-unused-tokens',
    'edumfa-migrate-linotp.py',
    'edumfa-pip-update',
    'edumfa-queue-huey',
    'edumfa-standalone',
    'edumfa-sync-owncloud.py',
    'edumfa-token-janitor',
    'edumfa-update-counter.py',
    'edumfa-update-linotp-counter.py',
    'edumfa-user-action',
    'edumfa-usercache-cleanup',
    'ssha.py',
    '../edumfa-manage'
]


class ScriptsTestCase(unittest.TestCase):

    def test_01_loading_scripts(self):
        for script in SCRIPTS:
            with self.subTest(script=script):
                loader = SourceFileLoader(script, os.path.join('tools', script))
                spec = spec_from_loader(loader.name, loader)
                mod = module_from_spec(spec)
                loader.exec_module(mod)

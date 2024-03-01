"""
This test file tests the lib.config

The lib.config only depends on the database model.
"""
from edumfa.models import Config, save_config_timestamp, db
from .base import MyTestCase
from edumfa.lib.config import (get_resolver_list,
                                    get_resolver_classes,
                                    get_resolver_class_dict,
                                    get_resolver_types,
                                    get_resolver_module_list,
                                    get_from_config,
                                    get_edumfa_config,
                                    set_edumfa_config,
                                    delete_edumfa_config,
                                    get_token_list,
                                    get_token_module_list,
                                    get_token_class_dict,
                                    get_token_types,
                                    get_token_classes, get_token_prefix,
                                    get_machine_resolver_class_dict,
                                    get_edumfa_node, get_edumfa_nodes,
                                    this, get_config_object, invalidate_config_object,
                                    get_multichallenge_enrollable_tokentypes)
from edumfa.lib.resolvers.PasswdIdResolver import IdResolver as PWResolver
from edumfa.lib.tokens.hotptoken import HotpTokenClass
from edumfa.lib.tokens.totptoken import TotpTokenClass
from flask import current_app
import importlib


class ConfigTestCase(MyTestCase):
    """
    Test the config on the database level
    """
    def test_00_get_config(self):
        # set the config
        set_edumfa_config(key="Hallo", value="What?", typ="string",
                               desc="Some dumb value")

        # get the complete config
        conf = get_from_config()
        self.assertTrue("Hallo" in conf, conf)

        conf = get_from_config("Hallo")
        self.assertTrue(conf == "What?", conf)

        conf = get_from_config("Hello", "Does not exist")
        self.assertTrue(conf == "Does not exist", conf)

        conf = get_edumfa_config()
        self.assertTrue("Hallo" in conf, conf)

        # delete privacyidea config
        delete_edumfa_config("Hallo")
        conf = get_from_config("Hallo")
        self.assertFalse(conf == "What?", conf)

        # set more values to create a timestamp and overwrite
        set_edumfa_config(key="k1", value="v1")
        set_edumfa_config(key="k2", value="v2")
        set_edumfa_config(key="k3", value="v3")
        conf = get_from_config("k3")
        self.assertTrue(conf == "v3", conf)
        set_edumfa_config(key="k3", value="new", typ="string", desc="n")
        conf = get_from_config("k3")
        self.assertTrue(conf == "new", conf)

    def test_01_resolver(self):
        r = get_resolver_list()
        self.assertTrue("edumfa.lib.resolvers.PasswdIdResolver" in r, r)
        self.assertTrue("edumfa.lib.resolvers.LDAPIdResolver" in r, r)
        self.assertTrue("edumfa.lib.resolvers.SCIMIdResolver" in r, r)
        self.assertTrue("edumfa.lib.resolvers.SQLIdResolver" in r, r)

        # check modules
        mlist = get_resolver_module_list()
        mod_name = "edumfa.lib.resolvers.PasswdIdResolver"
        module = importlib.import_module(mod_name)

        self.assertTrue(module in mlist, mlist)

        r = get_resolver_classes()
        self.assertTrue(PWResolver in r, r)
        # resolver classes must be available here
        self.assertTrue("pi_resolver_classes" in this.config, this.config)
        self.assertTrue("pi_resolver_types" in this.config, this.config)

        # Class dict
        (classes, types) = get_resolver_class_dict()
        self.assertTrue('edumfa.lib.resolvers.PasswdIdResolver'
                        '.IdResolver' in classes, classes)
        self.assertTrue(classes.get(
            'edumfa.lib.resolvers.PasswdIdResolver.IdResolver') ==
                        PWResolver, classes)
        self.assertTrue('edumfa.lib.resolvers.PasswdIdResolver'
                        '.IdResolver' in types, types)
        self.assertTrue(types.get('edumfa.lib.resolvers.PasswdIdResolver'
                        '.IdResolver') == "passwdresolver", types)

        # With calling 'get_resolver_classes()' the resolver types will also be cached
        self.assertTrue("pi_resolver_types" in this.config, this.config)
        # When the resolvers are determined, they are stored
        types = get_resolver_types()
        self.assertTrue("passwdresolver" in types, types)

    def test_02_token(self):
        r = get_token_list()
        self.assertTrue("edumfa.lib.tokens.totptoken" in r, r)
        self.assertTrue("edumfa.lib.tokens.hotptoken" in r, r)

        # check modules
        mlist = get_token_module_list()
        mod_name = "edumfa.lib.tokens.totptoken"
        module = importlib.import_module(mod_name)
        self.assertTrue(module in mlist, mlist)

#        r = get_resolver_classes()
#        self.assertTrue(UserResolver in r, r)
#        self.assertTrue(PWResolver in r, r)

        # get_token_class_dict
        (classes, types) = get_token_class_dict()
        self.assertTrue('edumfa.lib.tokens.hotptoken.HotpTokenClass'
                        in classes, classes)
        self.assertTrue(classes.get(
            'edumfa.lib.tokens.hotptoken.HotpTokenClass') ==
                        HotpTokenClass, classes)
        self.assertTrue('edumfa.lib.tokens.totptoken.TotpTokenClass'
                        in classes, classes)
        self.assertTrue(classes.get(
            'edumfa.lib.tokens.totptoken.TotpTokenClass') ==
                        TotpTokenClass, classes)

        self.assertTrue('edumfa.lib.tokens.hotptoken.HotpTokenClass'
                        in types, types)
        self.assertTrue('edumfa.lib.tokens.totptoken.TotpTokenClass'
                        in types, types)
        self.assertTrue(types.get('edumfa.lib.tokens.hotptoken'
                                  '.HotpTokenClass') == "hotp", types)
        self.assertTrue(types.get('edumfa.lib.tokens.totptoken'
                                  '.TotpTokenClass') == "totp", types)

        types = get_token_types()
        self.assertTrue("totp" in types, types)
        self.assertTrue("hotp" in types, types)

        # token classes are cached with calling 'get_token_types()'
        self.assertTrue("pi_token_classes" in this.config, this.config)
        self.assertTrue("pi_token_types" in this.config, this.config)
        r = get_token_classes()
        self.assertTrue(TotpTokenClass in r, r)
        self.assertTrue(HotpTokenClass in r, r)

        # Test custom token types
        with self.app_context:
            self.app.config['EDUMFA_TOKEN_MODULES'] = 'tests.testdata.fancytoken'
            r = get_token_list()
            self.assertIn("tests.testdata.fancytoken", r, r)
            mlist = get_token_module_list()
            mod = importlib.import_module('tests.testdata.fancytoken')
            self.assertTrue(mod in mlist, mlist)
            (classes, types) = get_token_class_dict()
            self.assertIn('tests.testdata.fancytoken.FancyTokenClass', classes, classes)
            self.assertIn('tests.testdata.fancytoken.FancyTokenClass', types, types)
            self.assertEqual(types['tests.testdata.fancytoken.FancyTokenClass'], 'fancy', types)
            self.app.config.pop('EDUMFA_TOKEN_MODULES')

    def test_03_token_prefix(self):
        prefix = get_token_prefix("totp")
        self.assertTrue(prefix == "TOTP", prefix)

        prefix = get_token_prefix("X_Y_Z", "does not exist")
        self.assertTrue(prefix == "does not exist", prefix)

        prefix = get_token_prefix()
        self.assertTrue(prefix.get("totp") == "TOTP", prefix)
        self.assertTrue(prefix.get("hotp") == "OATH", prefix)

    def test_04_store_encrypted_values(self):
        r = set_edumfa_config("mySecretData", "soho",
                                   typ="password", desc="Very important")
        self.assertTrue(r == "insert", r)

        r = get_from_config("mySecretData")
        self.assertTrue(r == "soho", r)

        r = get_from_config()
        self.assertTrue(r.get("mySecretData") == "soho",
                        r.get("mySecretData"))

    def test_05_machine_resolvers(self):
        (classes, types) = get_machine_resolver_class_dict()
        self.assertTrue("hosts" in types.values(), list(types.values()))
        self.assertTrue("edumfa.lib.machines.hosts.HostsMachineResolver"
                        in classes, classes)

    def test_06_public_and_admin(self):
        # This tests the new public available config
        set_edumfa_config("publicInfo1", "info1", typ="public")
        set_edumfa_config("publicInfo2", "info2", typ="public")
        set_edumfa_config("secretInfo1", "info1")

        # Get administrators info
        a = get_from_config()
        self.assertTrue("secretInfo1" in a)
        self.assertTrue("publicInfo1" in a)
        a = get_from_config("publicInfo1")
        self.assertEqual(a, "info1")
        a = get_from_config("secretInfo1")
        self.assertEqual(a, "info1")

        # Get public info as user
        a = get_from_config()
        self.assertTrue("publicInfo1" in a)
        a = get_from_config("publicInfo1")
        self.assertEqual(a, "info1")

        # Not able to get private info as user
        a = get_from_config(role="public")
        self.assertTrue("secretInfo1" not in a)
        a = get_from_config("secretInfo1", role="public")
        self.assertEqual(a, None)

    def test_07_node_names(self):
        node = get_edumfa_node()
        self.assertEqual(node, "Node1")
        nodes = get_edumfa_nodes()
        self.assertTrue("Node1" in nodes)
        self.assertTrue("Node2" in nodes)

    def test_08_config_object(self):
        obj1 = get_config_object()
        # Another call to ``get_config_object`` returns the identical config object
        self.assertIs(obj1, get_config_object())
        set_edumfa_config(key="k1", value="v1")
        # ``set_edumfa_config`` invalidates the config object, so we get a different one
        obj2 = get_config_object()
        self.assertIsNot(obj1, obj2)
        self.assertEqual(get_config_object().get_config("k1"), "v1")
        # ``set_edumfa_config`` again invalidates the config object
        set_edumfa_config(key="k1", value="v2")
        obj3 = get_config_object()
        self.assertIsNot(obj2, obj3)
        self.assertEqual(get_config_object().get_config("k1"), "v2")

    def test_09_invalidate_config_object(self):
        # Test manual invalidation of the config object
        # Ensure we have a config object
        get_config_object()
        # Add a config option *without invalidating the config*
        db.session.add(Config(Key="some_key", Value="some_value"))
        save_config_timestamp(False)
        db.session.commit()
        # The request-local config does not know about the new config option
        self.assertEqual(get_from_config("some_key", "default"), "default")
        # ... so we manually invalidate it ...
        invalidate_config_object()
        # ... and the new config object knows!
        self.assertEqual(get_from_config("some_key", "default"), "some_value")

    def test_10_enrollable_tokentypes(self):
        ttypes = get_multichallenge_enrollable_tokentypes()
        self.assertIn("hotp", ttypes)
        self.assertIn("totp", ttypes)
        self.assertIn("sms", ttypes)
        self.assertIn("email", ttypes)
        self.assertIn("push", ttypes)
        self.assertNotIn("tan", ttypes)
        self.assertNotIn("daplug", ttypes)
        self.assertNotIn("paper", ttypes)

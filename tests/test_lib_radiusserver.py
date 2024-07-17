# coding: utf-8
"""
This test file tests the lib/radiusserver.py
"""
from .base import MyTestCase
from edumfa.lib.error import ConfigAdminError, eduMFAError
from edumfa.lib.radiusserver import (
    add_radius,
    delete_radius,
    get_radiusservers,
    get_radius,
    RADIUSServer,
    test_radius,
)
from edumfa.lib.config import set_edumfa_config
from . import radiusmock

DICT_FILE = "tests/testdata/dictionary"


# prevent nosetests to run test_radius as a unittest
test_radius.__test__ = False


class RADIUSServerTestCase(MyTestCase):

    def test_01_create_radius(self):
        r = add_radius(identifier="myserver", server="1.2.3.4", secret="testing123")
        self.assertTrue(r > 0)
        r = add_radius(
            identifier="myserver1",
            server="1.2.3.4",
            secret="testing123",
            enforce_ma=False,
        )
        r = add_radius(
            identifier="myserver2",
            server="1.2.3.4",
            secret="testing123",
            enforce_ma=True,
        )

        server_list = get_radiusservers()
        self.assertTrue(server_list)
        self.assertEqual(len(server_list), 3)
        server_list = get_radiusservers(identifier="myserver")
        self.assertTrue(server_list[0].config.identifier, "myserver")
        self.assertTrue(server_list[0].config.port, 1812)
        self.assertFalse(server_list[0].config.enforce_ma)
        server_list = get_radiusservers(identifier="myserver1")
        self.assertFalse(server_list[0].config.enforce_ma)
        server_list = get_radiusservers(identifier="myserver2")
        self.assertTrue(server_list[0].config.enforce_ma)

        for server in ["myserver", "myserver1", "myserver2"]:
            r = delete_radius(server)
            self.assertTrue(r > 0)

        server_list = get_radiusservers()
        self.assertEqual(len(server_list), 0)

    def test_02_updateserver(self):
        r = add_radius(identifier="myserver", server="1.2.3.4", secret="testing123")
        self.assertTrue(r > 0)
        server_list = get_radiusservers(identifier="myserver")
        self.assertTrue(server_list[0].config.server, "1.2.3.4")
        r = add_radius(identifier="myserver", server="100.2.3.4", secret="testing123")
        self.assertTrue(r > 0)
        server_list = get_radiusservers(identifier="myserver")
        self.assertTrue(server_list[0].config.server, "100.2.3.4")

    def test_03_missing_configuration(self):
        self.assertRaises(ConfigAdminError, get_radius, "notExisting")

    @radiusmock.activate
    def test_04_RADIUS_request(self):
        radiusmock.setdata(response=radiusmock.AccessAccept)
        r = add_radius(
            identifier="myserver",
            server="1.2.3.4",
            secret="testing123",
            dictionary=DICT_FILE,
        )
        self.assertTrue(r > 0)
        radius = get_radius("myserver")
        r = RADIUSServer.request(radius.config, "user", "password")
        self.assertEqual(r, True)

        radiusmock.setdata(response=radiusmock.AccessReject)
        r = RADIUSServer.request(radius.config, "user", "password")
        self.assertEqual(r, False)

    @radiusmock.activate
    def test_05_RADIUS_request(self):
        radiusmock.setdata(response=radiusmock.AccessAccept, timeout=True)
        r = add_radius(
            identifier="myserver",
            server="1.2.3.4",
            secret="testing123",
            dictionary=DICT_FILE,
        )
        self.assertTrue(r > 0)
        radius = get_radius("myserver")
        # A timeout will return false
        r = RADIUSServer.request(radius.config, "user", "password")
        self.assertEqual(r, False)

    @radiusmock.activate
    def test_06_test_radius(self):
        radiusmock.setdata(response=radiusmock.AccessReject)
        r = test_radius(
            identifier="myserver",
            server="1.2.3.4",
            user="user",
            password="password",
            secret="testing123",
            dictionary=DICT_FILE,
        )
        self.assertFalse(r)

        radiusmock.setdata(response=radiusmock.AccessAccept)
        r = test_radius(
            identifier="myserver",
            server="1.2.3.4",
            user="user",
            password="password",
            secret="testing123",
            dictionary=DICT_FILE,
        )
        self.assertTrue(r)

        # raises error on long secrets
        self.assertRaises(
            eduMFAError,
            test_radius,
            identifier="myserver",
            server="1.2.3.4",
            user="user",
            password="password",
            secret="x" * 96,
            dictionary=DICT_FILE,
        )

    @radiusmock.activate
    def test_07_non_ascii(self):
        radiusmock.setdata(response=radiusmock.AccessAccept)
        r = add_radius(
            identifier="myserver",
            server="1.2.3.4",
            secret="testing123",
            dictionary=DICT_FILE,
        )
        self.assertTrue(r > 0)
        radius = get_radius("myserver")
        r = RADIUSServer.request(radius.config, "nönäscii", "passwörd")
        self.assertEqual(r, True)

    @radiusmock.activate
    def test_08_RADIUS_request_ma(self):
        radiusmock.setdata(response=radiusmock.AccessAccept)
        r = add_radius(
            identifier="myserver",
            server="1.2.3.4",
            secret="testing123",
            dictionary=DICT_FILE,
            enforce_ma=True,
        )
        self.assertTrue(r > 0)
        radius = get_radius("myserver")
        r = RADIUSServer.request(radius.config, "user", "password")
        self.assertEqual(r, False)

        radiusmock.setdata(response=radiusmock.AccessAccept, ma=True)
        radius = get_radius("myserver")
        r = RADIUSServer.request(radius.config, "user", "password")
        self.assertEqual(r, True)

        radiusmock.setdata(response=radiusmock.AccessAccept, ma=True, broken_ma=True)
        radius = get_radius("myserver")
        r = RADIUSServer.request(radius.config, "user", "password")
        self.assertEqual(r, False)

        radiusmock.setdata(response=radiusmock.AccessAccept, ma=True)
        r = add_radius(
            identifier="myserver2",
            server="1.2.3.4",
            secret="testing123",
            dictionary=DICT_FILE,
            enforce_ma=False,
        )
        radius = get_radius("myserver2")
        r = RADIUSServer.request(radius.config, "user", "password")
        # Should result in a timeout and that will return false
        self.assertEqual(r, False)

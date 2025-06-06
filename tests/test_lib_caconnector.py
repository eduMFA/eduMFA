"""
This test file tests the lib.caconnector.py and
lib.caconnectors.localca.py
"""
import unittest

import OpenSSL.crypto

from .base import MyTestCase
import os
import glob
import shutil
import mock
from io import StringIO
from mock import patch
from edumfa.lib.caconnectors.localca import LocalCAConnector, ATTR
from edumfa.lib.caconnectors.msca import MSCAConnector, ATTR as MS_ATTR
from OpenSSL import crypto
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from edumfa.lib.utils import int_to_hex, to_unicode
from edumfa.lib.error import CAError, CSRError, CSRPending
from edumfa.lib.caconnector import (get_caconnector_list,
                                         get_caconnector_class,
                                         get_caconnector_config,
                                         get_caconnector_config_description,
                                         get_caconnector_object,
                                         get_caconnector_type,
                                         get_caconnector_types,
                                         save_caconnector, delete_caconnector)
from edumfa.lib.caconnectors.baseca import AvailableCAConnectors
from .mscamock import CAServiceMock



CAKEY = "cakey.pem"
CACERT = "cacert.pem"
OPENSSLCNF = "openssl.cnf"
WORKINGDIR = "tests/testdata/ca"
REQUEST = """-----BEGIN CERTIFICATE REQUEST-----
MIIDlTCCAf0CAQAwUDELMAkGA1UEBhMCREUxEDAOBgNVBAgMB0JhdmFyaWExDzAN
BgNVBAoMBmVkdU1GQTEeMBwGA1UEAwwVcmVxdWVzdGVyLmxvY2FsZG9tYWluMIIB
ojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAyRYIVX4twFuATjXmWrM4fn8S
DW8ZHf4/K3UgKP2ZPSgWGFkHX7Wz1CR84k1aXvTaLsx4bzjwZjpbGgVjIDU/O+we
6PEGXgIuwCwdU0uzL+FlmZD0CWdoFze8m99u4MZULo0o41sfMDnKz1PbEDCvzLoV
aDP97WC/Vg0dNPZDISeQm5If3olQvNKkdQDXqE/Kgfn5lueB61yWh1N/SeoMmYcM
y0Ud0OdgI0xt/S3gwKCH4YPPdnEh2jEojE2IKTdqx9w+qWaje6S1ikva60xd+5Uy
MyagEz1rro+tlT6d8dr3cmc+3rncDOtXyoU8zZFyMbXAgUFwjEzqv9ppdNFi/uTO
BvwjR+85JDaFKdvGyBTP4yhXynal7nXK2GiN9yYo+1qtJQvUtMXb2CvOQaHbf9y+
UBsnT9HSXddvj2Kq8iPj3R5qtW2xq6UB3w0TRNDXUytWF9W9/Z6pox9VEx9sVs+T
4NDQz4jamq8eZx2zA8RbOQ/W9pS/K2LEyb+6SWofAgMBAAGgADANBgkqhkiG9w0B
AQsFAAOCAYEAUVC5zDO0qPHs0mgem+PCb/64Vd80JeRD8iwhWAPCb3KFgXHDO9sX
YZhWklo/Y+rAy+D2VBvQKH7itUJnodFDfFfc0Lkm4ZBRrlMXb5uFe0M3pvt2LkXH
6BSINCk3GX31Uk37fnbpRDzkeG8vGVQ4f5n/+mrA4ZfyZECFd0gH6/qIGAZFNy7X
EvmSm1k+X8Wci+npLS2O3IyxdcY/dnznZzC3PvDVAdzzWdPEIHmJaWDRWMek+oP6
vLdMaYMsi2r0hv6yJe0xUvLAjXKTQjfnH3oKXM6a6RmSRFU9lySzNfZlEyRpiC60
OJC18Ett63+gYuVikIGrgjl8ZiwPECRC0bBza0HN64SCUsDm5U28VtOFOvSB4djM
QqACwhT5aKU1nddY9iUz7rCrRRYh6v+UlaTPImb/5YIPHeHkVK39/pYbn3Hh7oOf
cq5y3tVeY7n21HpHeTwnwB3sXxVjWexfTGqN5fh5PKnRVg/LW+jRLOn//uWLRe/P
cUWD4Ib9FGVI
-----END CERTIFICATE REQUEST-----"""

REQUEST_USER = """-----BEGIN CERTIFICATE REQUEST-----
MIIDiDCCAfACAQAwQzELMAkGA1UEBhMCREUxEDAOBgNVBAgMB0JhdmFyaWExDzAN
BgNVBAoMBmVkdU1GQTERMA8GA1UEAwwIdXNlcmNlcnQwggGiMA0GCSqGSIb3DQEB
AQUAA4IBjwAwggGKAoIBgQC/WMvPBjQgdD8kULDE9SqzRrkoQZybFEA/Itf0Mfvv
V/nPBKQ5m0L/UZSu051Rh5HCbYH5Qf9lspUK96AWXd6E8BO6Rr0W6Swc9oZ6s0aB
jXiL8K/XV3R8RGpKknJFNCn58U66Ms8RzBuQ/JP35+U0uYHmTHWC3qm4zFJFlHou
Jdtzolr9+AyKhT4gx+2OS8IvgAQbqfnBTUmSF2Dm99+ACLpuN7Xi7Ix3LYBFt2CR
1TtkUnQbgBLSSy8A1aMPOMXNGBK/pFqsdJPhLGAyN7l+Ad72g+BM7/SWfv1R6b50
5pCw4JA4p0dpgKHzLA3MpjKGSSeDV9PCHPEt+6EUqmuJEuMhoNnUOQwoeFjZDISF
8U7z/KkFvV0e0IkpJCs7BslrYt/xNNGsb7+CI4aI+8N70CovXAp9iOHVLgxmGhBj
Xlyu4Z/P4JOqAMkjYDSFIrz4kkvD7LNq+i0OYJPYLMcksQm++2f6kIbcVCWaGnx6
5diC6axOyHrfRJlAnFXtMJ0CAwEAAaAAMA0GCSqGSIb3DQEBCwUAA4IBgQAaYP89
lm8XuTdUx1u9LmIp68n8508bmJkvP+2NZUzksqLTnb72RoaeyZTSQGH5GoD3Mwd8
SE14wce9mazgAHjG84YSeI9YjTazk/xK7yXDmxc0rrrUb6Cnet7hXtP349Uuud+I
SUPi9WzqEshje0G/8g+Kk8G/rQo08KEcf21zGH8dbV9+cHhQJ6S0Z1ORqCLyMSGG
u6D+3cJrrZKCLox0IOoYGWQ6PdTq8I+mwmbRAnhWDsTkNZ7xdl1zI/QWoFZ73rpi
ksNCss0KQOshrBcLPi7C4lAE4Rj6SrnDekWn/62ADbZVxxhqfnOswscUeOkXo4gD
q3OvHGPUawE0H/G5fs6qhd7oBWRBQ+GcdOZh3X6pi9FLaIyLPyAOsN6Y8GlYK2H4
lp3FfFxE4oyjBZeyVDoIibBWPRCWXYgDRxYg4AOT7PSFlwv1DTmWpBZ4WW7Qptve
MpyHHs5zBzeBBPqvP0rfrtUvKDg8saQjdEojTtptqKb6j9qGDA2RvFwlEfI=
-----END CERTIFICATE REQUEST-----"""

CERTIFICATE = """-----BEGIN CERTIFICATE-----
MIIHdTCCBV2gAwIBAgITMAAAAHozruIlHyAQtAAAAAAAejANBgkqhkiG9w0BAQsF
ADBGMRMwEQYKCZImiZPyLGQBGRYDY29tMRYwFAYKCZImiZPyLGQBGRYGbmlsc2Nh
MRcwFQYDVQQDEw5uaWxzY2EtQ0EwMy1DQTAeFw0yMjA3MjQxNjQzNDlaFw0yMzA3
MjQxNjQzNDlaMFUxEzARBgoJkiaJk/IsZAEZFgNjb20xFjAUBgoJkiaJk/IsZAEZ
FgZuaWxzY2ExDjAMBgNVBAMTBVVzZXJzMRYwFAYDVQQDEw1BZG1pbmlzdHJhdG9y
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzb4UT/rOAT9CIhsdnK/d
ktJ/22y3PjlDQ2sTA/EF9Ad0vHZpKAuvGY7X/OPNxljyyn8IbVP8BwJEJMa0NEyM
BP4zDkDiILoCc1r39U9jbszGtt9UHTc5fVE2Jl+93D+oi2uirrad1iHn30G4eigq
aEjKqC3t4elGXlpybbSEOIeR/ZQRCyiExsIvKvsB+TZ6CXXRM4g8c0FbyL+UiXCh
8MC5LlBTHrEXZGn0LYHgqQ0OMum6VYqF8RtvSXm0f4jDDT5UiJs9HziMBPPuamMr
9cbbtIOqxHhBOn1L4cg+ccobYVnqxsTKMl7J6b8SKebGw2P+oFXaevFgmE0m7fpw
LQIDAQABo4IDSzCCA0cwHQYDVR0OBBYEFFM/7V0JB7Nle6tFySRbCXeACpbtMB8G
A1UdIwQYMBaAFLgiq+2UnxagGJRx6MJQEOuboBfNMIHIBgNVHR8EgcAwgb0wgbqg
gbeggbSGgbFsZGFwOi8vL0NOPW5pbHNjYS1DQTAzLUNBLENOPUNBMDMsQ049Q0RQ
LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
Z3VyYXRpb24sREM9bmlsc2NhLERDPWNvbT9jZXJ0aWZpY2F0ZVJldm9jYXRpb25M
aXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQwgb8GCCsG
AQUFBwEBBIGyMIGvMIGsBggrBgEFBQcwAoaBn2xkYXA6Ly8vQ049bmlsc2NhLUNB
MDMtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZp
Y2VzLENOPUNvbmZpZ3VyYXRpb24sREM9bmlsc2NhLERDPWNvbT9jQUNlcnRpZmlj
YXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlvbkF1dGhvcml0eTAOBgNV
HQ8BAf8EBAMCBaAwPAYJKwYBBAGCNxUHBC8wLQYlKwYBBAGCNxUIhrbHcYa95yeB
1Y8bh6WhcIGbvAqBfJStI5DMCgIBZAIBBTApBgNVHSUEIjAgBggrBgEFBQcDAgYI
KwYBBQUHAwQGCisGAQQBgjcKAwQwNQYJKwYBBAGCNxUKBCgwJjAKBggrBgEFBQcD
AjAKBggrBgEFBQcDBDAMBgorBgEEAYI3CgMEMDMGA1UdEQQsMCqgKAYKKwYBBAGC
NxQCA6AaDBhBZG1pbmlzdHJhdG9yQG5pbHNjYS5jb20wTQYJKwYBBAGCNxkCBEAw
PqA8BgorBgEEAYI3GQIBoC4ELFMtMS01LTIxLTYwNDM1NTA3OS0zNzE5MzIxMzQ2
LTE4ODc1MjYzMzItNTAwMEQGCSqGSIb3DQEJDwQ3MDUwDgYIKoZIhvcNAwICAgCA
MA4GCCqGSIb3DQMEAgIAgDAHBgUrDgMCBzAKBggqhkiG9w0DBzANBgkqhkiG9w0B
AQsFAAOCAgEACiBnzQbxxS7cCTtvT6ODyXaJfl5F+WkeoazR7iQnMTIIuigGNeGY
q7YS92YPGlw8CBcjQ2VHG8ez4v4RaN0xnRDPOoVddG6JPjY4z0Cq+SCHW1W+yBH6
YNIoU22gx8qM4GWHEQvu33tU+gPHy0ZZceMoEWQVwpC9/Nq/bqEvbevrcXJDC20f
3Ob3kVJTqrwULYqcuzNW194NXE+hC5+Wjg3mMy7YJU0bE1XeYQxCzHs2T3Sd2O+C
9ZGvvykSS2MJsC0vW+sFpZ2Z6hDFduXzQqpzaORXe04p+dI88orjdu3yX898jOL0
YCmxCy/Rvm5+E15MW6Dh3BfUh6Zaeij3z3/xmE3kVaLA9PeWxG5+akW1KtQwD0PB
mH5q4AmzBj0ryhPfOvXKUSOBp+tLV9Fd4QW0rZgU6/ZTAC73mbh8sDBdXZYb+jzi
7iM6kqIma6T3mgODYg2d1WTmNx3z+8m+sBoUiwY0yQc22oWkTVXKqzOrg7SOuiSy
a3QX4OejnyxBSuNegL8EQhyxDCAdisRqgGLhtYh3RMegZn0WnJOlRPBHrniFkJBV
ub8B4Q4BtcXwyX1IjkSRVGhpmBKc+cykTR1GGR0L0JihMK85qWF/8vyYiwBq3z08
TdIfRtrzkM5Zw/U/p2/LWzbe/fCkqSC6SheI+/FDR7Bjz7xNxIZHonk=
-----END CERTIFICATE-----"""

SPKAC = "SPKAC=MIICQDCCASgwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggE" \
        "KAoIBAQDSgYkgUUgPc/QRMiTVHxz9XPW25sXwUoHc0q9mSnyTMWFcr" \
        "9FtBnADYHxyDIjdSc2eAmzSWtdTD" \
        "/PavmlktQ8MAOOzUEejs5u6E1DWWFpLqzngEcoKJ2cDeCJmbZIeG1xJru" \
        "Zr0Y47nQbTxqxNU0MQq+iWwYeCl5mPINOZEjcxhOGK/ykDXyKQPn+b4CDBr" \
        "dyuTDkaMZYXAoyy2bQNIBKbfYZU/TP9wSpiRvhgls9uAW8i3xNH55fsBXIjo2" \
        "L4+u+snHLwN8svN8+QqCdRhsbXeAiPfiWiFXCi+xy2FV6gl4uBTAkoiic7lLxx2" \
        "1txN5orFuBvtcn1S08gumXPr62tAgMBAAEWADANBgkqhkiG9w0BAQQFAAOCAQEAe" \
        "nI3N4LdQF3R0Jn+pjldo65K4BERTnfhtcyYH4nCTNKvvwSvTv9eBvuJ6ZWqIy9aRFX" \
        "Zngl4ZFyrqZYNufPPdlMVMwbJ4L6iphkcQjzCbrvQDvzVwH4SOGmuIHYyjrIzmg" \
        "P+e7XvXVr0Vl6zMHWalGGSNPWwrSj6FXw6G7qm7Qd9CYvGDxA0qxo6tL/KCjv" \
        "q+4qNB1rfy9Gy3xBr3ZfIa15/bLSvO9dPx6cW8Jv6Vb8w6UizwhGMfh55KOc1wVf" \
        "ofEpwbLM9PyvVAoszL9JpQHIs6S0zZ5bwt2eUjzc7GnzxxIVlR7/xIQiizzbW22" \
        "rmtBFA3aIp5RExiEpvBD88hg==\n" \
        "CN=Steve Test\n" \
        "emailAddress=steve@openssl.org"


class CAConnectorTestCase(MyTestCase):
    """
    Test the CA connector lib functions
    """
    def test_01_base_functions(self):
        types = get_caconnector_types()
        self.assertIn("local", types)
        self.assertIn("microsoft", types)

        calist = get_caconnector_list()
        self.assertEqual(calist, [])

        connector_class = get_caconnector_class("local")
        self.assertEqual(connector_class, LocalCAConnector)

        description = get_caconnector_config_description("local")
        self.assertEqual(description.get("local").get("cakey"), "string")
        self.assertEqual(description.get("local").get("cacert"), "string")

    def test_02_db_caconnector(self):
        pass
        # save a CA connector
        ca_id = save_caconnector({"caconnector": "myCA",
                                  "type": "local",
                                  "cakey": "/opt/ca/key.pem",
                                  "cacert": "/opt/ca/cert.pem"})
        self.assertTrue(ca_id > 0, ca_id)
        # Update the CA connector. Thus we check if SharedConfigClass is updated.
        save_caconnector({"caconnector": "myCA",
                          "type": "local",
                          "WorkingDir": "/opt/ca",
                          "Password": "secret",
                          "type.Password": "password"})
        # check if connector is in DB
        calist = get_caconnector_list()
        self.assertEqual(len(calist), 1)
        calist = get_caconnector_list(filter_caconnector_type="local")
        self.assertEqual(len(calist), 1)
        # check the config values of "myCA"
        self.assertEqual(calist[0].get("data").get("WorkingDir"), "/opt/ca")
        self.assertEqual(calist[0].get("data").get("cakey"), "/opt/ca/key.pem")

        # get the CA connector list without a config
        calist = get_caconnector_list(return_config=False)
        self.assertEqual(len(calist), 1)
        # check that there are no values
        self.assertEqual(calist[0].get("data"), {})

        # test the CA connector:
        config = get_caconnector_config("myCA")
        self.assertEqual(config.get("WorkingDir"), "/opt/ca")
        self.assertEqual(config.get("cakey"), "/opt/ca/key.pem")
        # get_caconnector_object()
        ca_obj = get_caconnector_object("myCA")
        self.assertTrue(ca_obj.connector_type, "local")
        catype = get_caconnector_type("myCA")
        self.assertTrue(catype, "local")

        # delete the CA connector
        delete_caconnector("myCA")

        # check if connector is deleted from DB
        self.assertEqual(len(calist), 1)

    def test_03_errors(self):
        # unknown type
        self.assertRaises(Exception, save_caconnector,
                          {"caconnector": "unknown", "type": "unknown"})

        caobj = get_caconnector_object("not-existing")
        self.assertEqual(caobj, None)


class LocalCATestCase(MyTestCase):
    """
    Test the local CA connector
    """

    @classmethod
    def setUpClass(cls):
        # call parent
        super().setUpClass()

        # Backup the original index and serial
        shutil.copyfile("{0!s}/serial".format(WORKINGDIR),
                        "{0!s}/serial.orig".format(WORKINGDIR))
        shutil.copyfile("{0!s}/index.txt".format(WORKINGDIR),
                        "{0!s}/index.txt.orig".format(WORKINGDIR))

    @classmethod
    def tearDownClass(cls):
        filelist = glob.glob("{0!s}/100*.pem".format(WORKINGDIR))
        for f in filelist:
            os.remove(f)

        FILES = ["DE_Bavaria_eduMFA_requester.localdomain.req",
                 "DE_Bavaria_eduMFA_requester.localdomain.pem",
                 "DE_Bavaria_eduMFA_usercert.pem",
                 "DE_Bavaria_eduMFA_usercert.req",
                 "index.txt.attr.old",
                 "index.txt.old",
                 "serial.old",
                 "crl.pem",
                 "Steve_Test.der",
                 "Steve_Test.txt"]
        for f in FILES:
            try:
                os.remove("{0!s}/{1!s}".format(WORKINGDIR, f))
            except OSError:
                print("File {0!s} could not be deleted.".format(f))

        # restore backup of index.txt and serial
        shutil.copyfile("{0!s}/serial.orig".format(WORKINGDIR),
                        "{0!s}/serial".format(WORKINGDIR))
        shutil.copyfile("{0!s}/index.txt.orig".format(WORKINGDIR),
                        "{0!s}/index.txt".format(WORKINGDIR))
        os.remove("{0!s}/serial.orig".format(WORKINGDIR))
        os.remove("{0!s}/index.txt.orig".format(WORKINGDIR))
        # call parent
        super().tearDownClass()

    def test_01_create_ca_connector(self):
        # cakey missing
        self.assertRaises(CAError, LocalCAConnector, "localCA",
                          {"cacert": "..."})
        # cacert missing
        self.assertRaises(CAError, LocalCAConnector, "localCA",
                          {"cakey": "..."})

        cacon = LocalCAConnector("localCA", {"cacert": "...",
                                             "cakey": "..."})

        self.assertEqual(cacon.name, "localCA")

    def test_02_sign_cert(self):
        cacon = LocalCAConnector("localCA", {"cacert": "...",
                                             "cakey": "..."})
        # set the parameters:
        cwd = os.getcwd()
        cacon.set_config({"cakey": CAKEY, "cacert": CACERT,
                          "openssl.cnf": OPENSSLCNF,
                          "WorkingDir": cwd + "/" + WORKINGDIR})

        _r, cert = cacon.sign_request(REQUEST,
                                      {"CSRDir": "",
                                       "CertificateDir": "",
                                       "WorkingDir": cwd + "/" + WORKINGDIR})
        serial = cert.get_serial_number()

        self.assertEqual("{0!r}".format(cert.get_issuer()),
                         "<X509Name object '/C=DE/ST=Bavaria/O=eduMFA/CN=eduMFA Test-CA'>")
        self.assertEqual("{0!r}".format(cert.get_subject()),
                         "<X509Name object '/C=DE/ST=Bavaria/O=eduMFA/CN=requester.localdomain'>")

        # Fail to revoke certificate due to non-existing-reasing
        self.assertRaises(CAError, cacon.revoke_cert, cert, reason="$(rm -fr)")

        # Revoke certificate
        r = cacon.revoke_cert(cert)
        serial_hex = int_to_hex(serial)
        self.assertEqual(r, serial_hex)

        # Create the CRL
        r = cacon.create_crl()
        self.assertEqual(r, "crl.pem")
        # Check if the serial number is contained in the CRL!
        filename = os.path.join(cwd, WORKINGDIR, "crl.pem")
        found_revoked_cert = False
        with open(filename, "rb") as crl_file:
            crl_data = crl_file.read()
            crl = x509.load_pem_x509_crl(crl_data, backend=default_backend())
            for revoked_cert in crl:
                s = int_to_hex(revoked_cert.serial_number)
                if s == serial_hex:
                    found_revoked_cert = True
                    break
        self.assertTrue(found_revoked_cert)

        # Create the CRL and check the overlap period. But no need to create
        # a new CRL.
        r = cacon.create_crl(check_validity=True)
        self.assertEqual(r, None)

        # Now we overlap at any cost!
        cacon.set_config({"cakey": CAKEY, "cacert": CACERT,
                          "openssl.cnf": OPENSSLCNF,
                          "WorkingDir": cwd + "/" + WORKINGDIR,
                          ATTR.CRL_OVERLAP_PERIOD: 1000})
        r = cacon.create_crl(check_validity=True)
        self.assertEqual(r, "crl.pem")

    def test_03_sign_user_cert(self):
        cwd = os.getcwd()
        cacon = LocalCAConnector("localCA",
                                 {"cakey": CAKEY,
                                  "cacert": CACERT,
                                  "openssl.cnf": OPENSSLCNF,
                                  "WorkingDir": cwd + "/" + WORKINGDIR})

        _, cert = cacon.sign_request(REQUEST_USER)
        self.assertEqual("{0!r}".format(cert.get_issuer()),
                         "<X509Name object '/C=DE/ST=Bavaria/O=eduMFA/CN=eduMFA Test-CA'>")
        self.assertEqual("{0!r}".format(cert.get_subject()),
                         "<X509Name object '/C=DE/ST=Bavaria/O=eduMFA/CN=usercert'>")

    def test_04_sign_SPKAC_request(self):
        cwd = os.getcwd()
        cacon = LocalCAConnector("localCA",
                                 {"cakey": CAKEY,
                                  "cacert": CACERT,
                                  "openssl.cnf": OPENSSLCNF,
                                  "WorkingDir": cwd + "/" + WORKINGDIR})

        _, cert = cacon.sign_request(SPKAC, options={"spkac": 1})
        self.assertEqual("{0!r}".format(cert.get_issuer()),
                         "<X509Name object '/C=DE/ST=Bavaria/O=eduMFA/CN=eduMFA Test-CA'>")
        self.assertEqual("{0!r}".format(cert.get_subject()),
                         "<X509Name object '/CN=Steve Test"
                         "/emailAddress=steve@openssl.org'>")

    def test_05_templates(self):
        cwd = os.getcwd()
        cacon = LocalCAConnector("localCA",
                                 {"cakey": CAKEY,
                                  "cacert": CACERT,
                                  "openssl.cnf": OPENSSLCNF,
                                  "WorkingDir": cwd + "/" + WORKINGDIR,
                                  ATTR.TEMPLATE_FILE: "templates.yaml"})
        templates = cacon.get_templates()
        self.assertTrue("user" in templates)
        self.assertTrue("webserver" in templates)
        self.assertTrue("template3" in templates)
        _, cert = cacon.sign_request(SPKAC, options={"spkac": 1,
                                                     "template": "webserver"})
        expires = to_unicode(cert.get_notAfter())
        import datetime
        dt = datetime.datetime.strptime(expires, "%Y%m%d%H%M%SZ")
        ddiff = dt - datetime.datetime.now()
        # The certificate is signed for 750 days
        self.assertTrue(ddiff.days > 740, ddiff.days)
        self.assertTrue(ddiff.days < 760, ddiff.days)

        # in case of a nonexistent template file, no exception is raised
        # but an empty value is returned
        cacon.template_file = "nonexistent"
        self.assertEqual(cacon.get_templates(), {})


# Mock
MY_CA_NAME = "192.168.47.11"

MOCK_AVAILABLE_CAS = ['WIN-GG7JP259HMQ.nilsca.com\\nilsca-WIN-GG7JP259HMQ-CA',
                      'CA03.nilsca.com\\nilsca-CA03-CA']
MOCK_CA_TEMPLATES = ["User", "SmartcardLogon", "ApprovalRequired"]

MOCK_USER_CERT = """-----BEGIN CERTIFICATE-----
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
17qsUVtb+0YLznMdHEFtWc51SpzA0h3a7w==
-----END CERTIFICATE-----"""


CONF = {MS_ATTR.HOSTNAME: MY_CA_NAME,
        MS_ATTR.PORT: 50061,
        MS_ATTR.HTTP_PROXY: "0",
        MS_ATTR.CA: "CA03.nilsca.com\\nilsca-CA03-CA"}

CONF_LAB = {MS_ATTR.HOSTNAME: "10.0.5.100",
            MS_ATTR.PORT: 50061,
            MS_ATTR.HTTP_PROXY: "0",
            MS_ATTR.CA: "CA03.nilsca.com\\nilsca-CA03-CA"}


@unittest.skipUnless("edumfa.lib.caconnectors.msca.MSCAConnector" in AvailableCAConnectors,
                     "Can not test MSCA. grpc module seems not available.")
class MSCATestCase(MyTestCase):
    """
    Test the MS CA connector
    """

    def test_01_create_ca_connector(self):
        # Check that an error is written to the logfile
        with mock.patch("logging.Logger.warning") as mock_log:
            self.cacon = MSCAConnector("billsCA", CONF)
            # Although the msca object is created, it still writes a warning to the log for being offline
            mock_log.assert_called_with("Worker seems to be offline. No connection could be established!")
            self.assertEqual(self.cacon.connector_type, "microsoft")

        # check the configuration of the CA object
        r = self.cacon.get_config(CONF)
        self.assertEqual(r["hostname"], MY_CA_NAME)
        self.assertEqual(r["port"], 50061)
        self.assertEqual(r["http_proxy"], False)
        self.assertEqual(r["ca"], "CA03.nilsca.com\\nilsca-CA03-CA")

        # Check the description of the CA Connector
        r = MSCAConnector.get_caconnector_description()
        description = r.get("microsoft")
        for key in [MS_ATTR.CA, MS_ATTR.HOSTNAME, MS_ATTR.PORT, MS_ATTR.HTTP_PROXY]:
            self.assertEqual(description[key], "string")

        # Check, if an error is raised if a required attribute is missing:
        self.assertRaisesRegex(CAError, "required argument 'port' is missing.",
                               MSCAConnector, "billsCA", {MS_ATTR.HOSTNAME: "hans"})
        self.assertRaisesRegex(CAError, "required argument 'hostname' is missing.",
                               MSCAConnector, "billsCA", {MS_ATTR.PORT: "shanghai"})

    def test_02_test_get_templates(self):
        # Mock the connection to the worker
        with mock.patch.object(MSCAConnector, "_connect_to_worker") as mock_conncect_worker:
            mock_conncect_worker.return_value = CAServiceMock(CONF,
                                                              {"available_cas": MOCK_AVAILABLE_CAS,
                                                               "ca_templates": MOCK_CA_TEMPLATES})
            # Test getting CAs
            r = MSCAConnector("billsCA", CONF).get_specific_options()
            self.assertIn("available_cas", r)
            available_cas = r.get("available_cas")
            self.assertIn('WIN-GG7JP259HMQ.nilsca.com\\nilsca-WIN-GG7JP259HMQ-CA', available_cas)
            self.assertIn('CA03.nilsca.com\\nilsca-CA03-CA', available_cas)

            # Create a connector to CA03
            cacon = MSCAConnector("billsCA", CONF)
            templates = cacon.get_templates()
            # check for some templates
            self.assertIn("User", templates)
            self.assertIn("SmartcardLogon", templates)

    def test_03_test_sign_request(self):
        # Mock the connection to the worker
        with mock.patch.object(MSCAConnector, "_connect_to_worker") as mock_conncect_worker:
            # Mock the CA to simulate a Pending Request - disposition 5
            mock_conncect_worker.return_value = CAServiceMock(CONF,
                                                              {"available_cas": MOCK_AVAILABLE_CAS,
                                                               "ca_templates": MOCK_CA_TEMPLATES,
                                                               "csr_disposition": 5})
            cacon = MSCAConnector("billsCA", CONF)
            self.assertRaisesRegex(CSRPending, "ERR505: CSR pending",
                                   cacon.sign_request, REQUEST, {"template": "ApprovalRequired"})
            # Mock the CA to simulate a failed Request - dispoisition -1
            mock_conncect_worker.return_value = CAServiceMock(CONF,
                                                              {"available_cas": MOCK_AVAILABLE_CAS,
                                                               "ca_templates": MOCK_CA_TEMPLATES,
                                                               "csr_disposition": -1})
            cacon = MSCAConnector("billsCA", CONF)
            self.assertRaisesRegex(CSRError, "ERR504: CSR invalid",
                                   cacon.sign_request, REQUEST, {"template": "NonExisting"})
            # Mock the CA to simulate a signed request - disposition 3
            mock_conncect_worker.return_value = CAServiceMock(CONF,
                                                              {"available_cas": MOCK_AVAILABLE_CAS,
                                                               "ca_templates": MOCK_CA_TEMPLATES,
                                                               "csr_disposition": 3,
                                                               "certificate": MOCK_USER_CERT})
            cacon = MSCAConnector("billsCA", CONF)
            request_id, cert = cacon.sign_request(REQUEST_USER, {"template": "User"})
            self.assertIsInstance(cert, OpenSSL.crypto.X509)
            self.assertEqual(4711, request_id)

    def test_04_test_pending_request(self):
        with mock.patch.object(MSCAConnector, "_connect_to_worker") as mock_conncect_worker:
            # Mock the CA to simulate a Pending Request - disposition 5
            mock_conncect_worker.return_value = CAServiceMock(CONF,
                                                              {"available_cas": MOCK_AVAILABLE_CAS,
                                                               "ca_templates": MOCK_CA_TEMPLATES,
                                                               "csr_disposition": 5,
                                                               "certificate": CERTIFICATE})
            cacon = MSCAConnector("billsCA", CONF_LAB)
            try:
                r = cacon.sign_request(REQUEST, {"template": "ApprovalRequired"})
            except CSRPending as e:
                request_id = e.requestId

            r = cacon.get_cr_status(request_id)
            # still under submission
            self.assertEqual(5, r)

            # Issue the certificate
            mock_conncect_worker.return_value.disposition = 3
            # certificate was issued
            r = cacon.get_cr_status(request_id)
            self.assertEqual(3, r)
            # Fetch the certificate.
            r = cacon.get_issued_certificate(request_id)
            self.assertTrue(r.startswith("-----BEGIN CERTIFICATE-----"), r)

    def test_10_fail_ca_missing_certs(self):
        # Fail to create CA connection due to missing certificates
        with mock.patch("logging.Logger.error") as mock_log:
            conf = CONF
            conf[MS_ATTR.USE_SSL] = True
            self.assertRaises(CAError, MSCAConnector, "bCA2", conf)
            mock_log.assert_any_call("For a secure connection we need 'ssl_ca_cert', "
                                     "'ssl_client_cert' and 'ssl_client_key'. "
                                     "The following configuration seems incomplete: "
                                     "(None, None, None)")

    def test_11_ssl_unencrypted_key(self):
        # Create CA connector with an unencrypted private key
        conf = CONF
        conf[MS_ATTR.USE_SSL] = True
        conf[MS_ATTR.SSL_CA_CERT] = "tests/testdata/msca-connector/ca.pem"
        conf[MS_ATTR.SSL_CLIENT_CERT] = "tests/testdata/msca-connector/privacyidea.pem"
        conf[MS_ATTR.SSL_CLIENT_KEY] = "tests/testdata/msca-connector/privacyidea.key"
        self.cacon = MSCAConnector("bCA2", conf)
        self.assertEqual(self.cacon.connector_type, "microsoft")

    def test_12_ssl_encrypted_key_missing_passphrase(self):
        # Create CA connector with an unencrypted private key
        conf = CONF
        conf[MS_ATTR.USE_SSL] = True
        conf[MS_ATTR.SSL_CA_CERT] = "tests/testdata/msca-connector/ca.pem"
        conf[MS_ATTR.SSL_CLIENT_CERT] = "tests/testdata/msca-connector/privacyidea.pem"
        conf[MS_ATTR.SSL_CLIENT_KEY] = "tests/testdata/msca-connector/privacyidea-encrypted.key"
        self.assertRaises(CAError, MSCAConnector, "bCA2", conf)

    def test_13_ssl_encrypted_key(self):
        # Create CA connector with an encrypted private key
        conf = CONF
        conf[MS_ATTR.USE_SSL] = True
        conf[MS_ATTR.SSL_CA_CERT] = "tests/testdata/msca-connector/ca.pem"
        conf[MS_ATTR.SSL_CLIENT_CERT] = "tests/testdata/msca-connector/privacyidea.pem"
        conf[MS_ATTR.SSL_CLIENT_KEY] = "tests/testdata/msca-connector/privacyidea-encrypted.key"
        conf[MS_ATTR.SSL_CLIENT_KEY_PASSWORD] = "test"
        self.cacon = MSCAConnector("bCA2", conf)

    def test_14_ssl_encrypted_key(self):
        # Create CA connector with an encrypted private key but wrong passphrase
        conf = CONF
        conf[MS_ATTR.USE_SSL] = True
        conf[MS_ATTR.SSL_CA_CERT] = "tests/testdata/msca-connector/ca.pem"
        conf[MS_ATTR.SSL_CLIENT_CERT] = "tests/testdata/msca-connector/privacyidea.pem"
        conf[MS_ATTR.SSL_CLIENT_KEY] = "tests/testdata/msca-connector/privacyidea-encrypted.key"
        conf[MS_ATTR.SSL_CLIENT_KEY_PASSWORD] = "wrong"
        self.assertRaises(CAError, MSCAConnector, "bCA2", conf)


class CreateLocalCATestCase(MyTestCase):
    """
    test creating a new CA using the local caconnector
    """

    @classmethod
    def tearDownClass(cls):
        filelist = glob.glob("{0!s}2/*".format(WORKINGDIR))
        for f in filelist:
            try:
                os.remove(f)
            except OSError:
                print("Error deleting file {0!s}.".format(f))
        os.rmdir("{0!s}2".format(WORKINGDIR))
        super().tearDownClass()

    def test_01_create_ca(self):
        cwd = os.getcwd()
        workdir = os.path.join(cwd, WORKINGDIR + '2')
        if os.path.exists(workdir):
            shutil.rmtree(workdir)
        inputstr = str(workdir + '\n\n\n\n\n\ny\n')
        with patch('sys.stdin', StringIO(inputstr)):
            caconfig = LocalCAConnector.create_ca('localCA2')
            self.assertEqual(caconfig.get("WorkingDir"), workdir)
            cacon = LocalCAConnector('localCA2', caconfig)
            self.assertEqual(cacon.name, 'localCA2')
            self.assertEqual(cacon.workingdir, workdir)
            # check if the generated files exist
            self.assertTrue(os.path.exists(os.path.join(workdir, 'cacert.pem')))

"""
Tests for shared FIDO helpers.
"""

from edumfa.lib.tokens.fido import url_decode, url_encode, x509name_to_string

from .base import MyTestCase


class _MockX509Name:
    def __init__(self, components):
        self._components = components

    def get_components(self):
        return self._components


class FIDOHelperFuncTestCase(MyTestCase):
    def test_01_url_decode_unpadded(self):
        decoded = url_decode("SGFsbG8sIGRhcyBpc3QgZWluIFRlc3QuLi4")
        self.assertEqual(decoded, b"Hallo, das ist ein Test...")

    def test_02_url_encode_strips_padding(self):
        encoded = url_encode(b"test")
        self.assertEqual(encoded, "dGVzdA")

    def test_03_url_roundtrip(self):
        payload = b"edumfa-fido-roundtrip"
        self.assertEqual(url_decode(url_encode(payload)), payload)

    def test_04_x509name_to_string(self):
        name = _MockX509Name(
            [(b"CN", b"Yubico U2F Root CA Serial 457200631"), (b"O", b"Yubico AB")]
        )
        self.assertEqual(
            x509name_to_string(name),
            "CN=Yubico U2F Root CA Serial 457200631,O=Yubico AB",
        )

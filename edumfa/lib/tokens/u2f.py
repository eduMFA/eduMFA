# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2015 Cornelius Kölbel <cornelius@privacyidea.org>
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

import re
import binascii
from hashlib import sha256
import base64
import logging
import time
import struct
from cryptography import x509
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa, padding
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from cryptography.x509.oid import NameOID

from edumfa.lib.utils import (to_bytes, to_unicode, hexlify_and_unicode,
                                   urlsafe_b64encode_and_unicode)

__doc__ = """Helper functions for U2F protocol according to
https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-raw-message-formats.html

This file is tested in tests/test_lib_tokens_utf.py
"""

log = logging.getLogger(__name__)


def url_decode(url):
    """
    Decodes a base64 encoded, not padded string as used in FIDO U2F

    :param url: base64 urlsafe encoded string
    :type url: basestring or bytes
    :return: the decoded string
    :rtype: bytes
    """
    # remove all non base64 characters (newline, CR) from the string before
    # calculating the padding length
    pad_len = -len(re.sub('[^A-Za-z0-9-_+/]+', '', to_unicode(url))) % 4

    padding = pad_len * "="
    res = base64.urlsafe_b64decode(to_bytes(url) + to_bytes(padding))
    return res


def url_encode(data):
    """
    Encodes a string base64 websafe and omits trailing padding "=".
    :param data: Some string
    :return: websafe b64 encoded string
    """
    url = urlsafe_b64encode_and_unicode(data)
    return url.strip("=")


def parse_response_data(resp_data):
    """
    According to https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-raw-message-formats.html#authentication-response-message-success
    the response is made up of
    0:      user presence byte
    1-4:    counter
    5-:     signature

    :param resp_data: response data from the FIDO U2F client
    :type resp_data: hex string
    :return: tuple of user_presence_byte(byte), counter(int),
        signature(bytearray)
    """
    resp_data_bin = binascii.unhexlify(resp_data)
    user_presence = bytes((resp_data_bin[0], ))
    signature = resp_data_bin[5:]
    counter = struct.unpack(">L", resp_data_bin[1:5])[0]
    return user_presence, counter, signature


def parse_registration_data(reg_data, verify_cert=True):
    """
    returns the parsed registration data in a tuple
    attestation_cert, user_pub_key, key_handle, signature, description

     * attestation_cert is a Certificate object
     * user_pub_key is a hex string
     * key_handle is a hex string
     * signature is a hex string
     * description is a basestring

    see
    https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment
    -20150514/fido-u2f-raw-message-formats.html#registration-messages

    :param reg_data: base64 encoded registration data
    :param verify_cert: whether the attestation certificate should be verified
    :return: tuple
    """
    reg_data_bin = url_decode(reg_data)
    reserved_byte_value = reg_data_bin[0]  # must be 5
    if reserved_byte_value != 5:
        raise Exception("The registration data is in a wrong format. It must "
                        "start with 0x05")
    user_pub_key = reg_data_bin[1:66]
    key_handle_len = reg_data_bin[66]
    # We need to save the key handle
    key_handle = reg_data_bin[67:67+key_handle_len]

    certificate = reg_data_bin[67+key_handle_len:]
    attestation_cert = x509.load_der_x509_certificate(certificate)
    cert_len = len(attestation_cert.public_bytes(serialization.Encoding.DER))
    # TODO: Check the issuer of the certificate
    issuer = attestation_cert.issuer
    log.debug("The attestation certificate is signed by {0!r}".format(issuer))
    not_after = attestation_cert.not_valid_after
    not_before = attestation_cert.not_valid_before
    log.debug("The attestation certificate "
              "is valid from %s to %s" % (not_before, not_after))
    # check the validity period of the certificate
    if verify_cert:
        if not_before > time.localtime() or \
                        not_after < time.localtime():  #pragma no cover
            log.error("The certificate is not valid. {0!s} -> {1!s}".format(not_before,
                                                                  not_after))
            raise Exception("The time of the attestation certificate is not "
                            "valid.")

    # Get the subject as description
    subj_x509name = attestation_cert.subject
    # subj_list = subj_x509name.rfc4514_string()
    description = ""
    cdump = attestation_cert.public_bytes(serialization.Encoding.PEM)
    log.debug("This attestation certificate registered: {0!s}".format(cdump))

    cn_attributes = subj_x509name.get_attributes_for_oid(NameOID.COMMON_NAME)
    if cn_attributes:
        description = cn_attributes[0].value


    signature = reg_data_bin[67+key_handle_len+cert_len:]
    return (attestation_cert, hexlify_and_unicode(user_pub_key),
            hexlify_and_unicode(key_handle), hexlify_and_unicode(signature),
            description)


def check_registration_data(attestation_cert, app_id,
                            client_data, user_pub_key,
                            key_handle, signature):
    """
    See example in fido spec
    https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-raw-message-formats.html#registration-example

    In case of signature error an exception is raised

    :param attestation_cert: The Attestation cert of the FIDO device
    :type attestation_cert: Certificate Object
    :param app_id: The appId
    :type app_id: str
    :param client_data: The ClientData
    :type client_data: str
    :param user_pub_key: The public key for this AppID
    :type user_pub_key: hex string
    :param key_handle: The keyHandle on the FIDO device
    :type key_handle: hex string
    :param signature: The signature of the registration request
    :type signature: hex string
    :return: Bool
    """
    app_id_hash = sha256(to_bytes(app_id)).digest()
    client_data_hash = sha256(to_bytes(client_data)).digest()
    reg_data = b'\x00' + app_id_hash + client_data_hash \
               + binascii.unhexlify(key_handle) + binascii.unhexlify(user_pub_key)
    try:
        public_key = attestation_cert.public_key()
        public_key_bytes = public_key.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo)
        public_key_cryptography = serialization.load_pem_public_key(
            public_key_bytes,
            backend=default_backend()
        )
        if isinstance(public_key_cryptography, ec.EllipticCurvePublicKey):
            public_key_cryptography.verify(signature=binascii.unhexlify(signature),
                        data=reg_data,
                        signature_algorithm=ec.ECDSA(hashes.SHA256()))    # Ensure this matches the hash used for signing
        elif isinstance(public_key_cryptography, rsa.RSAPublicKey):
            public_key_cryptography.verify(signature=binascii.unhexlify(signature),
                        data=reg_data,
                        padding=padding.PKCS1v15(),  # Ensure this matches the scheme used for signing
                        algorithm=hashes.SHA256())    # Ensure this matches the hash used for signing
        else:
            raise Exception("Unknown keytype")
    except Exception as exx:
        raise Exception("Error checking the signature of the registration "
                        "data. %s" % exx)
    return True


def check_response(user_pub_key, app_id, client_data, signature,
                   counter, user_presence_byte=b'\x01'):
    """
    Check the ECDSA Signature with the given pubkey.
    The signed data is constructed from
     * app_id
     * user_presence_byte
     * counter and
     * client_data

    :param user_pub_key: The Application specific public key
    :type user_pub_key: hex string
    :param app_id: The AppID for this challenge response
    :type app_id: str
    :param client_data: The ClientData
    :type client_data: str
    :param counter: A counter
    :type counter: int
    :param user_presence_byte: User presence byte
    :type user_presence_byte: bytes
    :param signature: The signature of the authentication request
    :type signature: hex string
    :return:
    """
    res = True
    app_id_hash = sha256(to_bytes(app_id)).digest()
    client_data_hash = sha256(to_bytes(client_data)).digest()
    user_pub_key_bin = binascii.unhexlify(user_pub_key)
    counter_bin = struct.pack(">L", counter)
    signature_bin = binascii.unhexlify(signature)

    input_data = app_id_hash + user_presence_byte + counter_bin + client_data_hash

    try:
        vkey = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(),
                                                            user_pub_key_bin)
        vkey.verify(signature_bin, input_data, ec.ECDSA(hashes.SHA256()))
    except (ValueError, TypeError) as e:
        log.error("Could not load application specific public key!")
        log.debug('{0!s}'.format(e))
        res = False
    except InvalidSignature:
        log.error("Bad signature for app_id {0!s}".format(app_id))
        res = False
    return res


def x509name_to_string(x509name):
    """
    converts a X509Name to a string as in a DN

    :param x509name: The X509Name object
    :type x509name: cryptography.x509.Name
    :return:
    """
    return x509name.rfc4514_string()

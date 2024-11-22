#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2017 - 2021 Cornelius Kölbel <cornelius.koelbel@netknights.it>
# 2016 Mathias Brossard <mathias@axiadids.com>
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

import datetime
import logging

from edumfa.lib.crypto import get_alphanum_str
from edumfa.lib.error import HSMException
from edumfa.lib.security.default import SecurityModule, int_list_to_bytestring

__doc__ = """
This is a PKCS11 Security module that encrypts and decrypts the data on a
HSM that is connected via PKCS11. This alternate version relies on AES keys.
"""

log = logging.getLogger(__name__)

MAX_RETRIES = 5

try:
    import PyKCS11
except ImportError:
    log.info(
        "The python module PyKCS11 is not available. "
        "So we can not use the PKCS11 security module."
    )


class AESHardwareSecurityModule(SecurityModule):  # pragma: no cover

    def __init__(self, config=None):
        """
        Initialize the PKCS11 Security Module.
        The configuration needs to contain the pkcs11 module and the ID of the key.

        {"module": "/usr/lib/hsm_pkcs11.so", "slot": 42, "key_label": "eduMFA"}

        The HSM is not directly ready, since the HSM is protected by a password.
        The function setup_module({"password": "HSM User password"}) needs to be called.

        :param config: contains the HSM configuration
        :type config: dict

        :return: The Security Module object
        """
        config = config or {}
        self.name = "HSM"
        self.config = config
        # Initially, we might be missing a password
        self.is_ready = False

        if "module" not in config:
            log.error("No PKCS11 module defined!")
            raise HSMException("No PKCS11 module defined.")

        label_prefix = config.get("key_label", "eduMFA")
        self.key_labels = {}
        for k in self.mapping:
            l = config.get(f"key_label_{k!s}")
            l = f"{label_prefix!s}_{k!s}" if l is None else l
            self.key_labels[k] = l

        log.debug(f"Setting key labels: {self.key_labels!s}")
        # convert the slot to int
        self.slot = int(config.get("slot", 1))
        log.debug(f"Setting slot: {self.slot!s}")
        self.password = config.get("password")
        log.debug(f"Setting a password: {bool(self.password)!s}")
        self.module = config.get("module")
        log.debug(f"Setting the modules: {self.module!s}")
        self.max_retries = config.get("max_retries", MAX_RETRIES)
        log.debug(f"Setting max retries: {self.max_retries!s}")
        self.session = None
        self.session_start_time = datetime.datetime.now()
        self.session_lastused_time = datetime.datetime.now()
        self.key_handles = {}

        self.initialize_hsm()

    def initialize_hsm(self):
        """
        Initialize the HSM:
        * initialize PKCS11 library
        * login to HSM
        * get session
        :return:
        """
        self.pkcs11 = PyKCS11.PyKCS11Lib()
        self.pkcs11.load(self.module)
        self.pkcs11.lib.C_Initialize()
        if self.password:
            self._login()

    def setup_module(self, params):
        """
        callback, which is called during the runtime to initialze the
        security module.

        Here the password for the PKCS11 HSM can be provided

           {"password": "top secreT"}

        :param params: The password for the HSM
        :type  params: dict

        :return: -
        """
        if "password" in params:
            self.password = str(params.get("password"))
        else:
            raise HSMException("missing password")
        self._login()
        return self.is_ready

    def _login(self):
        slotlist = self.pkcs11.getSlotList()
        log.debug(f"Found the slots: {slotlist!s}")
        if not len(slotlist):
            raise HSMException("No HSM connected. No slots found.")
        if self.slot == -1 and len(slotlist) == 1:
            # Use the first and only slot
            self.slot = slotlist[0]
        if self.slot not in slotlist:
            raise HSMException(f"Slot {self.slot:d} not present")

        slotinfo = self.pkcs11.getSlotInfo(self.slot)
        log.debug(f"Setting up '{slotinfo.slotDescription}'")

        # Before starting the session, we log the old session time usage
        log.debug(
            "Starting new session now. The old session started {!s} seconds ago.".format(
                datetime.datetime.now() - self.session_start_time
            )
        )
        log.debug(
            "Starting new session now. The old session was used {!s} seconds ago.".format(
                datetime.datetime.now() - self.session_lastused_time
            )
        )
        # If the HSM is not connected at this point, it will fail
        self.session = self.pkcs11.openSession(slot=self.slot)
        self.session_start_time = datetime.datetime.now()

        log.debug(f"Logging on to '{slotinfo.slotDescription}'")
        self.session.login(self.password)

        for k in self.mapping:
            label = self.key_labels[k]
            objs = self.session.findObjects(
                [
                    (PyKCS11.CKA_CLASS, PyKCS11.CKO_SECRET_KEY),
                    (PyKCS11.CKA_LABEL, label),
                ]
            )
            log.debug(f"Loading '{k}' key with label '{label}'")
            if objs:
                self.key_handles[self.mapping[k]] = objs[0]

        # self.session.logout()
        log.debug("Successfully setup the security module.")
        self.is_ready = True

    def random(self, length):
        """
        Return a random bytestring
        :param length: length of the random bytestring
        :rtype bytes
        """
        retries = 0
        while True:
            try:
                r_integers = self.session.generateRandom(length)
                self.session_lastused_time = datetime.datetime.now()
                break
            except PyKCS11.PyKCS11Error as exx:
                log.warning(f"Generate Random failed: {exx!s}")
                # If we get an CKR_SESSION_HANDLE_INVALID error code, we free
                # memory, session and handles and retry
                if exx.value == PyKCS11.CKR_SESSION_HANDLE_INVALID:
                    self.pkcs11.lib.C_Finalize()
                    self.initialize_hsm()
                    retries += 1
                    if retries > self.max_retries:
                        raise HSMException(
                            "Failed to generate random number after multiple retries."
                        )
                else:
                    raise HSMException(
                        f"HSM random number generation failed with {exx!s}"
                    )

        # convert the array of the random integers to a string
        return int_list_to_bytestring(r_integers)

    def encrypt(self, data, iv, key_id=SecurityModule.TOKEN_KEY):
        """

        :rtype: bytes
        """
        log.debug(f"Encrypting {len(data)} bytes with key {key_id}")
        m = PyKCS11.Mechanism(PyKCS11.CKM_AES_CBC_PAD, iv)
        retries = 0
        while True:
            try:
                k = self.key_handles[key_id]
                r = self.session.encrypt(k, bytes(data), m)
                self.session_lastused_time = datetime.datetime.now()
                break
            except PyKCS11.PyKCS11Error as exx:
                log.warning(f"Encryption failed: {exx!s}")
                # If we get an CKR_SESSION_HANDLE_INVALID error code, we free
                # memory, session and handles and retry
                if exx.value == PyKCS11.CKR_SESSION_HANDLE_INVALID:
                    self.pkcs11.lib.C_Finalize()
                    self.initialize_hsm()
                    retries += 1
                    if retries > self.max_retries:
                        raise HSMException("Failed to encrypt after multiple retries")
                else:
                    raise HSMException(f"HSM encryption failed with {exx!s}")

        return int_list_to_bytestring(r)

    def decrypt(self, enc_data, iv, key_id=SecurityModule.TOKEN_KEY):
        """

        :rtype bytes
        """
        # we keep this for legacy reasons, even though it hasn't worked anyway
        if len(enc_data) == 0:
            return b""
        log.debug(f"Decrypting {len(enc_data)} bytes with key {key_id}")
        m = PyKCS11.Mechanism(PyKCS11.CKM_AES_CBC_PAD, iv)
        start = datetime.datetime.now()
        retries = 0
        while True:
            try:
                k = self.key_handles[key_id]
                r = self.session.decrypt(k, bytes(enc_data), m)
                self.session_lastused_time = datetime.datetime.now()
                break
            except PyKCS11.PyKCS11Error as exx:
                log.warning(f"Decryption failed: {exx!s}")
                # If we get an CKR_SESSION_HANDLE_INVALID error code, we free
                # memory, session and handles and retry
                if exx.value == PyKCS11.CKR_SESSION_HANDLE_INVALID:
                    self.pkcs11.lib.C_Finalize()
                    self.initialize_hsm()
                    retries += 1
                    if retries > self.max_retries:
                        td = datetime.datetime.now() - start
                        log.warning(
                            f"Decryption finally failed: {exx!s}. Time taken: {td!s}."
                        )
                        raise HSMException("Failed to decrypt after multiple retries.")
                else:
                    raise HSMException(f"HSM decrypt failed with {exx!s}")

        if retries > 0:
            td = datetime.datetime.now() - start
            log.warning(
                f"Decryption after {retries!s} retries successful. Time taken: {td!s}."
            )
        return int_list_to_bytestring(r)

    def create_keys(self):
        """
        Connect to the HSM and create the encryption keys.
        The HSM connection should already be configured in edumfa.cfg.

        We will create new keys with new key labels
        :return: a dictionary of the created key labels
        """
        # We need a new read/write session
        session = self.pkcs11.openSession(
            self.slot, PyKCS11.CKF_SERIAL_SESSION | PyKCS11.CKF_RW_SESSION
        )
        # We need to logout, otherwise we get CKR_USER_ALREADY_LOGGED_IN
        session.logout()
        session.login(self.password)

        key_labels = {"token": "", "config": "", "value": ""}

        for kl in key_labels.keys():
            label = f"{kl!s}_{get_alphanum_str()!s}"
            aesTemplate = [
                (PyKCS11.CKA_CLASS, PyKCS11.CKO_SECRET_KEY),
                (PyKCS11.CKA_KEY_TYPE, PyKCS11.CKK_AES),
                (PyKCS11.CKA_VALUE_LEN, 32),
                (PyKCS11.CKA_LABEL, label),
                (PyKCS11.CKA_TOKEN, PyKCS11.CK_TRUE),
                (PyKCS11.CKA_PRIVATE, True),
                (PyKCS11.CKA_SENSITIVE, True),
                (PyKCS11.CKA_ENCRYPT, True),
                (PyKCS11.CKA_DECRYPT, True),
                (PyKCS11.CKA_TOKEN, True),
                (PyKCS11.CKA_WRAP, True),
                (PyKCS11.CKA_UNWRAP, True),
                (PyKCS11.CKA_EXTRACTABLE, False),
            ]
            aesKey = session.generateKey(aesTemplate)
            key_labels[kl] = label

        session.logout()
        session.closeSession()

        return key_labels


if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig()
    log.setLevel(logging.INFO)
    # log.setLevel(logging.DEBUG)

    module = "/usr/local/opt/pkcs11/lib/pkcs11-token.so"

    p = AESHardwareSecurityModule(
        {"module": module, "slot": 2, "key_label": "edumfa", "password": "12345678"}
    )

    # password
    password = "topSekr3t" * 16
    crypted = p.encrypt_password(password)
    text = p.decrypt_password(crypted)
    assert text == password  # nosec B101 # This is actually a test
    log.info("password encrypt/decrypt test successful")

    # pin
    password = "topSekr3t"  # nosec B105 # used for testing
    crypted = p.encrypt_pin(password)
    text = p.decrypt_pin(crypted)
    assert text == password  # nosec B101 # This is actually a test
    log.info("pin encrypt/decrypt test successful")

    p = AESHardwareSecurityModule({"module": module, "slot": 2, "key_label": "edumfa"})
    p.setup_module({"password": "12345678"})

    # random
    tmp_iv = p.random(16)
    plain = p.random(128)
    log.info("random test successful")

    # generic encrypt / decrypt
    cipher = p.encrypt(plain, tmp_iv)
    assert plain != cipher  # nosec B101 # This is actually a test
    text = p.decrypt(cipher, tmp_iv)
    assert text == plain  # nosec B101 # This is actually a test
    log.info("generic encrypt/decrypt test successful")

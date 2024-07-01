# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2019   Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
__doc__ = """The pushtoken sends a push notification via Firebase service
to the registered smartphone.
The token is a challenge response token. The smartphone will sign the challenge
and send it back to the authentication endpoint.

This code is tested in tests/test_lib_tokens_push
"""

from edumfa.api.lib.policyhelper import get_legacypushtoken_add_config
from edumfa.lib.tokens.pushtoken import PushTokenClass
from edumfa.lib.tokenclass import TokenClass

import logging

log = logging.getLogger(__name__)


class LegacyPushTokenClass(PushTokenClass):
    """
    The :ref:`push_token` uses the Firebase service to send challenges to the
    user's smartphone. The user confirms on the smartphone, signs the
    challenge and sends it back to eduMFA.

    The enrollment occurs in two enrollment steps:

    **Step 1**:
      The device is enrolled using a QR code, which encodes the following URI::

          otpauth://pipush/PIPU0006EF85?url=https://youredumfaserver/enroll/this/token&ttl=120

    **Step 2**:
      In the QR code is a URL, where the smartphone sends the remaining data for the enrollment:

        .. sourcecode:: http

            POST /ttype/push HTTP/1.1
            Host: https://youredumfaserver/

            enrollment_credential=<hex nonce>
            serial=<token serial>
            fbtoken=<Firebase token>
            pubkey=<public key>

    For more information see:

    - https://github.com/privacyidea/privacyidea/issues/1342
    - https://github.com/privacyidea/privacyidea/wiki/concept%3A-PushToken
    """

    def __init__(self, db_token):
        TokenClass.__init__(self, db_token)
        self.set_type("push")
        self.hKeyRequired = False

    @staticmethod
    def get_class_type():
        """
        return the generic token class identifier
        """
        return "push"

    @staticmethod
    def get_class_prefix():
        return "PIPU"

    @staticmethod
    def get_class_title():
        return "Legacy PUSH Token"

    @staticmethod
    def get_class_description():
        return "Legacy PUSH: Send a push notification to a smartphone."

    @staticmethod
    def get_push_url_prefix():
        return "otpauth://pipush"

    class PUSH_ACTION(object):
        FIREBASE_CONFIG = "push_firebase_configuration"
        REGISTRATION_URL = "push_registration_url"
        TTL = "push_ttl"
        MOBILE_TEXT = "push_text_on_mobile"
        MOBILE_TITLE = "push_title_on_mobile"
        SSL_VERIFY = "push_ssl_verify"
        WAIT = "push_wait"
        ALLOW_POLLING = "push_allow_polling"

    @staticmethod
    def get_policy_group():
        return "Legacy PUSH"

    @classmethod
    def get_pushtoken_add_config(cls, *args, **kwargs):
        return get_legacypushtoken_add_config(*args, **kwargs)

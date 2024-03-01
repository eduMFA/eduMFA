# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2014 - 2019 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#
# Copyright (C) 2010 - 2014 LSE Leading Security Experts GmbH
# License:  LSE
# contact:  http://www.linotp.org
#           http://www.lsexperts.de
#           linotp@lsexperts.de
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
__doc__ = """
This is the implementation of the yubico token type.
Authentication requests are forwarded to the Yubico Cloud service YubiCloud.

The code is tested in tests/test_lib_tokens_yubico
"""
import logging
from edumfa.lib.decorators import check_token_locked
import traceback
import requests
from edumfa.api.lib.utils import getParam
from edumfa.lib.crypto import geturandom
from edumfa.lib.config import get_from_config
from edumfa.lib.log import log_with
from edumfa.lib.tokenclass import TokenClass, TOKENKIND
from edumfa.lib.tokens.yubikeytoken import (yubico_check_api_signature,
                                                 yubico_api_signature)
from urllib.parse import urlencode
from edumfa.lib import _
from edumfa.lib.policy import SCOPE, ACTION, GROUP

YUBICO_LEN_ID = 12
YUBICO_LEN_OTP = 44
YUBICO_URL = "https://api.yubico.com/wsapi/2.0/verify"
# The Yubico API requires GET requests. See: https://developers.yubico.com/yubikey-val/Validation_Protocol_V2.0.html
# Previously we used POST requests.
# If you want to have the old behaviour, you can set this to True
DO_YUBICO_POST = False
DEFAULT_CLIENT_ID = 20771
DEFAULT_API_KEY = "9iE9DRkPHQDJbAFFC31/dum5I54="

optional = True
required = False

log = logging.getLogger(__name__)


class YubicoTokenClass(TokenClass):

    def __init__(self, db_token):
        TokenClass.__init__(self, db_token)
        self.set_type("yubico")
        self.tokenid = ""

    @staticmethod
    def get_class_type():
        return "yubico"

    @staticmethod
    def get_class_prefix():
        return "UBCM"

    @staticmethod
    @log_with(log)
    def get_class_info(key=None, ret='all'):
        """
        :param key: subsection identifier
        :type key: string
        :param ret: default return value, if nothing is found
        :type ret: user defined
        :return: subsection if key exists or user defined
        :rtype: dict or string
        """
        res = {'type': 'yubico',
               'title': 'Yubico Token',
               'description': _('Yubikey Cloud mode: Forward authentication '
                                'request to YubiCloud.'),
               'user':  ['enroll'],
               # This tokentype is enrollable in the UI for...
               'ui_enroll': ["admin", "user"],
               'policy': {
                   SCOPE.ENROLL: {
                       ACTION.MAXTOKENUSER: {
                           'type': 'int',
                           'desc': _("The user may only have this maximum number of Yubico tokens assigned."),
                           'group': GROUP.TOKEN
                       },
                       ACTION.MAXACTIVETOKENUSER: {
                           'type': 'int',
                           'desc': _(
                               "The user may only have this maximum number of active Yubico tokens assigned."),
                           'group': GROUP.TOKEN
                       }
                   }
               },
               }

        if key:
            ret = res.get(key, {})
        else:
            if ret == 'all':
                ret = res
        return ret

    def update(self, param):
        tokenid = getParam(param, "yubico.tokenid", required)
        if len(tokenid) < YUBICO_LEN_ID:
            log.error("The tokenid needs to be {0:d} characters long!".format(YUBICO_LEN_ID))
            raise Exception("The Yubikey token ID needs to be {0:d} characters long!".format(YUBICO_LEN_ID))

        if len(tokenid) > YUBICO_LEN_ID:
            tokenid = tokenid[:YUBICO_LEN_ID]
        self.tokenid = tokenid
        # overwrite the maybe wrong length given at the command line
        param['otplen'] = 44
        TokenClass.update(self, param)
        self.add_tokeninfo("yubico.tokenid", self.tokenid)
        self.add_tokeninfo("tokenkind", TOKENKIND.HARDWARE)

    @log_with(log)
    @check_token_locked
    def check_otp(self, anOtpVal, counter=None, window=None, options=None):
        """
        Here we contact the Yubico Cloud server to validate the OtpVal.
        """
        res = -1

        apiId = get_from_config("yubico.id", DEFAULT_CLIENT_ID)
        apiKey = get_from_config("yubico.secret", DEFAULT_API_KEY)
        yubico_url = get_from_config("yubico.url", YUBICO_URL)
        do_yubico_post = get_from_config("yubico.do_post", DO_YUBICO_POST)

        if apiKey == DEFAULT_API_KEY or apiId == DEFAULT_CLIENT_ID:
            log.warning("Usage of default apiKey or apiId not recommended!")
            log.warning("Please register your own apiKey and apiId at "
                        "yubico website!")
            log.warning("Configure of apiKey and apiId at the "
                        "edumfa manage config menu!")

        tokenid = self.get_tokeninfo("yubico.tokenid")
        if len(anOtpVal) < 12:
            log.warning("The otpval is too short: {0!r}".format(anOtpVal))
        elif anOtpVal[:12] != tokenid:
            log.warning("The tokenid in the OTP value does not match "
                        "the assigned token!")
        else:
            nonce = geturandom(20, hex=True)
            p = {'nonce': nonce,
                 'otp': anOtpVal,
                 'id': apiId}
            # Also send the signature to the yubico server
            p["h"] = yubico_api_signature(p, apiKey)

            try:
                if do_yubico_post:
                    r = requests.post(yubico_url,
                                      data=p,
                                      timeout=60)
                else:
                    r = requests.get(yubico_url,
                                     params=urlencode(p),
                                     timeout=60)

                if r.status_code == requests.codes.ok:
                    response = r.text
                    elements = response.split()
                    data = {}
                    for elem in elements:
                        k, v = elem.split("=", 1)
                        data[k] = v
                    result = data.get("status")
                    return_nonce = data.get("nonce")
                    # check signature:
                    signature_valid = yubico_check_api_signature(data, apiKey)

                    if not signature_valid:
                        log.error("The hash of the return from the yubico "
                                  "authentication server ({0!s}) "
                                  "does not match the data!".format(yubico_url))

                    if nonce != return_nonce:
                        log.error("The returned nonce does not match "
                                  "the sent nonce!")

                    if result == "OK":
                        res = 1
                        if nonce != return_nonce or not signature_valid:
                            log.warning("Nonce and Hash do not match.")
                            res = -2
                    else:
                        # possible results are listed here:
                        # https://github.com/Yubico/yubikey-val/wiki/ValidationProtocolV20
                        log.warning("failed with {0!r}".format(result))

            except Exception as ex:
                log.error("Error getting response from Yubico Cloud Server"
                          " (%r): %r" % (yubico_url, ex))
                log.debug("{0!s}".format(traceback.format_exc()))

        return res

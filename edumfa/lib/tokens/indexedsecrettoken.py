# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2020 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
__doc__ = """This is the implementation of an Indexed Secret-Token.
It is a challenge response token, that asks the user for certain positions
of the secret string.
The user must know the secret and return the characters from the requested positions.

The secret is stored in the encrypted OTP KEY.

The code is tested in tests/test_lib_tokens_indexedsecret

Note that this token has no "check_otp" function. So it is not even
possible to do a "single shot" authentication, since the base class check_otp always
returns -1.
"""

import datetime
import logging

from edumfa.lib import _
from edumfa.lib.challenge import get_challenges
from edumfa.lib.crypto import safe_compare, urandom
from edumfa.lib.decorators import check_token_locked
from edumfa.lib.error import ValidateError
from edumfa.lib.log import log_with
from edumfa.lib.policy import ACTION, GROUP, SCOPE, get_action_values_from_options
from edumfa.lib.tokenclass import AUTHENTICATIONMODE, TokenClass
from edumfa.lib.utils import to_unicode
from edumfa.models import Challenge

log = logging.getLogger(__name__)

DEFAULT_CHALLENGE_TEXT = _("Please enter the positions {0!s} from your secret.")
DEFAULT_POSITION_COUNT = 2


class PIIXACTION:
    COUNT = "count"
    PRESET_ATTRIBUTE = "preset_attribute"
    FORCE_ATTRIBUTE = "force_attribute"


class IndexedSecretTokenClass(TokenClass):
    """
    Implementation of the Indexed Secret Token Class, that asks the user for certain
    positions in a shared secret.
    """

    mode = [AUTHENTICATIONMODE.CHALLENGE]

    # The token type provides means to verify the enrollment
    can_verify_enrollment = True

    def __init__(self, aToken):
        TokenClass.__init__(self, aToken)
        self.set_type("indexedsecret")

    @staticmethod
    def get_class_type():
        """
        return the generic token class identifier
        """
        return "indexedsecret"

    @staticmethod
    def get_class_prefix():
        return "PIIX"

    @staticmethod
    def get_class_info(key=None, ret="all"):
        """
        returns all or a subtree of the token definition

        :param key: subsection identifier
        :type key: string
        :param ret: default return value, if nothing is found
        :type ret: user defined

        :return: subsection if key exists or user defined
        :rtype : s.o.
        """
        res = {
            "type": "indexedsecret",
            "title": _("Indexed Secret Token"),
            "description": _(
                "IndexedSecret: Request certain positions of a shared secret from the user."
            ),
            "user": ["enroll"],
            # This tokentype is enrollable in the UI for...
            "ui_enroll": ["admin", "user"],
            "policy": {
                SCOPE.AUTH: {
                    ACTION.CHALLENGETEXT: {
                        "type": "str",
                        "desc": _(
                            "Use an alternate challenge text for telling the "
                            "user which positions of the secret he should enter."
                        ),
                        "group": "Indexed Secret Token",
                    },
                    PIIXACTION.COUNT: {
                        "type": "int",
                        "desc": _(
                            "Number of necessary positions to be answered by the user."
                        ),
                        "group": "Indexed Secret Token",
                    },
                },
                SCOPE.WEBUI: {
                    PIIXACTION.PRESET_ATTRIBUTE: {
                        "type": "str",
                        "desc": _(
                            "Preset the enrollment with the value of the given attribute."
                        ),
                        "group": "token",
                    }
                },
                SCOPE.USER: {
                    PIIXACTION.FORCE_ATTRIBUTE: {
                        "type": "str",
                        "desc": _(
                            "The attribute whose value should be force set during enrollment."
                        ),
                        "group": "enrollment",
                    }
                },
                SCOPE.ADMIN: {
                    PIIXACTION.FORCE_ATTRIBUTE: {
                        "type": "str",
                        "desc": _(
                            "The attribute whose value should be force set during enrollment."
                        ),
                        "group": "enrollment",
                    }
                },
                SCOPE.ENROLL: {
                    ACTION.MAXTOKENUSER: {
                        "type": "int",
                        "desc": _(
                            "The user may only have this maximum number of indexed secret tokens assigned."
                        ),
                        "group": GROUP.TOKEN,
                    },
                    ACTION.MAXACTIVETOKENUSER: {
                        "type": "int",
                        "desc": _(
                            "The user may only have this maximum number of active indexed secret"
                            " tokens assigned."
                        ),
                        "group": GROUP.TOKEN,
                    },
                },
            },
        }

        if key:
            ret = res.get(key, {})
        else:
            if ret == "all":
                ret = res

        return ret

    @log_with(log)
    def update(self, param, reset_failcount=True):
        """
        update - process initialization parameters

        :param param: dict of initialization parameters
        :type param: dict

        :return: nothing

        """
        if "genkey" not in param and "otpkey" not in param:
            param["genkey"] = 1

        TokenClass.update(self, param, reset_failcount)
        return

    @log_with(log)
    def create_challenge(self, transactionid=None, options=None):
        """
        create a challenge, which is submitted to the user

        :param transactionid: the id of this challenge
        :param options: the request context parameters / data
        :return: tuple of (bool, message, transactionid, attributes)
        :rtype: tuple

        The return tuple builds up like this:
        ``bool`` if submit was successful;
        ``message`` which is displayed in the JSON response;
        additional challenge ``reply_dict``, which are displayed in the JSON challenges response.
        """
        options = options or {}
        return_message = (
            get_action_values_from_options(
                SCOPE.AUTH,
                f"{self.get_class_type()!s}_{ACTION.CHALLENGETEXT!s}",
                options,
            )
            or DEFAULT_CHALLENGE_TEXT
        )

        if self.get_tokeninfo("multichallenge"):
            # In case of multichallenge we ask only once.
            position_count = 1
        else:
            position_count = int(
                get_action_values_from_options(
                    SCOPE.AUTH,
                    f"{self.get_class_type()!s}_{PIIXACTION.COUNT!s}",
                    options,
                )
                or DEFAULT_POSITION_COUNT
            )

        attributes = {"state": transactionid}
        validity = 120

        if self.is_active() is True:
            # We need to get a number of random positions from the secret string
            secret_length = len(self.token.get_otpkey().getKey())
            if not secret_length:
                raise ValidateError(
                    "The indexedsecret token has an empty secret and "
                    "can not be used for authentication."
                )
            random_positions = [
                urandom.randint(1, secret_length) for _x in range(0, position_count)
            ]
            position_str = ",".join([f"{x!s}" for x in random_positions])
            attributes["random_positions"] = random_positions

            db_challenge = Challenge(
                self.token.serial,
                transaction_id=transactionid,
                challenge=options.get("challenge"),
                data=position_str,
                session=options.get("session"),
                validitytime=validity,
            )
            db_challenge.save()
            transactionid = transactionid or db_challenge.transaction_id
            return_message = return_message.format(position_str)

        expiry_date = datetime.datetime.now() + datetime.timedelta(seconds=validity)
        attributes["valid_until"] = f"{expiry_date!s}"
        reply_dict = {"attributes": attributes}

        return True, return_message, transactionid, reply_dict

    @check_token_locked
    def check_challenge_response(self, user=None, passw=None, options=None):
        """
        This method verifies if there is a matching challenge for the given
        passw and also verifies if the response is correct.

        It then returns 1 in case of success
        In case of failure it returns -1

        :param user: the requesting user
        :type user: User object
        :param passw: the password (pin+otp)
        :type passw: string
        :param options: additional arguments from the request, which could
                        be token specific. Usually "transactionid"
        :type options: dict
        :return: return success
        :rtype: int
        """
        options = options or {}
        r_success = -1

        # fetch the transaction_id
        transaction_id = options.get("transaction_id")
        if transaction_id is None:
            transaction_id = options.get("state")

        # get the challenges for this transaction ID
        if transaction_id is not None:
            challengeobject_list = get_challenges(
                serial=self.token.serial, transaction_id=transaction_id
            )

            for challengeobject in challengeobject_list:

                if challengeobject.is_valid():
                    # challenge is still valid
                    # Add the challenge to the options for check_otp
                    options["challenge"] = challengeobject.challenge
                    options["data"] = [int(c) for c in challengeobject.data.split(",")]
                    # Now see if the answer is the right indexes
                    secret_string = to_unicode(self.token.get_otpkey().getKey())
                    if len(options["data"]) == len(passw):
                        expected_answer = "".join(
                            [secret_string[x - 1] for x in options["data"]]
                        )
                        if safe_compare(passw, expected_answer):
                            r_success = 1
                            # Set valid OTP to true. We must not delete the challenge now,
                            # Since we need it for further mutlichallenges
                            challengeobject.set_otp_status(True)
                            log.debug("The presented answer was correct.")
                            break
                        else:
                            log.debug("The presented answer was wrong.")
                            # increase the received_count
                            challengeobject.set_otp_status()
                    else:
                        log.debug(
                            "Length of password does not match the requested number of positions."
                        )
                        # increase the received_count
                        challengeobject.set_otp_status()

        self.challenge_janitor()
        return r_success

    @log_with(log)
    def is_challenge_request(self, passw, user=None, options=None):
        """
        check, if the request would start a challenge

        We need to define the function again, to get rid of the
        is_challenge_request-decorator of the HOTP-Token

        :param passw: password, which might be pin or pin+otp
        :param options: dictionary of additional request parameters

        :return: returns true or false
        """
        return self.check_pin(passw, user=user, options=options)

    @log_with(log)
    def has_further_challenge(self, options=None):
        """
        Check if we should do multi challenge at all and
        then if there are further positions to query.

        :param options: Options dict
        :return: True, if further challenge is required.
        """
        if self.get_tokeninfo("multichallenge"):
            transaction_id = options.get("transaction_id")
            challengeobject_list = get_challenges(
                serial=self.token.serial, transaction_id=transaction_id
            )

            position_count = int(
                get_action_values_from_options(
                    SCOPE.AUTH,
                    f"{self.get_class_type()!s}_{PIIXACTION.COUNT!s}",
                    options,
                )
                or DEFAULT_POSITION_COUNT
            )
            if len(challengeobject_list) == 1:
                session = int(challengeobject_list[0].session or "0") + 1
                options["session"] = f"{session!s}"
                if session < position_count:
                    return True

        return False

    def prepare_verify_enrollment(self):
        """
        This is called, if the token should be enrolled in a way, that the user
        needs to provide a proof, that the server can verify, that the token
        was successfully enrolled. A challenge for the indexed secret token is created
        and the user will later have to answer this.

        The returned dictionary is added to the response in "detail" -> "verify".

        :return: A dictionary with information that is needed to trigger the verification.
        """
        _, return_message, transaction_id, reply_dict = self.create_challenge()
        return {"message": return_message}

    def verify_enrollment(self, verify):
        """
        This is called during the 2nd step of the verified enrollment.
        This method verifies the actual response from the user.
        Returns true, if the verification was successful.

        :param verify: The response given by the user
        :return: True
        """
        # During the enrollment one challenge has been created. The token is not fit
        # for authentication, yet. So there should only be one challenge for this token
        # in the challenge table. Find it!
        chals = get_challenges(serial=self.token.serial)
        if len(chals) != 1:  # pragma: no cover
            log.error("Something is wrong. There is more than one challenge!")
        transaction_id = chals[0].transaction_id
        r = self.check_challenge_response(
            passw=verify, options={"transaction_id": transaction_id}
        )
        log.debug(f"Enrollment verified: {r!s}")
        return r >= 0

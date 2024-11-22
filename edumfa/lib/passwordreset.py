#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2015 - 2022 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
import logging
from datetime import datetime

from sqlalchemy import and_

from edumfa.lib.config import get_from_config
from edumfa.lib.crypto import generate_password, hash_with_pepper, verify_with_pepper
from edumfa.lib.error import ConfigAdminError, UserError, eduMFAError
from edumfa.lib.log import log_with
from edumfa.lib.policy import ACTION, SCOPE, Match
from edumfa.lib.resolver import get_resolver_list
from edumfa.lib.smtpserver import send_email_identifier
from edumfa.models import PasswordReset

__doc__ = """
This is the library for creating a recovery code for password reset.
The recovery code is sent to the user.

The salted/peppered hash of the recovery code is stored in the passwordreset
database table.

This module is tested in tests/test_lib_passwordreset.py
"""

log = logging.getLogger(__name__)

BODY = """Someone requested to reset the password within eduMFA.

To reset your user password please visit the link

{0!s}/reset/{1!s}@{2!s}/{3!s}
"""


@log_with(log)
def create_recoverycode(
    user, email=None, expiration_seconds=3600, recoverycode=None, base_url=""
):
    """
    Create and send a password recovery code

    :param user: User for whom the password reset code should be sent
    :type user: User Object
    :param email: The optional email of the user
    :param recoverycode: Only used for testing purpose
    :return: bool
    """
    base_url = base_url.strip("recover")
    base_url += "#!"
    recoverycode = recoverycode or generate_password(size=24)
    hash_code = hash_with_pepper(recoverycode)
    # send this recoverycode
    #
    pwreset = PasswordReset(
        hash_code,
        username=user.login,
        realm=user.realm,
        expiration_seconds=expiration_seconds,
    )
    pwreset.save()

    res = False
    if not user:
        raise UserError("User required for recovery token.")
    user_email = user.info.get("email")
    if email and email.lower() != user_email.lower():
        raise UserError("The email does not match the users email.")

    identifier = get_from_config("recovery.identifier")
    if identifier:
        # send email
        r = send_email_identifier(
            identifier,
            user_email,
            "Your password reset",
            BODY.format(base_url, user.login, user.realm, recoverycode),
        )
        if not r:
            raise eduMFAError(f"Failed to send email. {r!s}")
    else:
        raise ConfigAdminError("Missing configuration " "recovery.identifier.")
    res = True
    return res


@log_with(log)
def check_recoverycode(user, recoverycode):
    """
    Check if the given recovery code is a valid recovery code for this user

    :param user: User, who wants to reset his password.
    :type user: User object
    :param recoverycode: The recovery code
    :type recoverycode: str
    :return: True is code was correct
    """
    recoverycode_valid = False
    # delete old entries
    r = PasswordReset.query.filter(
        and_(PasswordReset.expiration < datetime.now())
    ).delete()
    log.debug(f"{r!s} old password recoverycodes deleted.")
    sql_query = PasswordReset.query.filter(
        and_(PasswordReset.username == user.login, PasswordReset.realm == user.realm)
    )
    for pwr in sql_query:
        if verify_with_pepper(pwr.recoverycode, recoverycode):
            recoverycode_valid = True
            log.debug(f"Found valid recoverycode for user {user!r}")
            # Delete the recovery code, so that it can only be used once!
            r = pwr.delete()
            log.debug(f"{r!s} used password recoverycode deleted.")

    return recoverycode_valid


@log_with(log)
def is_password_reset(g):
    """
    Check if password reset is allowed.

    We need to check, if a user policy with password_reset exists AND if an
    editable resolver exists. Otherwise password_reset does not make any sense.

    :return: True or False
    """
    rlist = get_resolver_list(editable=True)
    log.debug(f"Number of editable resolvers: {len(rlist)!s}")
    pwreset = Match.generic(g, scope=SCOPE.USER, action=ACTION.PASSWORDRESET).allowed(
        write_to_audit_log=False
    )
    log.debug(f"Password reset allowed via policies: {pwreset!s}")
    return bool(rlist and pwreset)

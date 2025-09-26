# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2014 Cornelius Kölbel
#
# Copyright (C) 2010 - 2014 LSE Leading Security Experts GmbH
# License:  AGPLv3
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
"""
contains Errors and Exceptions
"""

import logging

from edumfa.lib import _

log = logging.getLogger(__name__)


class ERROR:
    SUBSCRIPTION = 101
    TOKENADMIN = 301
    CONFIGADMIN = 302
    POLICY = 303
    IMPORTADMIN = 304
    VALIDATE = 401
    REGISTRATION = 402
    AUTHENTICATE = 403
    AUTHENTICATE_WRONG_CREDENTIALS = 4031
    AUTHENTICATE_MISSING_USERNAME = 4032
    AUTHENTICATE_AUTH_HEADER = 4033
    AUTHENTICATE_DECODING_ERROR = 4304
    AUTHENTICATE_TOKEN_EXPIRED = 4305
    AUTHENTICATE_MISSING_RIGHT = 4306
    ENROLLMENT = 404
    CA = 503
    CA_CSR_INVALID = 504
    CA_CSR_PENDING = 505
    RESOURCE_NOT_FOUND = 601
    HSM = 707
    SELFSERVICE = 807
    SERVER = 903
    USER = 904
    PARAMETER = 905


class eduMFAError(Exception):
    def __init__(self, description="eduMFAError!", id=10):
        self.id = id
        self.message = description
        Exception.__init__(self, description)

    def getId(self):
        return self.id

    def getDescription(self):
        return self.message

    def __str__(self):
        pstr = "ERR%d: %r"
        if isinstance(self.message, str):
            pstr = "ERR%d: %s"

        ### if we have here unicode, we might fail with conversion error
        try:
            res = pstr % (self.id, self.message)
        except Exception as exx:
            res = "ERR{0:d}: {1!r}".format(self.id, self.message)
        return res

    def __repr__(self):
        ret = "{0!s}(description={1!r}, id={2:d})".format(
            type(self).__name__, self.message, self.id
        )
        return ret


class SubscriptionError(eduMFAError):
    def __init__(self, description=None, application=None, id=ERROR.SUBSCRIPTION):
        self.id = id
        self.message = description
        self.application = application
        eduMFAError.__init__(self, description, id=self.id)

    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        ret = "{0!s}({1!r}, application={2!s})".format(
            type(self).__name__, self.message, self.application
        )
        return ret


class TokenImportException(eduMFAError):
    def __init__(self, description, id=ERROR.IMPORTADMIN):
        eduMFAError.__init__(self, description=description, id=id)


class AuthError(eduMFAError):
    def __init__(self, description, id=ERROR.AUTHENTICATE, details=None):
        self.details = details
        eduMFAError.__init__(self, description=description, id=id)


class ResourceNotFoundError(eduMFAError):
    def __init__(self, description, id=ERROR.RESOURCE_NOT_FOUND):
        eduMFAError.__init__(self, description=description, id=id)


class PolicyError(eduMFAError):
    def __init__(self, description, id=ERROR.POLICY):
        eduMFAError.__init__(self, description=description, id=id)


class ValidateError(eduMFAError):
    def __init__(self, description="validation error!", id=ERROR.VALIDATE):
        eduMFAError.__init__(self, description=description, id=id)


class RegistrationError(eduMFAError):
    def __init__(self, description="registration error!", id=ERROR.REGISTRATION):
        eduMFAError.__init__(self, description=description, id=id)


class EnrollmentError(eduMFAError):
    def __init__(self, description="enrollment error!", id=ERROR.ENROLLMENT):
        eduMFAError.__init__(self, description=description, id=id)


class TokenAdminError(eduMFAError):
    def __init__(self, description="token admin error!", id=ERROR.TOKENADMIN):
        eduMFAError.__init__(self, description=description, id=id)


class ConfigAdminError(eduMFAError):
    def __init__(self, description="config admin error!", id=ERROR.CONFIGADMIN):
        eduMFAError.__init__(self, description=description, id=id)


class CAError(eduMFAError):
    def __init__(self, description="CA error!", id=ERROR.CA):
        eduMFAError.__init__(self, description=description, id=id)


class CSRError(CAError):
    def __init__(self, description="CSR invalid", id=ERROR.CA_CSR_INVALID):
        eduMFAError.__init__(self, description=description, id=id)


class CSRPending(CAError):
    def __init__(
        self, description="CSR pending", id=ERROR.CA_CSR_PENDING, requestId=None
    ):
        eduMFAError.__init__(self, description=description, id=id)
        self.requestId = requestId


class UserError(eduMFAError):
    def __init__(self, description="user error!", id=ERROR.USER):
        eduMFAError.__init__(self, description=description, id=id)


class ServerError(eduMFAError):
    def __init__(self, description="server error!", id=ERROR.SERVER):
        eduMFAError.__init__(self, description=description, id=id)


class HSMException(eduMFAError):
    def __init__(self, description="hsm error!", id=ERROR.HSM):
        eduMFAError.__init__(self, description=description, id=id)


class SelfserviceException(eduMFAError):
    def __init__(self, description="selfservice error!", id=ERROR.SELFSERVICE):
        eduMFAError.__init__(self, description=description, id=id)


class ParameterError(eduMFAError):
    USER_OR_SERIAL = _("You either need to provide user or serial")

    def __init__(self, description="unspecified parameter error!", id=ERROR.PARAMETER):
        eduMFAError.__init__(self, description=description, id=id)

# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2020 Jean-Pierre Höhmann <jean-pierre.hoehmann@netknights.it>
#
# Copyright (C) 2020 NetKnights GmbH
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

import binascii
import json

import jwt
from cryptography import x509

from flask import g, current_app

from edumfa.api.lib.utils import getParam, attestation_certificate_allowed
from edumfa.lib.challenge import get_challenges
from edumfa.lib.config import get_from_config
from edumfa.lib.crypto import geturandom
from edumfa.lib.decorators import check_token_locked
from edumfa.lib.error import ParameterError, EnrollmentError, PolicyError
from edumfa.lib.token import get_tokens, get_tokens_from_serial_or_user
from edumfa.lib.tokenclass import TokenClass, CLIENTMODE, ROLLOUTSTATE
from edumfa.lib.tokens.webauthn import (COSE_ALGORITHM, USER_VERIFICATION_LEVELS, webauthn_b64_encode, WebAuthnRegistrationResponse,
                                             ATTESTATION_REQUIREMENT_LEVEL, webauthn_b64_decode,
                                             WebAuthnMakeCredentialOptions, WebAuthnAssertionOptions, WebAuthnUser,
                                             WebAuthnAssertionResponse, AuthenticationRejectedException,
                                             USER_VERIFICATION_LEVEL, RESIDENT_KEY_LEVEL, AuthenticatorDataFlags)
from edumfa.lib.tokens.u2ftoken import IMAGES
from edumfa.lib.log import log_with
import logging
from edumfa.lib import _
from edumfa.lib.policy import SCOPE, GROUP, ACTION, Match
from edumfa.lib.utils import hexlify_and_unicode, is_true, to_unicode, convert_imagefile_to_dataimage
from flask import current_app
import datetime
from dateutil.tz import tzlocal

__doc__ = """
WebAuthn  is the Web Authentication API specified by the FIDO Alliance.
The register and authentication process is described here:

https://w3c.github.io/webauthn/#sctn-rp-operations

But you do not need to be aware of this. eduMFA wraps all FIDO specific
communication, which should make it easier for you, to integrate the U2F
tokens managed by eduMFA into your application.

WebAuthn tokens can be either

 * registered by administrators for users or
 * registered by the users themselves.

Be aware that WebAuthn tokens can only be used if the eduMFA server and
the applicaedumfations and services the user needs to access all reside under the
same domain or subdomains thereof.

This means a WebAuthn token registered by mfa.mycompany.com can be
used to sign in to sites like mycompany.com and vpn.mycompany.com, but not
(for example) mycompany.someservice.com.

Enrollment
----------
The enrollment/registering can be completely performed within eduMFA.

But if you want to enroll the WebAuthn token via the REST API you need to do
it in two steps:

**Step 1**

.. sourcecode:: http

    POST /token/init HTTP/1.1
    Host: <eduMFA server>
    Accept: application/json

    type=webauthn
    user=<username>

The request returns:

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "detail": {
            "serial": "<serial number>",
            "webAuthnRegisterRequest": {
                "attestation": "direct",
                "authenticatorSelection": {
                    "userVerification": "preferred"
                },
                "displayName": "<user.resolver@realm>",
                "message": "Please confirm with your WebAuthn token",
                "name": "<username>",
                "nonce": "<nonce>",
                "pubKeyCredAlgorithms": [
                    {
                        "alg": -7,
                        "type": "public-key"
                    },
                    {
                        "alg": -37,
                        "type": "public-key"
                    }
                ],
                "relyingParty": {
                    "id": "<relying party ID>",
                    "name": "<relying party name>"
                },
                "serialNumber": "<serial number>",
                "timeout": 60000,
                "transaction_id": "<transaction ID>"
            }
        },
        "result": {
            "status": true,
            "value": true
        },
        "version": "<eduMFA version>"
    }

This step returns a *webAuthnRegisterRequest* which contains a nonce, a relying party (containing a
name and an ID generated from your domain), a serial number along with a transaction ID
and a message to display to the user. It will also contain some additional options
regarding timeout, which authenticators are acceptable, and what key types are
acceptable to the server.

With the received data You need to call the javascript function

.. sourcecode:: javascript

    navigator
        .credentials
        .create({
            challenge: <nonce>,
            rp: <relyingParty>,
            user: {
                id: Uint8Array.from(<serialNumber>, c => c.charCodeAt(0)),
                name: <name>,
                displayName: <displayName>
            },
            pubKeyCredParams: <pubKeyCredAlgorithms>,
            authenticatorSelection: <authenticatorSelection>,
            timeout: <timeout>,
            attestation: <attestation>,
            extensions: {
                authnSel: <authenticatorSelectionList>
            }
        })
        .then(function(credential) { <responseHandler> })
        .catch(function(error) { <errorHandler> });

Here *nonce*, *relyingParty*, *serialNumber*, *pubKeyCredAlgorithms*,
*authenticatorSelection*, *timeout*, *attestation*,
*authenticatorSelectionList*, *name*, and *displayName* are the values
provided by the server in the *webAuthnRegisterRequest* field in the response
from the first step. *authenticatorSelection*,
*timeout*, *attestation*, and *authenticatorSelectionList* are optional. If
*attestation* is not provided, the client should default to `direct`
attestation. If *timeout* is not provided, it may be omitted, or a sensible
default chosen. Any other optional values must be omitted, if the server has
not sent them. Please note that the nonce will be a binary, encoded using the
web-safe base64 algorithm specified by WebAuthn, and needs to be decoded and
passed as Uint8Array.

If an *authenticationSelectionList* was given, the *responseHandler* needs to
verify, that the field *authnSel* of *credential.getExtensionResults()*
contains true. If this is not the case, the *responseHandler* should abort and
call the *errorHandler*, displaying an error telling the user to use his
company-provided token.

The *responseHandler* needs to then send the *clientDataJSON*,
*attestationObject*, and *registrationClientExtensions* contained in the
*response* field of the *credential* back to the server. If
enrollment succeeds, the server will send a response with a
*webAuthnRegisterResponse* field, containing a *subject* field with the
description of the newly created token.


**Step 2**

.. sourcecode:: http

    POST /token/init HTTP/1.1
    Host: <eduMFA server>
    Accept: application/json

    type=webauthn
    transaction_id=<transaction_id>
    description=<description>
    clientdata=<clientDataJSON>
    regdata=<attestationObject>
    registrationclientextensions=<registrationClientExtensions>

The values *clientDataJSON* and *attestationObject* are returned by the
WebAuthn authenticator. *description* is an optional description string for
the new token.

The server expects the *clientDataJSON* and *attestationObject* encoded as
web-safe base64 as defined by the WebAuthn standard. This encoding is similar
to standard base64, but '-' and '_' should be used in the alphabet instead of
'+' and '/', respectively, and any padding should be omitted.

The *registrationClientExtensions* are optional and should simply be omitted,
if the client does not provide them. If the *registrationClientExtensions* are
available, they must be encoded as a utf-8 JSON string, then sent to the server
as web-safe base64.

Please beware that the btoa() function provided by
ECMA-Script expects a 16-bit encoded string where all characters are in the
range 0x0000 to 0x00FF. The *attestationObject* contains CBOR-encoded binary
data, returned as an ArrayBuffer.

The problem and ways to solve it are described in detail in this MDN-Article:

https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem

Authentication
--------------

The WebAuthn token is a challenge response token. I.e. you need to trigger a
challenge, either by sending the OTP PIN/Password for this token to the
/validate/check endpoint, or by calling the /validate/triggerchallenge
endpoint using a service account with sufficient permissions.

Get the challenge (using /validate/check)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The /validate/check endpoint can be used to trigger a challenge using the PIN
for the token (without requiring any special permissions).

**Request:**

.. sourcecode:: http

    POST /validate/check HTTP/1.1
    Host: <eduMFA server>
    Accept: application/json

    user=<username>
    pass=<password>

**Response:**

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "detail": {
            "attributes": {
                "hideResponseInput": true,
                "img": "<image URL>",
                "webAuthnSignRequest": {
                    "allowCredentials": [
                        {
                            "id": "<credential ID>",
                            "transports": [
                                "<allowed transports>"
                            ],
                            "type": "<credential type>"
                        }
                    ],
                    "challenge": "<nonce>",
                    "rpId": "<relying party ID>",
                    "timeout": 60000,
                    "userVerification": "<user verification requirement>"
                }
            },
            "client_mode": "webauthn",
            "message": "Please confirm with your WebAuthn token",
            "serial": "<token serial>",
            "transaction_id": "<transaction ID>",
            "type": "webauthn"
        },
        "id": 1,
        "jsonrpc": "2.0",
        "result": {
            "authentication": "CHALLENGE",
            "status": true,
            "value": false
        },
        "version": "<eduMFA version>"
    }


Get the challenge (using /validate/triggerchallenge)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The /validate/triggerchallenge endpoint can be used to trigger a challenge
using a service account (without requiring the PIN for the token).

**Request**

.. sourcecode:: http

    POST /validate/triggerchallenge HTTP/1.1
    Host: <eduMFA server>
    Accept: application/json
    Authorization: <authToken>

    user=<username>
    serial=<tokenSerial>

Providing the *tokenSerial* is optional. If just a user is provided, a
challenge will be triggered for every challenge response token the user has.

**Response**

.. sourcecode:: http

    HTTP/1.1 200 OK
    Content-Type: application/json

    {
        "detail": {
            "attributes": {
                "hideResponseInput": true,
                "img": "<image URL>",
                "webAuthnSignRequest": {
                    "challenge": "<nonce>",
                    "allowCredentials": [{
                        "id": "<credential ID>",
                        "transports": [
                            "<allowed transports>"
                        ],
                        "type": "<credential type>",
                    }],
                    "rpId": "<relying party ID>",
                    "userVerification": "<user verification requirement>",
                    "timeout": 60000
                }
            },
            "message": "Please confirm with your WebAuthn token",
            "messages": ["Please confirm with your WebAuthn token"],
            "multi_challenge": [{
                "attributes": {
                    "hideResponseInput": true,
                    "img": "<image URL>",
                    "webAuthnSignRequest": {
                        "challenge": "<nonce>",
                        "allowCredentials": [{
                            "id": "<credential ID>",
                            "transports": [
                                "<allowedTransports>"
                            ],
                            "type": "<credential type>",
                        }],
                        "rpId": "<relying party ID>",
                        "userVerification": "<user verification requirement>",
                        "timeout": 60000
                    }
                },
                "message": "Please confirm with your WebAuthn token",
                "serial": "<token serial>",
                "transaction_id": "<transaction ID>",
                "type": "webauthn"
            }],
            "serial": "<token serial>",
            "transaction_id": "<transaction ID>",
            "transaction_ids": ["<transaction IDs>"],
            "type": "webauthn"
        },
        "id": 1,
        "jsonrpc": "2.0",
        "result": {
            "status": true,
            "value": 1
        },
        "version": "<eduMFA version>"
    }

Send the Response
~~~~~~~~~~~~~~~~~

The application now needs to call the javascript function
*navigator.credentials.get* with the *publicKeyCredentialRequestOptions* built
using the *nonce*, *credentialId*, *allowedTransports*, *userVerificationRequirement*
and *timeout* from the server.  The timeout is optional and may be omitted, if
not provided, the client may also pick a sensible default. Please note that the
nonce will be a binary, encoded using the web-safe base64 algorithm specified by
WebAuthn, and needs to be decoded and passed as Uint8Array.

.. sourcecode:: javascript

    const publicKeyCredentialRequestOptions = {
        challenge: <nonce>,
        allowCredentials: [{
            id: Uint8Array.from(<credentialId>, c=> c.charCodeAt(0)),
            type: <credentialType>,
            transports: <allowedTransports>
        }],
        userVerification: <userVerificationRequirement>,
        rpId: <relyingPartyId>,
        timeout: <timeout>
    }
    navigator
        .credentials
        .get({publicKey: publicKeyCredentialRequestOptions})
        .then(function(assertion) { <responseHandler> })
        .catch(function(error) { <errorHandler> });

The *responseHandler* needs to call the */validate/check* API providing the
*serial* of the token the user is signing in with, and the *transaction_id*,
for the current challenge, along with the *id*, returned by the WebAuthn
device in the *assertion* and the *authenticatorData*, *clientDataJSON* and
*signature*, *userHandle*, and *assertionClientExtensions* contained in the
*response* field of the *assertion*.

*clientDataJSON*, *authenticatorData* and *signature* should be encoded as
web-safe base64 without padding. For more detailed instructions, refer to
“2. Step” under “Enrollment” above. 

The *userHandle* and *assertionClientExtensions* are optional and should be
omitted, if not provided by the authenticator. The
*assertionClientExtensions* – if available – must be encoded as a utf-8 JSON
string, and transmitted to the server as web-safe base64. The *userHandle*
is simply passed as a string, note – however – that it may be necessary to
re-encode this to utf-16, since the authenticator will return utf-8, while the
library making the http request will likely require all parameters in the
native encoding of the language (usually utf-16).

.. sourcecode:: http

    POST /validate/check HTTP/1.1
    Host: example.com
    Accept: application/json

    user=<user>
    pass=
    transaction_id=<transaction_id>
    credentialid=<id>
    clientdata=<clientDataJSON>
    signaturedata=<signature>
    authenticatordata=<authenticatorData>
    userhandle=<userHandle>
    assertionclientextensions=<assertionClientExtensions>

"""

from edumfa.models import Challenge

IMAGES = IMAGES

DEFAULT_DESCRIPTION = _('Generic WebAuthn Token')

# Policy defaults
DEFAULT_ALLOWED_TRANSPORTS = "usb ble nfc internal hybrid"
DEFAULT_TIMEOUT = 60
DEFAULT_USER_VERIFICATION_REQUIREMENT = 'preferred'
DEFAULT_AUTHENTICATOR_ATTACHMENT = 'either'
DEFAULT_PUBLIC_KEY_CREDENTIAL_ALGORITHM_PREFERENCE = ['ecdsa', 'rsassa-pss']
DEFAULT_AUTHENTICATOR_ATTESTATION_LEVEL = 'untrusted'
DEFAULT_AUTHENTICATOR_ATTESTATION_FORM = 'direct'
DEFAULT_RESIDENT_KEY_LEVEL = 'preferred'
DEFAULT_USERNAMELESS_AUTHN = False
DEFAULT_USERNAMELESS_REALM_POLICY = False
DEFAULT_CHALLENGE_TEXT_AUTH = _('Please confirm with your WebAuthn token ({0!s})')
DEFAULT_CHALLENGE_TEXT_ENROLL = _('Please confirm with your WebAuthn token')

PUBLIC_KEY_CREDENTIAL_ALGORITHMS = {
    'ecdsa': COSE_ALGORITHM.ES256,
    'rsassa-pss': COSE_ALGORITHM.PS256,
    'rsassa-pkcs1v1_5': COSE_ALGORITHM.RS256
}
# since in Python < 3.7 the insert order of a dictionary is not guaranteed, we
# need a list to define the proper order
PUBKEY_CRED_ALGORITHMS_ORDER = ['ecdsa', 'rsassa-pss', 'rsassa-pkcs1v1_5']

log = logging.getLogger(__name__)
optional = True
required = False


class WEBAUTHNCONFIG:
    """
    Config options defined for WebAuthn
    """

    TRUST_ANCHOR_DIR = 'webauthn.trust_anchor_dir'
    APP_ID = 'webauthn.appid'
    CHALLENGE_VALIDITY_TIME = 'WebauthnChallengeValidityTime'


WEBAUTHN_TOKEN_SPECIFIC_SETTINGS = {
    WEBAUTHNCONFIG.TRUST_ANCHOR_DIR: 'public',
    WEBAUTHNCONFIG.APP_ID: 'public'
}


class WEBAUTHNACTION:
    """
    Policy actions defined for WebAuthn
    """

    ALLOWED_TRANSPORTS = 'webauthn_allowed_transports'
    TIMEOUT = 'webauthn_timeout'
    RELYING_PARTY_NAME = 'webauthn_relying_party_name'
    RELYING_PARTY_ID = 'webauthn_relying_party_id'
    AUTHENTICATOR_ATTACHMENT = 'webauthn_authenticator_attachment'
    AUTHENTICATOR_SELECTION_LIST = 'webauthn_authenticator_selection_list'
    USER_VERIFICATION_REQUIREMENT = 'webauthn_user_verification_requirement'
    PUBLIC_KEY_CREDENTIAL_ALGORITHMS = 'webauthn_public_key_credential_algorithms'
    AUTHENTICATOR_ATTESTATION_FORM = 'webauthn_authenticator_attestation_form'
    AUTHENTICATOR_ATTESTATION_LEVEL = 'webauthn_authenticator_attestation_level'
    AUTHENTICATOR_RESIDENT_KEY = 'webauthn_resident_key'
    USERNAMELESS_AUTHN = 'webauthn_usernameless_authn'
    USERNAMELESS_REALM_POLICY = 'webauthn_usernameless_realm_policy'
    TOKENLABEL = 'webauthn_tokenlabel'
    REQ = 'webauthn_req'
    AVOID_DOUBLE_REGISTRATION = 'webauthn_avoid_double_registration'


class WEBAUTHNINFO:
    """
    Token info fields used by WebAuthn
    """

    PUB_KEY = "pubKey"
    ORIGIN = "origin"
    AAGUID = "aaguid"
    ATTESTATION_LEVEL = "attestation_level"
    ATTESTATION_ISSUER = "attestation_issuer"
    ATTESTATION_SERIAL = "attestation_serial"
    ATTESTATION_SUBJECT = "attestation_subject"
    RELYING_PARTY_ID = "relying_party_id"
    RELYING_PARTY_NAME = "relying_party_name"
    RESIDENT_KEY = "resident_key"
    BACKUP_ELIGIBLE = "backup-eligible"
    BACKUP_STATE = "backed-up"


class WEBAUTHNGROUP:
    """
    Categories used to group WebAuthn token actions.
    """

    WEBAUTHN = "WebAuthn"


class WebAuthnTokenClass(TokenClass):
    """
    The WebAuthn Token implementation.
    """

    client_mode = CLIENTMODE.WEBAUTHN

    @staticmethod
    def _get_challenge_validity_time():
        return int(get_from_config(WEBAUTHNCONFIG.CHALLENGE_VALIDITY_TIME,
                                   get_from_config('DefaultChallengeValidityTime', 120)))

    @staticmethod
    def _get_nonce():
        return geturandom(32)

    @staticmethod
    def get_class_type():
        """
        Returns the internal token type identifier

        :return: webauthn
        :rtype: basestring
        """
        return "webauthn"

    @staticmethod
    def get_class_prefix():
        """
        Return the prefix, that is used as a prefix for the serial numbers.

        :return: WAN
        :rtype: basestring
        """
        return "WAN"

    @staticmethod
    @log_with(log)
    def get_class_info(key=None, ret='all'):
        """
        returns a subtree of the token definition

        :param key: subsection identifier
        :type key: string
        :param ret: default return value, if nothing is found
        :type ret: user defined
        :return: subsection if key exists or user defined
        :rtype: dict or scalar
        """
        res = {
            'type': 'webauthn',
            'title': 'WebAuthn Token',
            'description': _('WebAuthn: Enroll a Web Authentication token.'),
            'init': {},
            'config': {},
            'user': ['enroll'],
            # This tokentype is enrollable in the UI for...
            'ui_enroll': ["admin", "user"],
            'policy': {
                SCOPE.AUTH: {
                    ACTION.CHALLENGETEXT: {
                        'type': 'str',
                        'desc': _("Use an alternative challenge text for telling the user to confirm with his WebAuthn "
                                  "token."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.ALLOWED_TRANSPORTS: {
                        'type': 'str',
                        'desc': _("A list of transports to prefer to communicate with WebAuthn tokens. "
                                  "Default: usb ble nfc internal hybrid (All standard transports)"),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.TIMEOUT: {
                        'type': 'int',
                        'desc': _("The time in seconds the user has to confirm authorization on his WebAuthn token. "
                                  "Note: You will want to increase the ChallengeValidityTime along with this. "
                                  "Default: 60"),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT: {
                        'type': 'str',
                        'desc': _("Whether the user's identity should be verified when authenticating with a WebAuthn "
                                  "token. Default: preferred (verify the user if supported by the token)"),
                        'value': [
                            'required',
                            'preferred',
                            'discouraged'
                        ],
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.USERNAMELESS_AUTHN: {
                        'type': 'bool',
                        'desc': _("Whether usernameless authentication via the Passkeys Autofill UI, also known as "
                                  "Conditional Mediation, should be enabled. "
                                  "Note: This function is only available if passkeys (resident keys) are enrolled and "
                                  "if the browser supports Conditional Mediation. "
                                  "Other WebAuthn authentication policies will be ignored if this option is enabled. "),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.USERNAMELESS_REALM_POLICY: {
                        'type': 'bool',
                        'desc': _("Whether to enforce the WebAuthn authentication policies for the relying party ID "
                                  "and the user verification requirement realm-wide, i.e., for all users in a realm? "
                                  "Note: This requires usernameless authentication to be enabled. Also, the option "
                                  "has to be set in the fudiscr plugin so the realm is sent to the API endpoints via a "
                                  "query parameter, e.g., /validate/triggerchallenge?type=webauthn&realm=userless"),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    }
                },
                SCOPE.AUTHZ: {
                    WEBAUTHNACTION.AUTHENTICATOR_SELECTION_LIST: {
                        'type': 'str',
                        'desc': _("A list of WebAuthn authenticators acceptable for authorization, given as "
                                  "a space-separated list of AAGUIDs. Per default all authenticators are acceptable."),
                        'group': GROUP.CONDITIONS,
                    },
                    WEBAUTHNACTION.REQ: {
                        'type': 'str',
                        'desc': _("Only the specified WebAuthn-tokens are authorized."),
                        'group': GROUP.CONDITIONS,
                    }
                },
                SCOPE.ENROLL: {
                    WEBAUTHNACTION.AVOID_DOUBLE_REGISTRATION: {
                        'type': 'bool',
                        'desc': _("One webauthn token can not be registered to a user more than once."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.RELYING_PARTY_NAME: {
                        'type': 'str',
                        'desc': _("A human-readable name for the organization rolling out WebAuthn tokens."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.RELYING_PARTY_ID: {
                        'type': 'str',
                        'desc': _("A domain name that is a subset of the respective FQDNs for all the webservices the "
                                  "users should be able to sign in to using WebAuthn tokens."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.TIMEOUT: {
                        'type': 'int',
                        'desc': _("The time in seconds the user has to confirm enrollment on his WebAuthn token. "
                                  "Note: You will want to increase the ChallengeValidityTime along with this. "
                                  "Default: 60"),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.AUTHENTICATOR_ATTACHMENT: {
                        'type': 'str',
                        'desc': _("Whether to limit roll out of WebAuthn tokens to either only platform "
                                  "authenticators, or only cross-platform authenticators. Default: either"),
                        'group': WEBAUTHNGROUP.WEBAUTHN,
                        'value': [
                            "platform",
                            "cross-platform",
                            "either"
                        ]
                    },
                    WEBAUTHNACTION.AUTHENTICATOR_SELECTION_LIST: {
                        'type': 'str',
                        'desc': _("A list of WebAuthn authenticators acceptable for enrollment, given as a "
                                  "space-separated list of AAGUIDs. Per default all authenticators are acceptable."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT: {
                        'type': 'str',
                        'desc': _("Whether the user's identity should be verified when rolling out a new WebAuthn "
                                  "token. Default: preferred (verify the user if supported by the token)"),
                        'group': WEBAUTHNGROUP.WEBAUTHN,
                        'value': [
                            "required",
                            "preferred",
                            "discouraged"
                        ]
                    },
                    WEBAUTHNACTION.PUBLIC_KEY_CREDENTIAL_ALGORITHMS: {
                        'type': 'str',
                        'desc': _("Which algorithm are available to use for creating public key "
                                  "credentials for WebAuthn tokens. (Default: [{0!s}], Order: "
                                  "[{1!s}])".format(', '.join(DEFAULT_PUBLIC_KEY_CREDENTIAL_ALGORITHM_PREFERENCE),
                                                    ', '.join(PUBKEY_CRED_ALGORITHMS_ORDER))),
                        'group': WEBAUTHNGROUP.WEBAUTHN,
                        'multiple': True,
                        'value': list(PUBLIC_KEY_CREDENTIAL_ALGORITHMS.keys())
                    },
                    WEBAUTHNACTION.AUTHENTICATOR_ATTESTATION_FORM: {
                        'type': 'str',
                        'desc': _("Whether to request attestation data when enrolling a new WebAuthn token. "
                                  "Note: for u2f_req to work with WebAuthn, this cannot be set to none. "
                                  "Default: direct (ask for non-anonymized attestation data)"),
                        'group': WEBAUTHNGROUP.WEBAUTHN,
                        'value': [
                            "none",
                            "indirect",
                            "direct"
                        ]
                    },
                    WEBAUTHNACTION.AUTHENTICATOR_ATTESTATION_LEVEL: {
                        'type': 'str',
                        'desc': _("Whether and how strictly to check authenticator attestation data. "
                                  "Note: If the attestation form is none, the attestation level needs to also be none. "
                                  "Default: untrusted (attestation is required, but can be unknown or self-signed)"),
                        'group': WEBAUTHNGROUP.WEBAUTHN,
                        'value': [
                            "none",
                            "untrusted",
                            "trusted"
                        ]
                    },
                    WEBAUTHNACTION.REQ: {
                        'type': 'str',
                        'desc': _("Only the specified WebAuthn-tokens are allowed to be registered."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.AUTHENTICATOR_RESIDENT_KEY: {
                        'type': 'str',
                        'desc': _("Whether to request a resident key. Note: Passkeys are always resident keys."),
                        'group': WEBAUTHNGROUP.WEBAUTHN,
                        'value': [
                            "discouraged",
                            "required",
                            "preferred"
                        ]
                    },
                    ACTION.MAXTOKENUSER: {
                        'type': 'int',
                        'desc': _("The user may only have this number of WebAuthn tokens assigned."),
                        'group': GROUP.TOKEN
                    },
                    ACTION.MAXACTIVETOKENUSER: {
                        'type': 'int',
                        'desc': _('The user may only have this number of active WebAuthn tokens assigned.'),
                        'group': GROUP.TOKEN
                    },
                    ACTION.CHALLENGETEXT: {
                        'type': 'str',
                        'desc': _("Use an alternate challenge text for telling the "
                                  "user to confirm with his WebAuthn device."),
                        'group': WEBAUTHNGROUP.WEBAUTHN
                    },
                    WEBAUTHNACTION.TOKENLABEL: {
                        'type': 'str',
                        'desc': _("The label for a new enrolled Passkey token. "
                                "Possible tags are <code>{user}</code>, <code>{realm}</code>, "
                                "<code>{serial}</code>, <code>{givenname}</code> and <code>{surname}</code>."),
                        'group': WEBAUTHNGROUP.WEBAUTHN},
                }
            }
        }

        if key:
            ret = res.get(key, {})
        else:
            if ret == 'all':
                ret = res
        return ret

    @staticmethod
    def get_setting_type(key):
        """
        Fetch the type of a setting specific to WebAuthn tokens.

        The WebAuthn token defines several public settings. When these are
        written to the database, the type of the setting is automatically
        stored along with the setting by set_edumfa_config().

        The key name needs to be in WEBAUTHN_TOKEN_SPECIFIC_SETTINGS.keys()
        and match /^webauthn\\./. If the specified setting does not exist,
        a ValueError will be thrown.

        :param key: The token specific setting key
        :type key: basestring
        :return: The setting type
        :rtype: "public"
        """

        if key not in WEBAUTHN_TOKEN_SPECIFIC_SETTINGS.keys():
            raise ValueError('key must be one of {0!s}'.format(', '.join(WEBAUTHN_TOKEN_SPECIFIC_SETTINGS.keys())))
        return WEBAUTHN_TOKEN_SPECIFIC_SETTINGS[key]

    @log_with(log)
    def __init__(self, db_token):
        """
        Create a new WebAuthn Token object from a database object

        :param db_token:  instance of the orm db object
        :type db_token: DB object
        """
        TokenClass.__init__(self, db_token)
        self.set_type(self.get_class_type())
        self.hKeyRequired = False

    def _get_message(self, options):
        challengetext = getParam(options, "{0!s}_{1!s}".format(self.get_class_type(), ACTION.CHALLENGETEXT), optional)
        return challengetext.format(self.token.description) if challengetext else ''

    def _get_webauthn_user(self, user):
        return WebAuthnUser(
            user_id=self.token.serial,
            user_name=user.login,
            user_display_name=str(user),
            icon_url=IMAGES.get(self.token.description.lower().split()[0], "") if self.token.description else "",
            credential_id=self.decrypt_otpkey(),
            public_key=webauthn_b64_encode(binascii.unhexlify(self.get_tokeninfo(WEBAUTHNINFO.PUB_KEY))),
            sign_count=self.get_otp_count(),
            rp_id=self.get_tokeninfo(WEBAUTHNINFO.RELYING_PARTY_ID)
        )

    def decrypt_otpkey(self):
        """
        This method fetches a decrypted version of the otp_key.

        This method becomes necessary, since the way WebAuthn is implemented
        in eduMFA, the otpkey of a WebAuthn token is the credential_id,
        which may encode important information and needs to be sent to the
        client to allow the client to create an assertion for the
        authentication process.

        :return: The otpkey decrypted and encoded as WebAuthn base64.
        :rtype: basestring
        """

        return webauthn_b64_encode(binascii.unhexlify(self.token.get_otpkey().getKey()))

    def update(self, param, reset_failcount=True):
        """
        This method is called during the initialization process.

        :param param: Parameters from the token init.
        :type param: dict
        :param reset_failcount: Whether to reset the fail count.
        :type reset_failcount: bool
        :return: Nothing
        :rtype: None
        """

        TokenClass.update(self, param)

        transaction_id = getParam(param, "transaction_id", optional)
        reg_data = getParam(param, "regdata", optional)
        client_data = getParam(param, "clientdata", optional)
        automatic_description = DEFAULT_DESCRIPTION

        if not (reg_data and client_data):
            self.token.rollout_state = ROLLOUTSTATE.CLIENTWAIT
            # Set the description in the first enrollment step
            if "description" in param:
                self.set_description(getParam(param, "description", default=""))
        elif reg_data and client_data and self.token.rollout_state == ROLLOUTSTATE.CLIENTWAIT:
            serial = self.token.serial
            registration_client_extensions = getParam(param, "registrationclientextensions", optional)

            rp_id = getParam(param, WEBAUTHNACTION.RELYING_PARTY_ID, required)
            uv_req = getParam(param, WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT, optional)
            rk_req = getParam(param, WEBAUTHNACTION.AUTHENTICATOR_RESIDENT_KEY, optional)
            attestation_level = getParam(param, WEBAUTHNACTION.AUTHENTICATOR_ATTESTATION_LEVEL, required)

            try:
                http_origin = getParam(param, "HTTP_ORIGIN", required, allow_empty=False)
            except ParameterError:
                raise ValueError("The ORIGIN HTTP header must be included, when enrolling a new WebAuthn token.")

            challengeobject_list = [
                challengeobject
                for challengeobject in get_challenges(serial=serial,
                                                      transaction_id=transaction_id)
                if challengeobject.is_valid()
            ]

            # Since we are still enrolling the token, there should be exactly one challenge.
            if not len(challengeobject_list):
                raise EnrollmentError(
                    "The enrollment challenge does not exist or has timed out for {0!s}".format(serial))
            challengeobject = challengeobject_list[0]
            challenge = binascii.unhexlify(challengeobject.challenge)

            # This does the heavy lifting.
            #
            # All data is parsed and verified. If any errors occur an exception
            # will be raised.
            try:
                webauthn_credential = WebAuthnRegistrationResponse(
                    rp_id=rp_id,
                    origin=http_origin,
                    registration_response={
                        'clientData': client_data,
                        'attObj': reg_data,
                        'registrationClientExtensions':
                            webauthn_b64_decode(registration_client_extensions)
                            if registration_client_extensions
                            else None
                    },
                    challenge=webauthn_b64_encode(challenge),
                    attestation_requirement_level=ATTESTATION_REQUIREMENT_LEVEL[attestation_level],
                    trust_anchor_dir=get_from_config(WEBAUTHNCONFIG.TRUST_ANCHOR_DIR),
                    rk_required=rk_req == RESIDENT_KEY_LEVEL.REQUIRED,
                    uv_required=uv_req == USER_VERIFICATION_LEVEL.REQUIRED
                ).verify([
                    # TODO: this might get slow when a lot of webauthn tokens are registered
                    token.decrypt_otpkey() for token in get_tokens(tokentype=self.type) if token.get_serial() != self.get_serial()
                ])
            except Exception as e:
                log.warning('Enrollment of {0!s} token failed: '
                            '{1!s}!'.format(self.get_class_type(), e))
                raise EnrollmentError("Could not enroll {0!s} token!".format(self.get_class_type()))

            self.set_otpkey(hexlify_and_unicode(webauthn_b64_decode(webauthn_credential.credential_id)))
            self.set_otp_count(webauthn_credential.sign_count)
            self.add_tokeninfo(WEBAUTHNINFO.PUB_KEY,
                               hexlify_and_unicode(webauthn_b64_decode(webauthn_credential.public_key)))
            self.add_tokeninfo(WEBAUTHNINFO.ORIGIN,
                               webauthn_credential.origin)
            self.add_tokeninfo(WEBAUTHNINFO.ATTESTATION_LEVEL,
                               webauthn_credential.attestation_level)

            self.add_tokeninfo(WEBAUTHNINFO.AAGUID,
                               hexlify_and_unicode(webauthn_credential.aaguid))

            # Add attestation info.
            if webauthn_credential.attestation_cert:
                # attestation_cert is of type cryptography.x509.Certificate.
                self.add_tokeninfo(WEBAUTHNINFO.ATTESTATION_ISSUER,
                                   webauthn_credential.attestation_cert.issuer.rfc4514_string())
                self.add_tokeninfo(WEBAUTHNINFO.ATTESTATION_SUBJECT,
                                   webauthn_credential.attestation_cert.subject.rfc4514_string())
                self.add_tokeninfo(WEBAUTHNINFO.ATTESTATION_SERIAL,
                                   webauthn_credential.attestation_cert.serial_number)

                cn = webauthn_credential.attestation_cert.subject.get_attributes_for_oid(x509.NameOID.COMMON_NAME)
                automatic_description = cn[0].value if len(cn) else None
            log.debug(f"Got client extensions from registration: {registration_client_extensions!s}")
            if registration_client_extensions:
                try:
                    extensions = json.loads(webauthn_b64_decode(registration_client_extensions))
                    # Add info to token about whether a resident key/ discoverable credential was enrolled
                    if 'credProps' in extensions:
                        credProps = extensions['credProps']
                        resident_key = 'rk' in credProps and (credProps['rk'] or credProps['rk'] == 'true')
                        if resident_key:
                            self.add_tokeninfo(WEBAUTHNINFO.RESIDENT_KEY, "yes")
                            automatic_description = "Passkey (WebAuthn Discoverable Credential)"
                        else:
                            self.add_tokeninfo(WEBAUTHNINFO.RESIDENT_KEY, "not enough info")
                except Exception as e:
                    log.warning('Could not parse registrationClientExtensions: {0!s}'.format(e))

            # Some authenticators do not set the resident key extension.
            # However, backup-eligible keys are always passkeys, i.e., resident keys.
            att_obj = WebAuthnRegistrationResponse.parse_attestation_object(reg_data)
            authenticator_data = att_obj.get('authData')
            if authenticator_data:
                if AuthenticatorDataFlags(authenticator_data).backup_eligible:
                    self.add_tokeninfo(WEBAUTHNINFO.RESIDENT_KEY, "yes")
                    self.add_tokeninfo(WEBAUTHNINFO.BACKUP_ELIGIBLE, "yes")
                    automatic_description = "Syncable Passkey (WebAuthn Multi-Device Credential)"
                else:
                    self.add_tokeninfo(WEBAUTHNINFO.BACKUP_ELIGIBLE, "no")
                if AuthenticatorDataFlags(authenticator_data).backed_up:
                    self.add_tokeninfo(WEBAUTHNINFO.BACKUP_STATE, "yes")
                    automatic_description = "Synced Passkey (WebAuthn Multi-Device Credential)"
                else:
                    self.add_tokeninfo(WEBAUTHNINFO.BACKUP_STATE, "no")

            # If no description has already been set, set the automatic description or the
            # description given in the 2nd request
            if not self.token.description:
                self.set_description(getParam(param, "description", default=automatic_description))

            # Delete all challenges. We are still in enrollment, so there
            # *should* be only one, but it can't hurt to be thorough here.
            for challengeobject in challengeobject_list:
                challengeobject.delete()
            self.challenge_janitor()
            # Reset clientwait rollout_state
            self.token.rollout_state = ""
        else:
            raise ParameterError("regdata and or clientdata provided but token not in clientwait rollout_state.")

    @log_with(log)
    def get_init_detail(self, params=None, user=None):
        """
        At the end of the initialization we ask the user to confirm the enrollment with his token.

        This will prepare all the information the client needs to build the
        publicKeyCredentialCreationOptions to call
        navigator.credentials.create() with. It will then be called again,
        once the token is created and provide confirmation of the successful
        enrollment to the client.

        :param params: A dictionary with parameters from the request.
        :type params: dict
        :param user: The user enrolling the token.
        :type user: User
        :return: The response detail returned to the client.
        :rtype: dict
        """
        # get_init_details runs after "update" method. So in the first step clientwait has already been set
        if self.token.rollout_state == ROLLOUTSTATE.CLIENTWAIT:
            response_detail = TokenClass.get_init_detail(self, params, user)

            if not params:
                raise ValueError("Creating a WebAuthn token requires params to be provided")
            if not user:
                raise ParameterError("Failed to create a WebAuthn token."
                                     "Creating a WebAuthn token requires user to be provided")

            # To aid with unit testing a fixed nonce may be passed in.
            nonce = self._get_nonce()

            # Create the challenge in the database
            challenge = Challenge(serial=self.token.serial,
                                  transaction_id=getParam(params, 'transaction_id', optional),
                                  challenge=hexlify_and_unicode(nonce),
                                  data=None,
                                  session=getParam(params, 'session', optional),
                                  validitytime=self._get_challenge_validity_time())
            challenge.save()

            credential_ids = []
            if is_true(getParam(params, WEBAUTHNACTION.AVOID_DOUBLE_REGISTRATION, optional)):
                # Get the other webauthn tokens of the user
                webauthn_toks = get_tokens(tokentype=self.type, user=self.user)
                # add their credential ids
                for tok in webauthn_toks:
                    if tok.token.rollout_state != ROLLOUTSTATE.CLIENTWAIT:
                        credential_id = tok.decrypt_otpkey()
                        credential_ids.append(credential_id)
            
            tokenlabel = params.get(WEBAUTHNACTION.TOKENLABEL, "{givenname} {surname} ({user})")
            label = tokenlabel.replace("<s>", self.token.serial).replace("<u>", self.user.login).replace("<r>", self.user.realm)
            label = label.format(serial=self.token.serial, user=self.user.login, realm=self.user.realm,
                                 givenname=self.user.info.get("givenname", ""),
                                 surname=self.user.info.get("surname", ""))

            public_key_credential_creation_options = WebAuthnMakeCredentialOptions(
                challenge=webauthn_b64_encode(nonce),
                rp_name=getParam(params,
                                 WEBAUTHNACTION.RELYING_PARTY_NAME,
                                 required),
                rp_id=getParam(params,
                               WEBAUTHNACTION.RELYING_PARTY_ID,
                               required),
                user_id=self.token.serial,
                user_name=user.login,
                user_display_name=label,
                timeout=getParam(params,
                                 WEBAUTHNACTION.TIMEOUT,
                                 required),
                attestation=getParam(params,
                                     WEBAUTHNACTION.AUTHENTICATOR_ATTESTATION_FORM,
                                     required),
                user_verification=getParam(params,
                                           WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT,
                                           required),
                public_key_credential_algorithms=getParam(params,
                                                          WEBAUTHNACTION.PUBLIC_KEY_CREDENTIAL_ALGORITHMS,
                                                          required),
                authenticator_attachment=getParam(params,
                                                  WEBAUTHNACTION.AUTHENTICATOR_ATTACHMENT,
                                                  optional),
                authenticator_selection_list=getParam(params,
                                                      WEBAUTHNACTION.AUTHENTICATOR_SELECTION_LIST,
                                                      optional),
                resident_key=getParam(params,
                                      WEBAUTHNACTION.AUTHENTICATOR_RESIDENT_KEY,
                                      optional),
                credential_ids=credential_ids
            ).registration_dict

            response_detail["webAuthnRegisterRequest"] = {
                "transaction_id": challenge.transaction_id,
                "message": self._get_message(params),
                "nonce": public_key_credential_creation_options["challenge"],
                "relyingParty": public_key_credential_creation_options["rp"],
                "serialNumber": public_key_credential_creation_options["user"]["id"],
                "pubKeyCredAlgorithms": public_key_credential_creation_options["pubKeyCredParams"],
                "name": public_key_credential_creation_options["user"]["name"],
                "displayName": public_key_credential_creation_options["user"]["displayName"]
            }
            if public_key_credential_creation_options.get("authenticatorSelection"):
                response_detail["webAuthnRegisterRequest"]["authenticatorSelection"] \
                    = public_key_credential_creation_options["authenticatorSelection"]
            if public_key_credential_creation_options.get("timeout"):
                response_detail["webAuthnRegisterRequest"]["timeout"] \
                    = public_key_credential_creation_options["timeout"]
            if public_key_credential_creation_options.get("attestation"):
                response_detail["webAuthnRegisterRequest"]["attestation"] \
                    = public_key_credential_creation_options["attestation"]
            if (public_key_credential_creation_options.get("extensions") or {}).get("authnSel"):
                response_detail["webAuthnRegisterRequest"]["authenticatorSelectionList"] \
                    = public_key_credential_creation_options["extensions"]["authnSel"]
            if public_key_credential_creation_options.get("excludeCredentials"):
                response_detail["webAuthnRegisterRequest"]["excludeCredentials"] = \
                    public_key_credential_creation_options.get("excludeCredentials")

            self.add_tokeninfo(WEBAUTHNINFO.RELYING_PARTY_ID,
                               public_key_credential_creation_options["rp"]["id"])
            self.add_tokeninfo(WEBAUTHNINFO.RELYING_PARTY_NAME,
                               public_key_credential_creation_options["rp"]["name"])

        elif self.token.rollout_state == "":
            # This is the second step of the init request. The registration
            # ceremony has been successfully performed.
            response_detail = {
                "webAuthnRegisterResponse": {"subject": self.token.description}
            }

        else:
            response_detail = {}

        return response_detail

    @log_with(log)
    def is_challenge_request(self, passw, user=None, options=None):
        """
        Check if the request would start a challenge.

        Every request that is not a response needs to spawn a challenge.

        Note:
        This function does not need to be decorated with
        @challenge_response_allowed, as the WebAuthn token is always
        a challenge response token!

        :param passw:  The PIN of the token
        :type passw: basestring
        :param user: The User making the request
        :type user: User
        :param options: Dictionary of additional request parameters
        :type options: dict
        :return: Whether to trigger a challenge
        :rtype: bool
        """

        return self.check_pin(passw,
                              user=user,
                              options=options or {})

    @staticmethod
    def create_usernameless_challenge(options):
        """
        Creates a challenge for a username less authentication

        :param options: The request context parameters and data
        :type options: dict
        :return: Success status, message, transaction id and reply_dict
        :rtype: (bool, basestring, basestring, dict)
        """
        nonce = WebAuthnTokenClass._get_nonce()
        transactionid = Challenge.create_transaction_id()
        challenge = jwt.encode(
            {
                "nonce": webauthn_b64_encode(nonce),
                "transactionId": transactionid
            },
            current_app.secret_key, algorithm='HS256')
        challenge = webauthn_b64_encode(challenge)
        if getParam(options, WEBAUTHNACTION.USERNAMELESS_REALM_POLICY, optional):
            public_key_credential_request_options = WebAuthnAssertionOptions(
                challenge=challenge,
                webauthn_user=None,
                transports=None,
                user_verification_requirement=getParam(options, WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT, required),
                timeout=getParam(options, WEBAUTHNACTION.TIMEOUT, required),
                is_usernameless_realm=True,
                rp_id=getParam(options, WEBAUTHNACTION.RELYING_PARTY_ID, required)
                ).assertion_dict
        else:
            public_key_credential_request_options = \
                WebAuthnAssertionOptions(challenge=challenge,
                                         webauthn_user=None,
                                         transports=None,
                                         user_verification_requirement=None,
                                         timeout=None).assertion_dict

        reply_dict = {"attributes":
                          {"webAuthnSignRequest": public_key_credential_request_options,
                           "hideResponseInput": False,
                           "img": ""},
                      "image": ""}

        return True, "", transactionid, reply_dict

    def create_challenge(self, transactionid=None, options=None):
        """
        Create a challenge for challenge-response authentication.

        This method creates a challenge, which is submitted to the user. The
        submitted challenge will be preserved in the challenge database.

        If no transaction id is given, the system will create a transaction id
        and return it, so that the response can refer to this transaction.

        This method will return a tuple containing a bool value, indicating
        whether a challenge was successfully created, along with a message to
        display to the user, the transaction id, and a dictionary containing
        all parameters and data needed to respond to the challenge, as per the
        api.

        :param transactionid:  The id of this challenge
        :type transactionid: basestring
        :param options: The request context parameters and data
        :type options: dict
        :return: Success status, message, transaction id and reply_dict
        :rtype: (bool, basestring, basestring, dict)
        """

        if not options:
            raise ValueError("Creating a WebAuthn challenge requires options to be provided")
        try:
            user = self._get_webauthn_user(getParam(options, "user", required))
        except ParameterError:
            raise ValueError("When creating a WebAuthn challenge, options must contain user")

        message = self._get_message(options)

        # if a transaction id is given, check if there are other webauthn
        # token and reuse the challenge.
        # TODO: It might be more sensible to pass around a list of all tokens
        #  currently doing challenge creation in this request.
        challenge = None
        if transactionid:
            for c in get_challenges(transaction_id=transactionid):
                # TODO: this throws an exception if the token does not exists
                #  but just created a challenge with it...
                if get_tokens(serial=c.serial, tokentype=self.get_class_type(),
                              count=True):
                    challenge = c.challenge
                    break

        if not challenge:
            nonce = self._get_nonce()
            challenge = hexlify_and_unicode(nonce)
        else:
            nonce = binascii.unhexlify(challenge)

        # Create the challenge in the database
        db_challenge = Challenge(serial=self.token.serial,
                                 transaction_id=transactionid,
                                 challenge=challenge,
                                 data=None,
                                 session=getParam(options, "session", optional),
                                 validitytime=self._get_challenge_validity_time())
        db_challenge.save()

        public_key_credential_request_options = WebAuthnAssertionOptions(
            challenge=webauthn_b64_encode(nonce),
            webauthn_user=user,
            transports=getParam(options,
                                WEBAUTHNACTION.ALLOWED_TRANSPORTS,
                                required),
            user_verification_requirement=getParam(options,
                                                   WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT,
                                                   required),
            timeout=getParam(options,
                             WEBAUTHNACTION.TIMEOUT,
                             required)
        ).assertion_dict

        dataimage = convert_imagefile_to_dataimage(user.icon_url) if user.icon_url else ""
        reply_dict = {"attributes": {"webAuthnSignRequest": public_key_credential_request_options,
                                     "hideResponseInput": self.client_mode != CLIENTMODE.INTERACTIVE,
                                     "img": dataimage},
                      "image": dataimage}

        return True, message, db_challenge.transaction_id, reply_dict

    @staticmethod
    def check_userless_otp(options=None):
        if is_webauthn_assertion_response(options):
            client_data = webauthn_b64_decode(getParam(options, "clientdata", required))
            json_text = to_unicode(client_data)
            c = json.loads(json_text)
            challenge = webauthn_b64_decode(c.get("challenge"))
            try:
                jwt.decode(challenge, current_app.secret_key, algorithms=['HS256'])
            except jwt.DecodeError as err:
                raise AuthenticationRejectedException("Provided response does not contain a challenge issued by this "
                                                      "instance")
            except jwt.ExpiredSignatureError as err:
                raise AuthenticationRejectedException("Provided response does not contain a challenge issued by this "
                                                      "instance")

            # Get token by using the userhandle which is mandatory for resident keys and is equal to the serial in PI
            user_handle = getParam(options, "userhandle", required)
            token = get_tokens_from_serial_or_user(serial=user_handle, user=None, active=True, revoked=False, locked=False)[0]
            reply_dict = {}
            if token is None:
                return False, reply_dict
            user_verification_requirement_policies = Match.user(g,
                    scope=SCOPE.AUTH,
                    action=WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT,
                    user_object=token.user,
                ).action_values(unique=True)
            user_verification_requirement = list(user_verification_requirement_policies)[0] \
                if user_verification_requirement_policies else DEFAULT_USER_VERIFICATION_REQUIREMENT
            if user_verification_requirement not in USER_VERIFICATION_LEVELS:
                raise PolicyError("{0!s} must be one of {1!s}".format(WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT, ", ".join(USER_VERIFICATION_LEVELS)))

            options[WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT] = user_verification_requirement
            options['user'] = token.user
            options['challenge'] = hexlify_and_unicode(challenge)
            try:
                count = token.check_otp(otpval=None, options=options)
                reply_dict["user"] = {"username": token.user.login,
                                      "realm": token.user.realm,
                                      "resolver": token.user.resolver
                                      }
                reply_dict["message"] = "Username-less authentication worked!"
                reply_dict["serial"] = token.token.serial
                reply_dict["type"] = token.token.tokentype
                if count != -1:
                    token.add_tokeninfo(ACTION.LASTAUTH,
                                        datetime.datetime.now(tzlocal()).isoformat(sep=' ', timespec='microseconds'))
                    token.inc_count_auth_success()
                    return True, reply_dict
                else:
                    return False, reply_dict
            except Exception as e:
                return False, reply_dict
        else:
            # Not all necessary data provided.
            return False, {}


    @check_token_locked
    def check_otp(self, otpval, counter=None, window=None, options=None):
        """
        This checks the response of a previous challenge.

        Since this is not a traditional token, otpval and window are unused.
        The information from the client is instead passed in the fields
        `serial`, `id`, `assertion`, `authenticatorData`, `clientDataJSON`,
        and `signature` of the options dictionary.

        :param otpval: Unused for this token type
        :type otpval: None
        :param counter: The authentication counter
        :type counter: int
        :param window: Unused for this token type
        :type window: None
        :param options: Contains the data from the client, along with policy configurations.
        :type options: dict
        :return: A numerical value where values larger than zero indicate success.
        :rtype: int
        """

        if is_webauthn_assertion_response(options) and getParam(options, "challenge", optional):
            credential_id = getParam(options, "credentialid", required)
            authenticator_data = getParam(options, "authenticatordata", required)
            client_data = getParam(options, "clientdata", required)
            signature_data = getParam(options, "signaturedata", required)
            user_handle = getParam(options, "userhandle", optional)
            assertion_client_extensions = getParam(options, "assertionclientextensions", optional)

            try:
                user = self._get_webauthn_user(getParam(options, "user", required))
            except ParameterError:
                raise ValueError("When performing WebAuthn authorization, options must contain user")

            uv_requirement = getParam(options, WEBAUTHNACTION.USER_VERIFICATION_REQUIREMENT, optional)
            uv_req = uv_requirement == USER_VERIFICATION_LEVEL.REQUIRED

            challenge = binascii.unhexlify(getParam(options, "challenge", required))

            try:
                try:
                    http_origin = getParam(options, "HTTP_ORIGIN", required, allow_empty=False)
                except ParameterError:
                    raise AuthenticationRejectedException('HTTP Origin header missing.')

                # This does the heavy lifting.
                #
                # All data is parsed and verified. If any errors occur, an exception
                # will be raised.
                self.set_otp_count(WebAuthnAssertionResponse(
                                       webauthn_user=user,
                                       assertion_response={
                                           'id': credential_id,
                                           'userHandle': user_handle,
                                           'clientData': client_data,
                                           'authData': authenticator_data,
                                           'signature': signature_data,
                                           'assertionClientExtensions':
                                               webauthn_b64_decode(assertion_client_extensions)
                                                   if assertion_client_extensions
                                                   else None
                                       },
                                       challenge=webauthn_b64_encode(challenge),
                                       origin=http_origin,
                                       allow_credentials=[user.credential_id],
                                       uv_required=uv_req
                                   ).verify())
            except AuthenticationRejectedException as e:
                # The authentication ceremony failed.
                log.warning("Checking response for token {0!s} failed. {1!s}".format(self.token.serial, e))
                return -1

            # At this point we can check, if the attestation certificate is
            # authorized. If not, we can raise a policy exception.
            if not attestation_certificate_allowed(
                    {
                        "attestation_issuer": self.get_tokeninfo(WEBAUTHNINFO.ATTESTATION_ISSUER),
                        "attestation_serial": self.get_tokeninfo(WEBAUTHNINFO.ATTESTATION_SERIAL),
                        "attestation_subject": self.get_tokeninfo(WEBAUTHNINFO.ATTESTATION_SUBJECT)
                    },
                    getParam(options, WEBAUTHNACTION.REQ, optional)
            ):
                log.warning(
                    "The WebAuthn token {0!s} is not allowed to authenticate "
                    "due to policy restriction {1!s}".format(self.token.serial, WEBAUTHNACTION.REQ))
                raise PolicyError("The WebAuthn token is not allowed to "
                                  "authenticate due to a policy restriction.")

            # Now we need to check, if a whitelist for AAGUIDs exists, and if
            # so, if this device is whitelisted. If not, we again raise a
            # policy exception.
            allowed_aaguids = getParam(options, WEBAUTHNACTION.AUTHENTICATOR_SELECTION_LIST, optional)
            if allowed_aaguids and self.get_tokeninfo(WEBAUTHNINFO.AAGUID) not in allowed_aaguids:
                log.warning(
                    "The WebAuthn token {0!s} is not allowed to authenticate due to policy "
                    "restriction {1!s}".format(self.token.serial, WEBAUTHNACTION.AUTHENTICATOR_SELECTION_LIST))
                raise PolicyError("The WebAuthn token is not allowed to "
                                  "authenticate due to a policy restriction.")

            # All clear? Nice!
            return self.get_otp_count()

        else:
            # Not all necessary data provided.
            return -1


def is_webauthn_assertion_response(request_data):
    """
    Verify the request received is an assertion response.

    This will check whether the given request contains all parameters
    mandatory for a WebAuthn assertion response in eduMFA. If
    this is not the case, check_otp() will immediately fail.

    :param request_data: The parameters passed in the request.
    :type request_data: dict
    :return: Whether all data necessary to verify the assertion is available.
    :rtype: bool
    """

    return bool(getParam(request_data, "credentialid", optional)
                and getParam(request_data, "authenticatordata", optional)
                and getParam(request_data, "clientdata", optional)
                and getParam(request_data, "signaturedata", optional))

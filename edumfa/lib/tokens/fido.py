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
import base64
import re

from edumfa.lib.utils import to_bytes, to_unicode, urlsafe_b64encode_and_unicode


def url_decode(url):
    """
    Decodes a base64 encoded, not padded string as used in FIDO.
    :param url: base64 urlsafe encoded string
    :type url: basestring or bytes
    :return: the decoded string
    :rtype: bytes
    """
    pad_len = -len(re.sub("[^A-Za-z0-9-_+/]+", "", to_unicode(url))) % 4
    padding = pad_len * "="
    return base64.urlsafe_b64decode(to_bytes(url) + to_bytes(padding))


def url_encode(data):
    """
    Encodes a string base64 websafe and omits trailing padding "=".
    """
    url = urlsafe_b64encode_and_unicode(data)
    return url.strip("=")


def x509name_to_string(x509name):
    """
    Converts an X509Name to a DN-like string.
    """
    components = x509name.get_components()
    return ",".join([f"{to_unicode(c[0])}={to_unicode(c[1])}" for c in components])

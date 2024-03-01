# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2014 Cornelius Kölbel
#
# Copyright (C) LinOTP: 2010 - 2014 LSE Leading Security Experts GmbH
#
# This program is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public
# License, version 3, as published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the
#            GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

"""
SMSProvider is the base class for submitting SMS.
It provides 3 different implementations:

 * HTTP: submitting SMS via an HTTP gateway of an SMS provider
 * SMTP: submitting SMS via an SMTP gateway of an SMS provider
 * Sipgate: submitting SMS via Sipgate service
"""

__license__ = "GNU AGPLv3"
__contact__ = "www.privacyidea.org"
__email__ = "info@privacyidea.org"

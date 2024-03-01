# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2017 Cornelius Kölbel, <cornelius.koelbel@netknights.it>
#
# (c) Cornelius Kölbel
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
__doc__ = """This endpoint is used to create, update, list and delete 
eduMFA server definitions. eduMFA server definitions can be used for
Remote-Tokens and for Federation-Events.

The code of this module is tested in tests/test_api_edumfaserver.py
"""
from flask import (Blueprint, request)
from .lib.utils import (getParam,
                        required,
                        send_result)
from ..lib.log import log_with
from ..lib.policy import ACTION
from .lib.prepolicy import prepolicy, check_base_action
from ..lib.utils import is_true
from flask import g
import logging
from edumfa.lib.edumfaserver import (add_edumfaserver,
                                               eduMFAServer,
                                               delete_edumfaserver,
                                               list_edumfaservers)
from edumfa.models import eduMFAServer as eduMFAServerDB


log = logging.getLogger(__name__)

edumfaserver_blueprint = Blueprint('edumfaserver_blueprint', __name__)


@edumfaserver_blueprint.route('/<identifier>', methods=['POST'])
@prepolicy(check_base_action, request, ACTION.EDUMFASERVERWRITE)
@log_with(log)
def create(identifier=None):
    """
    This call creates or updates a eduMFA Server definition

    :param identifier: The unique name of the eduMFA server definition
    :param url: The URL of the eduMFA server
    :param tls: Set this to 0, if tls should not be checked
    :param description: A description for the definition
    """
    param = request.all_data
    identifier = identifier.replace(" ", "_")
    url = getParam(param, "url", required)
    tls = is_true(getParam(param, "tls", default="1"))
    description = getParam(param, "description", default="")

    r = add_edumfaserver(identifier, url=url, tls=tls,
                              description=description)

    g.audit_object.log({'success': r > 0,
                        'info':  r})
    return send_result(r > 0)


@edumfaserver_blueprint.route('/', methods=['GET'])
@log_with(log)
@prepolicy(check_base_action, request, ACTION.EDUMFASERVERREAD)
def list_edumfa():
    """
    This call gets the list of eduMFA server definitions
    """
    res = list_edumfaservers()

    g.audit_object.log({'success': True})
    return send_result(res)


@edumfaserver_blueprint.route('/<identifier>', methods=['DELETE'])
@prepolicy(check_base_action, request, ACTION.EDUMFASERVERWRITE)
@log_with(log)
def delete_server(identifier=None):
    """
    This call deletes the specified eduMFA server configuration

    :param identifier: The unique name of the eduMFA server definition
    """
    r = delete_edumfaserver(identifier)

    g.audit_object.log({'success': r > 0,
                        'info':  r})
    return send_result(r > 0)


@edumfaserver_blueprint.route('/test_request', methods=['POST'])
@prepolicy(check_base_action, request, ACTION.EDUMFASERVERWRITE)
@log_with(log)
def test():
    """
    Test the eduMFA definition
    :return:
    """
    param = request.all_data
    identifier = getParam(param, "identifier", required)
    url = getParam(param, "url", required)
    tls = is_true(getParam(param, "tls", default="1"))
    user = getParam(param, "username", required)
    password = getParam(param, "password", required)


    s = eduMFAServerDB(identifier=identifier, url=url, tls=tls)
    r = eduMFAServer.request(s, user, password)

    g.audit_object.log({'success': r > 0,
                        'info':  r})
    return send_result(r > 0)

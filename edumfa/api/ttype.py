#
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2015 Cornelius Kölbel, <cornelius@privacyidea.org>
#
# (c) Cornelius Kölbel, privacyidea.org
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
This API endpoint is a generic endpoint that can be used by any token
type.

The tokentype needs to implement a classmethod *api_endpoint* and can then be
called by /ttype/<tokentype>.
This way, each tokentype can create its own API without the need to change
the core API.

The TiQR Token uses this API to implement its special functionalities. See
:ref:`code_tiqr_token`.
"""
import json
import logging
import threading

from flask import Blueprint, current_app, g, jsonify, request

from edumfa.api.lib.utils import get_all_params
from edumfa.lib.audit import getAudit
from edumfa.lib.config import (
    SYSCONF,
    ensure_no_config_object,
    get_edumfa_node,
    get_from_config,
    get_token_class,
)
from edumfa.lib.error import ParameterError
from edumfa.lib.policy import PolicyClass
from edumfa.lib.user import get_user_from_param
from edumfa.lib.utils import get_client_ip

from ..lib.framework import get_app_config_value
from ..lib.log import log_with
from .lib.utils import getParam

log = logging.getLogger(__name__)

ttype_blueprint = Blueprint("ttype_blueprint", __name__)


@ttype_blueprint.before_request
def before_request():
    """
    This is executed before the request
    """
    ensure_no_config_object()
    request.all_data = get_all_params(request)
    edumfa_server = get_app_config_value(
        "EDUMFA_AUDIT_SERVERNAME", get_edumfa_node(request.host)
    )
    # Create a policy_object, that reads the database audit settings
    # and contains the complete policy definition during the request.
    # This audit_object can be used in the postpolicy and prepolicy and it
    # can be passed to the innerpolicies.
    g.policy_object = PolicyClass()
    g.audit_object = getAudit(current_app.config)
    # access_route contains the ip adresses of all clients, hops and proxies.
    g.client_ip = get_client_ip(request, get_from_config(SYSCONF.OVERRIDECLIENT))
    g.serial = getParam(request.all_data, "serial") or None
    g.audit_object.log(
        {
            "success": False,
            "action_detail": "",
            "client": g.client_ip,
            "client_user_agent": request.user_agent.browser,
            "edumfa_server": edumfa_server,
            "action": f"{request.method!s} {request.url_rule!s}",
            "thread_id": f"{threading.current_thread().ident!s}",
            "info": "",
        }
    )


@ttype_blueprint.route("/<ttype>", methods=["POST", "GET"])
@log_with(log)
def token(ttype=None):
    """
    This is a special token function. Each token type can define an
    additional API call, that does not need authentication on the REST API
    level.

    :return: Token Type dependent
    """
    tokenc = get_token_class(ttype)
    if tokenc is None:
        log.error(f"Invalid tokentype provided. ttype: {ttype.lower()}")
        raise ParameterError(f"Invalid tokentype provided. ttype: {ttype.lower()}")
    res = tokenc.api_endpoint(request, g)
    serial = getParam(request.all_data, "serial")
    user = get_user_from_param(request.all_data)
    g.audit_object.log(
        {
            "success": 1,
            "user": user.login,
            "realm": user.realm,
            "serial": serial,
            "token_type": ttype,
        }
    )
    if res[0] == "json":
        return jsonify(res[1])
    elif res[0] in ["html", "plain"]:
        return current_app.response_class(res[1], mimetype=f"text/{res[0]!s}")
    elif len(res) == 2:
        return current_app.response_class(
            json.dumps(res[1]), mimetype=f"application/{res[0]!s}"
        )
    else:
        return current_app.response_class(
            res[1], mimetype="application/octet-binary", headers=res[2]
        )

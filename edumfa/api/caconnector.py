# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA
#
# 2015 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
__doc__ = """This is the REST API for managing CA connector definitions.
The CA connectors are written to the database table "caconnector".

The code is tested in tests/test_api_caconnector.py.
"""
import logging

from flask import Blueprint, g, request

from edumfa.lib.caconnector import (
    delete_caconnector,
    get_caconnector_list,
    get_caconnector_specific_options,
    save_caconnector,
)
from edumfa.lib.policy import ACTION

from ..api.lib.prepolicy import check_base_action, prepolicy
from ..lib.log import log_with
from .lib.utils import getParam, send_result

log = logging.getLogger(__name__)


caconnector_blueprint = Blueprint("caconnector_blueprint", __name__)


@caconnector_blueprint.route("/<name>", methods=["GET"])
@caconnector_blueprint.route("/", methods=["GET"])
@log_with(log)
@prepolicy(check_base_action, request, ACTION.CACONNECTORREAD)
def get_caconnector_api(name=None):
    """
    returns a json list of the available CA connectors
    """
    g.audit_object.log({"detail": f"{name!s}"})
    res = get_caconnector_list(
        filter_caconnector_name=name, return_config=True
    )  # the endpoint is only accessed by admins
    g.audit_object.log({"success": True})
    return send_result(res)


@caconnector_blueprint.route("/specific/<catype>", methods=["GET"])
@log_with(log)
@prepolicy(check_base_action, request, ACTION.CACONNECTORREAD)
def get_caconnector_specific(catype):
    """
    It requires the configuration data of a CA connector in the GET parameters
    and returns a dict of possible specific options.
    """
    param = request.all_data
    # Create an object out of the type and the given request parameters.
    res = get_caconnector_specific_options(catype, param)
    g.audit_object.log({"success": True})
    return send_result(res)


@caconnector_blueprint.route("/<name>", methods=["POST"])
@log_with(log)
@prepolicy(check_base_action, request, ACTION.CACONNECTORWRITE)
def save_caconnector_api(name=None):
    """
    Create a new CA connector
    """
    param = request.all_data
    param["caconnector"] = name
    g.audit_object.log({"detail": f"{name!s}"})
    res = save_caconnector(param)
    g.audit_object.log({"success": True})
    return send_result(res)


@caconnector_blueprint.route("/<name>", methods=["DELETE"])
@log_with(log)
@prepolicy(check_base_action, request, ACTION.CACONNECTORDELETE)
def delete_caconnector_api(name=None):
    """
    Delete a specific CA connector
    """
    g.audit_object.log({"detail": f"{name!s}"})
    res = delete_caconnector(name)
    g.audit_object.log({"success": True})
    return send_result(res)

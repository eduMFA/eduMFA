#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2015 - 2018 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#
# (c) cornelius kölbel, privacyidea.org
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
__doc__ = """This module contains the before and after routines for all
Flask endpoints.
It also contains the error handlers.
"""

import datetime
import logging
import threading

from flask import current_app, g, request

from edumfa.api.auth import admin_required, jwtauth, user_required
from edumfa.api.lib.postpolicy import postrequest, sign_response
from edumfa.api.ttype import ttype_blueprint
from edumfa.api.validate import validate_blueprint
from edumfa.lib.audit import getAudit
from edumfa.lib.config import (
    SYSCONF,
    ensure_no_config_object,
    get_edumfa_node,
    get_from_config,
)
from edumfa.lib.event import EventConfiguration
from edumfa.lib.lifecycle import call_finalizers
from edumfa.lib.policy import PolicyClass
from edumfa.lib.token import get_token_owner, get_token_type
from edumfa.lib.user import User
from edumfa.lib.utils import get_client_ip

from ..lib.error import (
    AuthError,
    PolicyError,
    ResourceNotFoundError,
    UserError,
    eduMFAError,
)
from ..lib.framework import get_app_config_value
from ..lib.user import get_user_from_param
from .application import application_blueprint
from .audit import audit_blueprint
from .caconnector import caconnector_blueprint
from .clienttype import client_blueprint
from .edumfaserver import edumfaserver_blueprint
from .event import eventhandling_blueprint
from .lib.utils import get_all_params, getParam, send_error
from .machine import machine_blueprint
from .machineresolver import machineresolver_blueprint
from .monitoring import monitoring_blueprint
from .periodictask import periodictask_blueprint
from .policy import policy_blueprint
from .radiusserver import radiusserver_blueprint
from .realm import defaultrealm_blueprint, realm_blueprint
from .recover import recover_blueprint
from .register import register_blueprint
from .resolver import resolver_blueprint
from .serviceid import serviceid_blueprint
from .smsgateway import smsgateway_blueprint
from .smtpserver import smtpserver_blueprint
from .system import system_blueprint
from .token import token_blueprint
from .tokengroup import tokengroup_blueprint
from .user import user_blueprint

log = logging.getLogger(__name__)


# ``before_app_request`` and ``teardown_app_request`` register the functions
# at the application, so it's sufficient to call them only for one blueprint.
# The decorated functions are called before and after *every* request.
@token_blueprint.before_app_request
def log_begin_request():
    log.debug(f"Begin handling of request {request.full_path!r}")
    g.startdate = datetime.datetime.now()


@token_blueprint.teardown_app_request
def teardown_request(exc):
    try:
        if g.audit_object.has_data:
            g.audit_object.finalize_log()
    except AttributeError:
        # In certain error cases the before_request was not handled
        # completely so that we do not have an audit_object
        # Also during calling webui, there is not audit_object, yet.
        pass
    call_finalizers()
    log.debug(f"End handling of request {request.full_path!r}")


@token_blueprint.before_request
@audit_blueprint.before_request
@system_blueprint.before_request
@user_required
def before_user_request():
    before_request()


@user_blueprint.before_request
@user_required
def before_userendpoint_request():
    before_request()
    # DEL /user/ has no realm parameter and thus we need to create the user object this way.
    if not request.User and request.method == "DELETE":
        resolvername = getParam(request.all_data, "resolvername")
        username = getParam(request.all_data, "username")
        if resolvername and username:
            request.User = User(login=username, resolver=resolvername)


@resolver_blueprint.before_request
@machineresolver_blueprint.before_request
@machine_blueprint.before_request
@realm_blueprint.before_request
@defaultrealm_blueprint.before_request
@policy_blueprint.before_request
@application_blueprint.before_request
@smtpserver_blueprint.before_request
@eventhandling_blueprint.before_request
@periodictask_blueprint.before_request
@smsgateway_blueprint.before_request
@radiusserver_blueprint.before_request
@caconnector_blueprint.before_request
@edumfaserver_blueprint.before_request
@client_blueprint.before_request
@monitoring_blueprint.before_request
@tokengroup_blueprint.before_request
@serviceid_blueprint.before_request
@admin_required
def before_admin_request():
    before_request()


def before_request():
    """
    This is executed before the request.

    user_required checks if there is a logged in admin or user

    The checks for ONLY admin are preformed in api/system.py
    """
    # remove session from param and gather all parameters, either
    # from the Form data or from JSON in the request body.
    ensure_no_config_object()
    request.all_data = get_all_params(request)
    if g.logged_in_user.get("role") == "user":
        # A user is calling this API. First thing we do is restricting the user parameter.
        # ...to restrict token view, audit view or token actions.
        request.all_data["user"] = g.logged_in_user.get("username")
        request.all_data["realm"] = g.logged_in_user.get("realm")

    try:
        request.User = get_user_from_param(request.all_data)
        # overwrite or set the resolver parameter in case of a logged in user
        if g.logged_in_user.get("role") == "user":
            request.all_data["resolver"] = request.User.resolver
    except AttributeError:
        # Some endpoints do not need users OR e.g. the setPolicy endpoint
        # takes a list as the userobject
        request.User = None
    except UserError:
        # In cases like the policy API, the parameter "user" is part of the
        # policy and will not resolve to a user object
        request.User = User()

    g.policy_object = PolicyClass()
    g.audit_object = getAudit(current_app.config, g.startdate)
    g.event_config = EventConfiguration()
    # access_route contains the ip adresses of all clients, hops and proxies.
    g.client_ip = get_client_ip(request, get_from_config(SYSCONF.OVERRIDECLIENT))
    # Save the HTTP header in the localproxy object
    g.request_headers = request.headers
    edumfa_server = get_app_config_value(
        "EDUMFA_AUDIT_SERVERNAME", get_edumfa_node(request.host)
    )
    # Already get some typical parameters to log
    serial = getParam(request.all_data, "serial")
    if serial and not "*" in serial:
        g.serial = serial
        tokentype = get_token_type(serial)
        if not request.User:
            # We determine the user object by the given serial number
            try:
                request.User = get_token_owner(serial) or User()
            except ResourceNotFoundError:
                # The serial might not exist! This would raise an exception
                pass

    else:
        g.serial = None
        tokentype = None

    if request.User:
        audit_username = request.User.login
        audit_realm = request.User.realm
        audit_resolver = request.User.resolver
    else:
        audit_realm = getParam(request.all_data, "realm")
        audit_resolver = getParam(request.all_data, "resolver")
        audit_username = getParam(request.all_data, "user")

    g.audit_object.log(
        {
            "success": False,
            "serial": serial,
            "user": audit_username,
            "realm": audit_realm,
            "resolver": audit_resolver,
            "token_type": tokentype,
            "client": g.client_ip,
            "client_user_agent": request.user_agent.browser,
            "edumfa_server": edumfa_server,
            "action": f"{request.method!s} {request.url_rule!s}",
            "action_detail": "",
            "thread_id": f"{threading.current_thread().ident!s}",
            "info": "",
        }
    )

    if g.logged_in_user.get("role") == "admin":
        # An administrator is calling this API
        g.audit_object.log({"administrator": g.logged_in_user.get("username")})
        # TODO: Check is there are realm specific admin policies, so that the
        # admin is only allowed to act on certain realms
        # If now realm is specified, we need to add "filterrealms".
        # If the admin tries to view realms, he is not allowed to, we need to
        #  raise an exception.


@system_blueprint.after_request
@resolver_blueprint.after_request
@realm_blueprint.after_request
@defaultrealm_blueprint.after_request
@policy_blueprint.after_request
@user_blueprint.after_request
@token_blueprint.after_request
@audit_blueprint.after_request
@application_blueprint.after_request
@machine_blueprint.after_request
@machineresolver_blueprint.after_request
@caconnector_blueprint.after_request
@smtpserver_blueprint.after_request
@eventhandling_blueprint.after_request
@radiusserver_blueprint.after_request
@smsgateway_blueprint.after_request
@periodictask_blueprint.after_request
@edumfaserver_blueprint.after_request
@client_blueprint.after_request
@monitoring_blueprint.after_request
@ttype_blueprint.after_request
@validate_blueprint.after_request
@register_blueprint.after_request
@recover_blueprint.after_request
@tokengroup_blueprint.after_request
@serviceid_blueprint.after_request
@jwtauth.after_request
@postrequest(sign_response, request=request)
def after_request(response):
    """
    This function is called after a request
    :return: The response
    """
    # No caching!
    response.headers["Cache-Control"] = "no-cache"
    return response


@system_blueprint.errorhandler(AuthError)
@realm_blueprint.app_errorhandler(AuthError)
@defaultrealm_blueprint.app_errorhandler(AuthError)
@resolver_blueprint.app_errorhandler(AuthError)
@policy_blueprint.app_errorhandler(AuthError)
@user_blueprint.app_errorhandler(AuthError)
@token_blueprint.app_errorhandler(AuthError)
@audit_blueprint.app_errorhandler(AuthError)
@application_blueprint.app_errorhandler(AuthError)
@smtpserver_blueprint.app_errorhandler(AuthError)
@eventhandling_blueprint.app_errorhandler(AuthError)
@monitoring_blueprint.app_errorhandler(AuthError)
@tokengroup_blueprint.app_errorhandler(AuthError)
@serviceid_blueprint.app_errorhandler(AuthError)
def auth_error(error):
    if "audit_object" in g:
        message = ""

        if hasattr(error, "message"):
            message = error.message

        if hasattr(error, "details"):
            if error.details:
                if "message" in error.details:
                    message = f"{message}|{error.details['message']}"

        g.audit_object.add_to_log({"info": message}, add_with_comma=True)
    return send_error(error.message, error_code=error.id, details=error.details), 401


@system_blueprint.errorhandler(PolicyError)
@realm_blueprint.app_errorhandler(PolicyError)
@defaultrealm_blueprint.app_errorhandler(PolicyError)
@resolver_blueprint.app_errorhandler(PolicyError)
@policy_blueprint.app_errorhandler(PolicyError)
@user_blueprint.app_errorhandler(PolicyError)
@token_blueprint.app_errorhandler(PolicyError)
@audit_blueprint.app_errorhandler(PolicyError)
@application_blueprint.app_errorhandler(PolicyError)
@smtpserver_blueprint.app_errorhandler(PolicyError)
@eventhandling_blueprint.app_errorhandler(PolicyError)
@register_blueprint.app_errorhandler(PolicyError)
@recover_blueprint.app_errorhandler(PolicyError)
@monitoring_blueprint.app_errorhandler(PolicyError)
@ttype_blueprint.app_errorhandler(PolicyError)
@tokengroup_blueprint.app_errorhandler(PolicyError)
@serviceid_blueprint.app_errorhandler(PolicyError)
def policy_error(error):
    if "audit_object" in g:
        g.audit_object.add_to_log({"info": error.message}, add_with_comma=True)
    return send_error(error.message, error_code=error.id), 403


@system_blueprint.app_errorhandler(ResourceNotFoundError)
@realm_blueprint.app_errorhandler(ResourceNotFoundError)
@defaultrealm_blueprint.app_errorhandler(ResourceNotFoundError)
@resolver_blueprint.app_errorhandler(ResourceNotFoundError)
@policy_blueprint.app_errorhandler(ResourceNotFoundError)
@user_blueprint.app_errorhandler(ResourceNotFoundError)
@token_blueprint.app_errorhandler(ResourceNotFoundError)
@audit_blueprint.app_errorhandler(ResourceNotFoundError)
@application_blueprint.app_errorhandler(ResourceNotFoundError)
@smtpserver_blueprint.app_errorhandler(ResourceNotFoundError)
@eventhandling_blueprint.app_errorhandler(ResourceNotFoundError)
@register_blueprint.app_errorhandler(ResourceNotFoundError)
@recover_blueprint.app_errorhandler(ResourceNotFoundError)
@ttype_blueprint.app_errorhandler(ResourceNotFoundError)
@tokengroup_blueprint.errorhandler(ResourceNotFoundError)
@serviceid_blueprint.errorhandler(ResourceNotFoundError)
def resource_not_found_error(error):
    """
    This function is called when an ResourceNotFoundError occurs.
    It sends a 404.
    """
    if "audit_object" in g:
        g.audit_object.log({"info": error.message})
    return send_error(error.message, error_code=error.id), 404


@system_blueprint.app_errorhandler(eduMFAError)
@realm_blueprint.app_errorhandler(eduMFAError)
@defaultrealm_blueprint.app_errorhandler(eduMFAError)
@resolver_blueprint.app_errorhandler(eduMFAError)
@policy_blueprint.app_errorhandler(eduMFAError)
@user_blueprint.app_errorhandler(eduMFAError)
@token_blueprint.app_errorhandler(eduMFAError)
@audit_blueprint.app_errorhandler(eduMFAError)
@application_blueprint.app_errorhandler(eduMFAError)
@smtpserver_blueprint.app_errorhandler(eduMFAError)
@eventhandling_blueprint.app_errorhandler(eduMFAError)
@register_blueprint.app_errorhandler(eduMFAError)
@recover_blueprint.app_errorhandler(eduMFAError)
@monitoring_blueprint.app_errorhandler(eduMFAError)
@ttype_blueprint.app_errorhandler(eduMFAError)
@tokengroup_blueprint.app_errorhandler(eduMFAError)
@serviceid_blueprint.app_errorhandler(eduMFAError)
def edumfa_error(error):
    """
    This function is called when an eduMFAError occurs.
    These are not that critical exceptions.
    """
    if "audit_object" in g:
        g.audit_object.log({"info": str(error)})
    return send_error(str(error), error_code=error.id), 400


# other errors
@system_blueprint.app_errorhandler(500)
@realm_blueprint.app_errorhandler(500)
@defaultrealm_blueprint.app_errorhandler(500)
@resolver_blueprint.app_errorhandler(500)
@policy_blueprint.app_errorhandler(500)
@user_blueprint.app_errorhandler(500)
@token_blueprint.app_errorhandler(500)
@audit_blueprint.app_errorhandler(500)
@application_blueprint.app_errorhandler(500)
@smtpserver_blueprint.app_errorhandler(500)
@eventhandling_blueprint.app_errorhandler(500)
@register_blueprint.app_errorhandler(500)
@recover_blueprint.app_errorhandler(500)
@monitoring_blueprint.app_errorhandler(500)
@ttype_blueprint.app_errorhandler(500)
@tokengroup_blueprint.app_errorhandler(500)
@serviceid_blueprint.app_errorhandler(500)
def internal_error(error):
    """
    This function is called when an internal error (500) occurs.
    i.e. if a normal exception, that is not inherited from eduMFAError
    occurs.
    """
    if "audit_object" in g:
        g.audit_object.log({"info": str(error)})
    return send_error(str(error), error_code=-500), 500

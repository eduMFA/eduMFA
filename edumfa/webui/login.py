#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2014 - 2017 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
__doc__ = """This is the starting point for the single page application.
The default page carries the React client. Users can select the legacy AngularJS
interface with ?ui=legacy and return with ?ui=react.
"""
__author__ = "Cornelius Kölbel <cornelius@privacyidea.org>"

from flask import Blueprint, current_app, g, render_template, request

from edumfa.api.lib.prepolicy import is_remote_user_allowed
from edumfa.api.lib.utils import send_html
from edumfa.lib.config import SYSCONF, get_edumfa_node, get_from_config
from edumfa.lib.error import HSMException
from edumfa.lib.framework import get_app_config_value
from edumfa.lib.passwordreset import is_password_reset
from edumfa.lib.policy import ACTION, REMOTE_USER, SCOPE, Match, PolicyClass
from edumfa.lib.queue import has_job_queue
from edumfa.lib.realm import get_realms
from edumfa.lib.utils import get_client_ip, get_version_number

# note: the comment in the following line allows to include it in the docs
DEFAULT_LANGUAGE_LIST = ["en", "de", "nl", "zh_Hant", "fr", "es", "tr", "cs", "it"]  #:

login_blueprint = Blueprint("login_blueprint", __name__)


def get_accepted_language(req):
    # if we are not in the request context, return None to use the default locale
    if not req:
        return None
    # read edumfa.cfg and checks if preferred language is set. Otherwise, default list is selected.
    pi_lang_list = get_app_config_value(
        "EDUMFA_PREFERRED_LANGUAGE", default=DEFAULT_LANGUAGE_LIST
    )
    # try to match the language from the users accept header the browser transmits.
    # (The best match wins)
    return req.accept_languages.best_match(pi_lang_list, default=pi_lang_list[0])


@login_blueprint.before_request
def before_request():
    """
    This is executed before the request
    """
    g.policy_object = PolicyClass()
    g.audit_object = None
    # access_route contains the ip addresses of all clients, hops and proxies.
    g.client_ip = get_client_ip(request, get_from_config(SYSCONF.OVERRIDECLIENT))


def _single_action_value(action):
    """
    Return the value of a webui policy action that takes one string value,
    or "" when the policy is not set.
    """
    values = Match.action_only(g, action=action, scope=SCOPE.WEBUI).action_values(
        unique=True, allow_white_space_in_action=True, write_to_audit_log=False
    )
    if len(values) and list(values)[0]:
        return list(values)[0]
    return ""


@login_blueprint.route("/", methods=["GET"])
def single_page_application():
    instance = request.script_root
    if instance == "/":
        instance = ""

    if current_app.config.get("EDUMFA_UI_DEACTIVATED"):
        # Do not provide the UI
        return send_html(render_template("deactivated.html"))

    # An additional stylesheet, e.g. to tell instances apart (EDUMFA_CSS).
    theme = (current_app.config.get("EDUMFA_CSS") or "").strip("/")
    # Get further customizations
    customization = current_app.config.get("EDUMFA_CUSTOMIZATION", "/static/customize/")
    customization = customization.strip("/")
    custom_css = (
        customization + "/css/custom.css"
        if current_app.config.get("EDUMFA_CUSTOM_CSS")
        else ""
    )
    # Get the hidden external links
    external_links = current_app.config.get("EDUMFA_EXTERNAL_LINKS", True)
    # Get the logo file
    logo = current_app.config.get("EDUMFA_LOGO", "eduMFA-logo.png")
    browser_lang = get_accepted_language(request)
    # The page title can be configured in edumfa.cfg
    page_title = current_app.config.get("EDUMFA_PAGE_TITLE", "eduMFA System")
    # check if login with REMOTE_USER is allowed.
    remote_user = ""
    password_reset = False
    if not hasattr(request, "all_data"):
        request.all_data = {}
    # Depending on displaying the realm dropdown, we fill realms or not.
    realms = []
    realm_dropdown = Match.action_only(
        g, scope=SCOPE.WEBUI, action=ACTION.REALMDROPDOWN
    ).policies(write_to_audit_log=False)
    show_node = (
        get_edumfa_node()
        if Match.generic(g, scope=SCOPE.WEBUI, action=ACTION.SHOW_NODE).any(
            write_to_audit_log=False
        )
        else ""
    )
    if realm_dropdown:
        try:
            realm_dropdown_values = Match.action_only(
                g, scope=SCOPE.WEBUI, action=ACTION.REALMDROPDOWN
            ).action_values(
                unique=False,
                allow_white_space_in_action=True,
                write_to_audit_log=False,
            )
            # Use the realms from the policy.
            realms = sorted(realm_dropdown_values)
        except AttributeError as _e:
            # The policy is still a boolean realm_dropdown action
            # Thus we display ALL realms
            realms = sorted(get_realms())

    force_remote_user = False
    try:
        r = is_remote_user_allowed(request, write_to_audit_log=False)
        force_remote_user = r == REMOTE_USER.FORCE
        if r != REMOTE_USER.DISABLE:
            user = request.remote_user
            if (
                not user
                and not request.headers.get("Remote-User") is None
                and not request.headers.get("Remote-User") == ""
            ):
                user = request.headers.get("Remote-User")
            remote_user = user
        password_reset = is_password_reset(g)
        hsm_ready = True
    except HSMException:
        hsm_ready = False

    # Settings the React client reads from the JSON block in index.html
    # (edumfa/static/react-src/lib/uiConfig.ts).
    ui_config = {
        "browser_lang": browser_lang,
        "customization": customization,
        "external_links": bool(external_links),
        "force_remote_user": bool(force_remote_user),
        "gdpr_link": _single_action_value(ACTION.GDPR_LINK),
        "has_job_queue": bool(has_job_queue()),
        "hsm_ready": hsm_ready,
        "instance": instance,
        "login_text": _single_action_value(ACTION.LOGIN_TEXT),
        "logo": logo,
        "page_title": page_title,
        "password_reset": bool(password_reset),
        "realms": realms,
        "remote_user": remote_user or "",
        "show_node": show_node,
    }

    render_context = {
        "instance": instance,
        "browser_lang": browser_lang,
        "theme": theme,
        "custom_css": custom_css,
        "page_title": page_title,
        "ui_config": ui_config,
    }

    # The React UI and the switch buttons are opt-in (EDUMFA_REACT_UI); legacy is the default.
    react_ui_available = bool(current_app.config.get("EDUMFA_REACT_UI", False))
    # Only an explicit, allowlisted choice changes the browser's preference.
    # The cookie holds a UI name, never authentication data.
    requested_ui = request.args.get("ui") if react_ui_available else None
    selected_ui = (
        requested_ui
        if requested_ui in ("react", "legacy")
        else request.cookies.get("edumfa_ui", "legacy")
        if react_ui_available
        else "legacy"
    )
    if selected_ui == "legacy":
        render_context.update(ui_config)
        render_context.update(
            {
                "realms": ",".join(realms),
                "translation_warning": current_app.config.get(
                    "EDUMFA_TRANSLATION_WARNING", False
                ),
                "customization_menu_file": "templates/menu.html",
                "customization_baseline_file": "templates/baseline.html",
                "react_ui_enabled": False,
                "switch_ui_enabled": react_ui_available,
                "version_number": get_version_number(),
            }
        )
    index_page = current_app.config.get("EDUMFA_INDEX_HTML") or (
        "legacy.html" if selected_ui == "legacy" else "index.html"
    )
    response = send_html(render_template(index_page, **render_context))
    response.vary.add("Cookie")
    response.cache_control.no_store = True
    if requested_ui in ("react", "legacy"):
        response.set_cookie(
            "edumfa_ui",
            requested_ui,
            max_age=31536000,
            path=instance + "/",
            httponly=True,
            secure=request.is_secure,
            samesite="Lax",
        )
    return response

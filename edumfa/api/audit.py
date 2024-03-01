# -*- coding: utf-8 -*-
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
__doc__="""This is the audit REST API that can be used to search the audit log.
It only provides the method

  GET /audit
"""
from flask import (Blueprint, request, current_app, stream_with_context)
from .lib.utils import (send_result, send_file)
from ..api.lib.prepolicy import (prepolicy, check_base_action, auditlog_age,
                                 allowed_audit_realm, hide_audit_columns)
from ..api.auth import admin_required
from ..lib.policy import ACTION
from flask import g
import logging
from ..lib.audit import search, getAudit
from edumfa.lib.utils import parse_timedelta

log = logging.getLogger(__name__)

audit_blueprint = Blueprint('audit_blueprint', __name__)


@audit_blueprint.route('/', methods=['GET'])
@prepolicy(check_base_action, request, ACTION.AUDIT)
@prepolicy(allowed_audit_realm, request, ACTION.AUDIT)
@prepolicy(auditlog_age, request)
@prepolicy(hide_audit_columns, request)
def search_audit():
    """
    return a paginated list of audit entries.

    Params can be passed as key-value-pairs.

    :httpparam timelimit: A timelimit, that limits the recent audit entries.
        This param gets overwritten by a policy auditlog_age. Can be 1d, 1m, 1h.

    **Example request**:

    .. sourcecode:: http

       GET /audit?realm=realm1 HTTP/1.1
       Host: example.com
       Accept: application/json

    **Example response**:

    .. sourcecode:: http

       HTTP/1.1 200 OK
       Content-Type: application/json

        {
          "id": 1,
          "jsonrpc": "2.0",
          "result": {
            "status": true,
            "value": [
              {
                 "serial": "....",
                 "missing_line": "..."
              }
            ]
          },
          "version": "edumfa unknown"
        }
    """
    audit_dict = search(current_app.config, request.all_data)
    g.audit_object.log({'success': True})
    
    return send_result(audit_dict)


@audit_blueprint.route('/<csvfile>', methods=['GET'])
@prepolicy(check_base_action, request, ACTION.AUDIT_DOWNLOAD)
@prepolicy(auditlog_age, request)
@admin_required
def download_csv(csvfile=None):
    """
    Download the audit entry as CSV file.

    Params can be passed as key-value-pairs.

    **Example request**:

    .. sourcecode:: http

       GET /audit/audit.csv?realm=realm1 HTTP/1.1
       Host: example.com
       Accept: text/csv

    **Example response**:

    .. sourcecode:: http

       HTTP/1.1 200 OK
       Content-Type: text/csv

        {
          "id": 1,
          "jsonrpc": "2.0",
          "result": {
            "status": true,
            "value": [
              {
                 "serial": "....",
                 "missing_line": "..."
              }
            ]
          },
          "version": "edumfa unknown"
        }
    """
    audit = getAudit(current_app.config)
    g.audit_object.log({'success': True})
    param = request.all_data
    if "timelimit" in param:
        timelimit = parse_timedelta(param["timelimit"])
        del param["timelimit"]
    else:
        timelimit = None
    return send_file(stream_with_context(audit.csv_generator(param=param,
                                                             timelimit=timelimit)),
                     csvfile)

#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2026 eduMFA Project-Team
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
Unauthenticated health endpoints for load balancers and orchestration probes like kubernetes, haproxy, nginx or docker.
"""

from flask import Blueprint, Response, jsonify, request

from edumfa.lib.sqlutils import is_db_available
from edumfa.models import db

health_blueprint = Blueprint("health_blueprint", __name__)


@health_blueprint.route("/live", methods=["GET"])
def live() -> Response:
    """
    Return a minimal liveness response without checking dependencies.
    """
    return jsonify({"status": "ok"})


@health_blueprint.route("/ready", methods=["GET"])
def ready() -> tuple[Response, int]:
    """
    Return readiness based on database availability.
    """
    database_available = is_db_available(db.engine)

    if database_available:
        return jsonify({"status": "ok"}), 200
    return jsonify({"status": "error"}), 503
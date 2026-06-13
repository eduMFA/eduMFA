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

from pathlib import Path
from sysconfig import get_paths

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from flask import Blueprint, jsonify, request
from sqlalchemy import text

from edumfa.models import db

health_blueprint = Blueprint("health_blueprint", __name__)


def _migration_directory():
    candidates = [
        Path(__file__).resolve().parents[2] / "migrations",
        Path(get_paths()["data"]) / "lib" / "edumfa" / "migrations",
    ]
    for candidate in candidates:
        if (candidate / "env.py").is_file() and (candidate / "versions").is_dir():
            return candidate
    raise FileNotFoundError("Could not find eduMFA migration directory")


def _get_required_schema_heads():
    migrations = _migration_directory()
    config = Config(str(migrations / "alembic.ini"))
    config.set_main_option("script_location", str(migrations))
    return sorted(ScriptDirectory.from_config(config).get_heads())


def _get_database_schema_heads(connection):
    context = MigrationContext.configure(connection)
    return sorted(context.get_current_heads())


def _check_database(connection):
    connection.execute(text("SELECT 1"))
    return {"status": "ok"}


def _check_schema(connection):
    required_heads = _get_required_schema_heads()
    current_heads = _get_database_schema_heads(connection)
    result = {
        "status": "ok",
        "current": current_heads,
        "required": required_heads,
    }
    if current_heads != required_heads:
        result["status"] = "error"
        result["message"] = "Database schema revision does not match application migrations"
    return result


def _health_response(check_schema=False):
    status_code = 200
    checks = {}

    try:
        with db.engine.connect() as connection:
            checks["database"] = _check_database(connection)
            if check_schema:
                checks["schema"] = _check_schema(connection)
    except Exception as exx:
        status_code = 503
        if "database" not in checks:
            checks["database"] = {"status": "error", "message": str(exx)}
        elif check_schema:
            checks["schema"] = {"status": "error", "message": str(exx)}

    if any(check["status"] != "ok" for check in checks.values()):
        status_code = 503

    status = "ok" if status_code == 200 else "error"
    return jsonify({"status": status, "checks": checks}), status_code


def _check_schema_requested():
    value = request.args.get("schema", "false").lower()
    return value.lower() in {"1", "true"}


@health_blueprint.route("/live", methods=["GET"])
def live():
    return jsonify({"status": "ok"})


@health_blueprint.route("", methods=["GET"])
@health_blueprint.route("/", methods=["GET"])
@health_blueprint.route("/ready", methods=["GET"])
def ready():
    return _health_response(check_schema=_check_schema_requested())

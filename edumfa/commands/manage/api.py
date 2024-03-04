# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
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
import sys
from datetime import datetime, timedelta

import click
import jwt
from flask import current_app
from flask.cli import AppGroup

from edumfa.lib.auth import ROLE
from edumfa.lib.crypto import geturandom

api_cli = AppGroup("api", help="Manage API Keys")


@api_cli.command("createtoken")
@click.option('-r', '--role',
              help="The role of the API key can either be 'admin' or 'validate' to access the admin API or the validate API.",
              default=ROLE.ADMIN)
@click.option('-d', '--days', type=int, help='The number of days the access token should be valid. Defaults to 365.',
              default=365)
@click.option('-R', '--realm', help='The realm of the admin. Defaults to "API"', default="API")
@click.option('-u', '--username', help='The username of the admin.')
def createtoken(role, days, realm, username):
    """
    Create an API authentication token
    for administrative or validate use.
    Possible roles are "admin" or "validate".
    """
    if role not in ["admin", "validate"]:
        click.echo("ERROR: The role must be 'admin' or 'validate'!")
        sys.exit(1)
    username = username or geturandom(hex=True)
    secret = current_app.config.get("SECRET_KEY")
    authtype = "API"
    validity = timedelta(days=int(days))
    token = jwt.encode(
        {"username": username, "realm": realm, "nonce": geturandom(hex=True), "role": role, "authtype": authtype,
            "exp": datetime.utcnow() + validity, "rights": "TODO"}, secret)
    click.echo("Username:   {0!s}".format(username))
    click.echo("Realm:      {0!s}".format(realm))
    click.echo("Role:       {0!s}".format(role))
    click.echo("Validity:   {0!s} days".format(days))
    click.echo("Auth-Token: {0!s}".format(token))

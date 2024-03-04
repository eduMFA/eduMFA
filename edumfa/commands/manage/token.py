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

import click
from flask.cli import AppGroup

from edumfa.lib.importotp import parseOATHcsv
from edumfa.lib.token import import_token

token_cli = AppGroup("token", help="Manage tokens")


@token_cli.command("import")
@click.argument("file", type=click.File("r"))
@click.option("-t", "tokenrealm", help="The token realm", type=str)
def import_tokens(file, tokenrealm):
    """
    Import Tokens from a CSV file
    """
    contents = file.read()
    tokens = parseOATHcsv(contents)
    i = 0
    for serial in tokens:
        i += 1
        click.echo(u"{0!s}/{1!s} Importing token {2!s}".format(i, len(tokens), serial))
        import_token(serial, tokens[serial], tokenrealms=tokenrealm)

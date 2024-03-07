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

from edumfa.lib.authcache import cleanup

authcache_cli = AppGroup("authcache", help="Manage authentication cache")


@authcache_cli.command("cleanup")
@click.option("-m", "--minutes", default=480, show_default=True, type=int,
              help="Clean up authcache entries older than this number of minutes")
def authcache_cleanup(minutes: int):
    """
    Remove entries from the authcache.
    Remove all entries where the last_auth entry is older than the given number
    of minutes.
    """
    r = cleanup(minutes)
    click.echo(f"{r} entries deleted from authcache")
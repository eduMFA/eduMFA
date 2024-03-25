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

from edumfa.lib.auth import (create_db_admin, delete_db_admin, get_db_admins)

admin_cli = AppGroup("admin", help="Manage local administrators")


@admin_cli.command("add")
@click.argument('username')
@click.option("-e", "--email", "email")
@click.password_option("-p", "--password")
def add_admin(username: str, email: str, password):
    """
    Register a new administrator in the database.
    """
    create_db_admin(username, email, password)
    click.echo('Admin {0} was registered successfully.'.format(username))


@admin_cli.command("list")
def list_admin():
    """
    List all administrators.
    """
    admins = get_db_admins()
    click.echo("Name \t email")
    click.echo(30 * "=")
    for admin in admins:
        click.echo(f"{admin.username} \t {admin.email}")


@admin_cli.command("change")
@click.argument('username')
@click.option("-e", "--email", "email")
@click.password_option()
def change_admin(username: str, email: str, password):
    """
    Change the email address or the password of an existing administrator.
    """
    create_db_admin(username, email, password)


@admin_cli.command("delete")
@click.argument("username")
def delete_admin(username: str):
    """
    Delete an existing administrator.
    """
    delete_db_admin(username)

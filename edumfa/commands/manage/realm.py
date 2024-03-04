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

realm_cli = AppGroup("realm", help="Manage realms")


@realm_cli.command("list")
def list_realms():
    """
    list the available realms
    """
    from edumfa.lib.realm import get_realms
    realm_list = get_realms()
    for (name, realm_data) in realm_list.items():
        resolvernames = [x.get("name") for x in realm_data.get("resolver")]
        click.echo("%16s: %s" % (name, resolvernames))


@realm_cli.command("create")
@click.argument("name", type=str)
@click.argument("resolvers")
def create(name: str, resolvers):
    """
    Create a new realm.
    This will create a new realm with the given resolver
    or a comma-separated list of resolvers. An existing realm
    with the same name will be replaced.
    """
    from edumfa.lib.realm import set_realm
    resolvers = resolvers.split(",")
    set_realm(name, resolvers)


@realm_cli.command("delete")
@click.argument("name", type=str)
def delete(name: str):
    """
    Delete the given realm
    """
    from edumfa.lib.realm import delete_realm
    delete_realm(name)


@realm_cli.command("set_default")
@click.argument("name", type=str)
def set_default(name):
    """
    Set the given realm to default
    """
    from edumfa.lib.realm import set_default_realm
    set_default_realm(name)


@realm_cli.command("clear_default")
def clear_default():
    """
    Unset the default realm
    """
    from edumfa.lib.realm import set_default_realm
    set_default_realm(None)

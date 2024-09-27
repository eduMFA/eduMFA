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
import ast
import sys

import click
from flask import current_app
from flask.cli import AppGroup

from edumfa.commands.manage.config import export_cli, import_cli
from edumfa.commands.manage.helper import conf_export, conf_import, import_conf_resolver, get_conf_resolver

resolver_cli = AppGroup("resolver", help="Manage resolvers")


@resolver_cli.command("list")
@click.option("-v", "--verbose", is_flag=True, help="Activate verbose output")
def list_resolver(verbose: bool = False):
    from edumfa.lib.resolver import get_resolver_list
    resolver_list = get_resolver_list()

    if not verbose:
        for (name, resolver) in resolver_list.items():
            print("{0!s:16} - ({1!s})".format(name, resolver.get("type")))
    else:
        for (name, resolver) in resolver_list.items():
            print("{0!s:16} - ({1!s})".format(name, resolver.get("type")))
            print("." * 32)
            data = resolver.get("data", {})
            for (k, v) in data.items():
                if k.lower() in ["bindpw", "password"]:
                    v = "xxxxx"
                print("{0!s:>24}: {1!r}".format(k, v))
            print("")


@resolver_cli.command("create")
@click.argument("name", type=str)
@click.argument("rtype", type=str)
@click.argument("filename", type=click.File('r'))
def create(name, rtype, filename):
    """
    Create a new resolver with name and type (ldapresolver, sqlresolver).
    Read the necessary resolver parameters from the filename. The file should
    contain a python dictionary.

    :param name: The name of the resolver
    :param rtype: The type of the resolver like ldapresolver or sqlresolver
    :param filename: The name of the config file.
    :return:
    """
    from edumfa.lib.resolver import save_resolver
    contents = filename.read()

    params = ast.literal_eval(contents)
    params["resolver"] = name
    params["type"] = rtype
    save_resolver(params)


@resolver_cli.command("create_internal")
@click.argument("name")
def create_internal(name):
    """
    This creates a new internal, editable sqlresolver. The users will be
    stored in the token database in a table called 'users_<name>'. You can then
    add this resolver to a new real using the command 'edumfa-manage.py realm'.
    """
    from edumfa.lib.resolver import save_resolver
    sqluri = current_app.config.get("SQLALCHEMY_DATABASE_URI")
    sqlelements = sqluri.split("/")
    # mysql://user:password@localhost/pi
    # sqlite:////home/cornelius/src/privacyidea/data.sqlite
    sql_driver = sqlelements[0][:-1]
    user_pw_host = sqlelements[2]
    database = "/".join(sqlelements[3:])
    username = ""
    password = ""
    host = ""
    # determine host and user
    hostparts = user_pw_host.split("@")
    if len(hostparts) > 2:
        click.echo("Invalid database URI: %s" % sqluri)
        sys.exit(2)
    elif len(hostparts) == 1:
        host = hostparts[0] or "/"
    elif len(hostparts) == 2:
        host = hostparts[1] or "/"
        # split hostname and password
        userparts = hostparts[0].split(":")
        if len(userparts) == 2:
            username = userparts[0]
            password = userparts[1]
        elif len(userparts) == 1:
            username = userparts[0]
        else:
            click.echo("Invalid username and password in database URI: %s" % sqluri)
            sys.exit(3)
    # now we can create the resolver
    params = {'resolver': name, 'type': "sqlresolver", 'Server': host, 'Driver': sql_driver, 'User': username,
        'Password': password, 'Database': database, 'Table': 'users_' + name, 'Limit': '500', 'Editable': '1',
        'Map': '{"userid": "id", "username": "username", '
               '"email":"email", "password": "password", '
               '"phone":"phone", "mobile":"mobile", "surname":"surname", '
               '"givenname":"givenname", "description": "description"}'}
    save_resolver(params)

    # Now we create the database table
    from sqlalchemy import create_engine
    from sqlalchemy import Table, MetaData, Column
    from sqlalchemy import Integer, String
    engine = create_engine(sqluri)
    metadata = MetaData()
    Table('users_%s' % name, metadata, Column('id', Integer, primary_key=True),
          Column('username', String(40), unique=True), Column('email', String(80)), Column('password', String(255)),
          Column('phone', String(40)), Column('mobile', String(40)), Column('surname', String(40)),
          Column('givenname', String(40)), Column('description', String(255)))
    metadata.create_all(engine)


@export_cli.command("resolver")
@click.option("-f", "filename", type=click.File('w'), default=sys.stdout, help="filename to export")
@click.option("-n", "name", help="resolver to export")
@click.option("-p", "--print_passwords", "print_passwords", is_flag=True,
              help="Print the passwords used in the resolver configuration. "
                   "This will overwrite existing passwords on import.")
def r_export(filename, name, print_passwords):
    """
    Export the resolver, specified by 'resolver' to a file. If no resolver name
    is given, all resolver configurations are exported. By default, the content is censored.
    This behavior may be changed by 'print_passwords'.
    If the filename is omitted, the resolvers are written to stdout.
    """
    conf_export({"resolver": get_conf_resolver(name, print_passwords)}, filename)


@import_cli.command("resolver")
@click.option("-f", "filename", help="filename to import", required=True, type=click.File('r'))
@click.option("-c", "cleanup", help="cleanup configuration before import", is_flag=True)
@click.option("-u", "update", help="update configuration during import", is_flag=True)
@click.option(
    "--purge",
    "-p",
    "purge",
    is_flag=True,
    help="Purge not existing items and keep old (update can be enabled using -u).",
)
def r_import(filename, cleanup, update, purge):
    """
    Import the resolvers from a json file. Existing resolvers are skipped by default.
    If 'update' is specified the configuration of any existing resolver is updated.
    Values given as __CENSORED__ (like e.g. passwords) are not touched during the update.
    """
    # Todo: Support the cleanup option to remove all resolvers which do not exist in the imported file
    data = conf_import(conftype="resolver", file=filename)
    import_conf_resolver(data["resolver"], cleanup=cleanup, update=update, purge=purge)


resolver_cli.add_command(r_export, "r_export")
resolver_cli.add_command(r_export, "export")
resolver_cli.add_command(r_import, "r_import")
resolver_cli.add_command(r_import, "import")

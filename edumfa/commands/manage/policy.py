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
from flask.cli import AppGroup

from edumfa.commands.manage.config import import_cli, export_cli
from edumfa.commands.manage.helper import conf_export, conf_import, import_conf_policy, get_conf_policy
from edumfa.lib.policy import PolicyClass, delete_policy, set_policy, enable_policy

policy_cli = AppGroup("policy", help="Manage policies")


@policy_cli.command("list", help="List all policies")
def list_policies():
    """
    list the policies
    """
    pol_cls = PolicyClass()
    policies = pol_cls.list_policies()
    click.echo("Active \t Name \t Scope")
    click.echo(40 * "=")
    for policy in policies:
        click.echo("%s \t %s \t %s" % (policy.get("active"), policy.get("name"), policy.get("scope")))


@policy_cli.command("enable")
@click.argument("name", required=True)
def enable(name):
    """
    enable a policy by name
    """
    r = enable_policy(name)
    click.echo(r)


@policy_cli.command("disable")
@click.argument("name", required=True)
def disable(name):
    """
    disable a policy by name
    """
    r = enable_policy(name, False)
    click.echo(r)


@policy_cli.command("delete")
@click.argument("name", required=True)
def delete(name):
    """
    delete a policy by name
    """
    r = delete_policy(name)
    click.echo(r)


@export_cli.command("policy")
@click.option("-f", "filename", type=click.File('w'), default=sys.stdout, help="filename to export")
@click.option("-n", "name", help="policy to export")
def p_export(filename, name):
    """
    Export the specified policy or all policies to a file.
    If the filename is omitted, the policies are written to stdout.
    """
    conf_export({"policy": get_conf_policy(name)}, filename)


@import_cli.command("policy")
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
def p_import(filename, cleanup, update, purge):
    """
    Import the policies from a file.
    If 'cleanup' is specified the existing policies are deleted before the
    policies from the file are imported.
    """
    data = conf_import(conftype="policy", file=filename)
    import_conf_policy(data["policy"], cleanup=cleanup, update=update, purge=purge)


@policy_cli.command("create")
@click.argument("name")
@click.argument("scope")
@click.argument("action")
@click.option("-f", "filename", help="filename to import", required=False, type=click.File('r'))
def create(name, scope, action, filename):
    """
    create a new policy. 'FILENAME' must contain a dictionary and its content
    takes precedence over CLI parameters.
    I.e. if you are specifying a FILENAME,
    the parameters name, scope and action need to be specified, but are ignored.

    Note: This will only create one policy per file.
    """
    if filename:
        try:
            contents = filename.read()

            params = ast.literal_eval(contents)

            if params.get("name") and params.get("name") != name:
                click.echo(
                    "Found name '{0!s}' in file, will use that instead of '{1!s}'.".format(params.get("name"), name))
            else:
                click.echo("name not defined in file, will use the cli value {0!s}.".format(name))
                params["name"] = name

            if params.get("scope") and params.get("scope") != scope:
                click.echo(
                    "Found scope '{0!s}' in file, will use that instead of '{1!s}'.".format(params.get("scope"), scope))
            else:
                click.echo("scope not defined in file, will use the cli value {0!s}.".format(scope))
                params["scope"] = scope

            if params.get("action") and params.get("action") != action:
                click.echo(
                    "Found action in file: '{0!s}', will use that instead of: '{1!s}'.".format(params.get("action"),
                                                                                               action))
            else:
                click.echo("action not defined in file, will use the cli value {0!s}.".format(action))
                params["action"] = action

            r = set_policy(params.get("name"), scope=params.get("scope"), action=params.get("action"),
                           realm=params.get("realm"), resolver=params.get("resolver"), user=params.get("user"),
                           time=params.get("time"), client=params.get("client"), active=params.get("active", True),
                           adminrealm=params.get("adminrealm"), adminuser=params.get("adminuser"),
                           check_all_resolvers=params.get("check_all_resolvers", False))
            return r

        except Exception as _e:
            click.echo("Unexpected error: {0!s}".format(sys.exc_info()[1]))

    else:
        r = set_policy(name, scope, action)
        return r


policy_cli.add_command(p_export, "p_export")
policy_cli.add_command(p_export, "export")
policy_cli.add_command(p_import, "p_import")
policy_cli.add_command(p_import, "import")
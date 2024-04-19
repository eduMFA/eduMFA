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
from flask.cli import FlaskGroup, run_command

from edumfa.commands.manage.authcache import authcache_cli
from edumfa.commands.manage.ca import ca_cli
from edumfa.commands.manage.hsm import hsm_cli
from edumfa.commands.manage.config import config_cli
from edumfa.commands.manage.core import drop_tables, create_tables, create_pgp_keys, create_audit_keys, encrypt_enckey, \
    create_enckey
from edumfa.app import create_app
from edumfa.commands.manage.admin import admin_cli
from edumfa.commands.manage.api import api_cli
from edumfa.commands.manage.audit import rotate_audit, audit_cli
from edumfa.commands.manage.backup import backup_cli
from edumfa.commands.manage.event import event_cli
from edumfa.commands.manage.policy import policy_cli
from edumfa.commands.manage.realm import realm_cli
from edumfa.commands.manage.resolver import resolver_cli
from edumfa.commands.manage.token import token_cli
from edumfa.lib.utils import get_version_number

CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])


def create_prod_app():
    return create_app("production", silent=True)


@click.group(cls=FlaskGroup, create_app=create_prod_app, context_settings=CONTEXT_SETTINGS,
             epilog='Check out our docs at https://edumfa.readthedocs.io/ for more details')
def cli():
    """Management script for the eduMFA application."""
    click.echo(r"""
               _       __  __ ______      
              | |     |  \/  |  ____/\    
       ___  __| |_   _| \  / | |__ /  \   
      / _ \/ _` | | | | |\/| |  __/ /\ \  
     |  __/ (_| | |_| | |  | | | / ____ \ 
      \___|\__,_|\__,_|_|  |_|_|/_/    \_\ {0!s:>12}
    """.format('v{0!s}'.format(get_version_number())), err=True)


cli.add_command(audit_cli)
cli.add_command(authcache_cli)
cli.add_command(admin_cli)
cli.add_command(api_cli)
cli.add_command(backup_cli)
cli.add_command(realm_cli)
cli.add_command(resolver_cli)
cli.add_command(event_cli)
cli.add_command(policy_cli)
cli.add_command(token_cli)
cli.add_command(config_cli)
cli.add_command(ca_cli)
cli.add_command(hsm_cli)

cli.add_command(create_enckey)
cli.add_command(encrypt_enckey)
cli.add_command(create_audit_keys)
cli.add_command(create_tables)
cli.add_command(create_tables, "createdb")
cli.add_command(create_pgp_keys)
cli.add_command(drop_tables)
cli.add_command(drop_tables, "dropdb")
cli.add_command(rotate_audit, "rotate_audit")
cli.add_command(run_command, "runserver")
if __name__ == '__main__':
    cli()

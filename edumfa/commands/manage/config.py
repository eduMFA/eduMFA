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
import json
import os
import re
import sys
import tarfile
from datetime import datetime
from functools import partial
from subprocess import call

import click
import yaml
from flask.cli import AppGroup

from edumfa.commands.manage.helper import conf_import, conf_export, get_conf_resolver, get_conf_event, get_conf_policy, \
    import_conf_policy, import_conf_resolver, import_conf_event
from edumfa.lib.utils.export import IMPORT_FUNCTIONS, EXPORT_FUNCTIONS

config_cli = AppGroup("config", help="Manage your eduMFA configuration")

import_cli = AppGroup("import", help="import your eduMFA configuration")
export_cli = AppGroup("export", help="export your eduMFA configuration")

config_cli.add_command(import_cli)
config_cli.add_command(export_cli)

exp_fmt_dict = {'python': str, 'json': partial(json.dumps, indent=2), 'yaml': yaml.safe_dump}
imp_fmt_dict = {'python': ast.literal_eval, 'json': json.loads, 'yaml': yaml.safe_load}


@config_cli.command("exporter")
@click.option('-o', '--output', type=click.File('w'), default=sys.stdout,
              help='The filename to export the data to. Write to <stdout> if this argument is not given or is \'-\'.')
@click.option('-f', '--format', "fmt", default='python', show_default=True,
              type=click.Choice(exp_fmt_dict.keys(), case_sensitive=False), help='Output format, default is \'python\'')
# TODO: we need to have an eye on the help output, it might get less readable
#  when more exporter functions are added
@click.option('-t', '--types', multiple=True, default=['all'], show_default=True,
              type=click.Choice(['all'] + list(EXPORT_FUNCTIONS.keys()), case_sensitive=False),
              help=f'The types of configuration to export (can be given multiple times). By default, export all available types. Currently registered exporter types are: {", ".join(["all"] + list(EXPORT_FUNCTIONS.keys()))!s}', )
@click.option('-n', '--name', help='The name of the configuration object to export (default: export all)')
def exporter(output, fmt, types, name=None):
    """
    Export server configuration using specific or all registered exporter types.
    """
    exp_types = EXPORT_FUNCTIONS.keys() if 'all' in types else types

    out = {}
    for typ in exp_types:
        out.update({typ: EXPORT_FUNCTIONS[typ](name=name)})

    if out:
        res = exp_fmt_dict.get(fmt.lower())(out) + '\n'
        output.write(res)


@config_cli.command("importer")
@click.option('-i', '--input', "infile", type=click.File('r'), default=sys.stdin,
              help='The filename to import the data from. Try to read from <stdin> if this argument is not given.')
@click.option('-t', '--types', multiple=True, default=['all'], show_default=True,
              type=click.Choice(['all'] + list(IMPORT_FUNCTIONS.keys()), case_sensitive=False),
              help=f'The types of configuration to import. By default import all available data if a corresponding '
                   f'importer type exists. Currently registered importer types '
                   f'are: {", ".join(["all"] + list(IMPORT_FUNCTIONS.keys()))!s}')
@click.option('-n', '--name', help='The name of the configuration object to import (default: import all)')
def importer(infile, types, name=None):
    """
    Import server configuration using specific or all registered importer types.
    """
    data = None
    imp_types = IMPORT_FUNCTIONS.keys() if 'all' in types else types

    content = infile.read()

    for fmt in imp_fmt_dict:
        try:
            data = imp_fmt_dict[fmt](content)
            break
        except (SyntaxError, json.decoder.JSONDecodeError, yaml.error.YAMLError) as _e:
            continue
    if not data:
        click.echo('Could not read input format! Accepting: {0!s}.'.format(', '.join(imp_fmt_dict.keys())),
                   file=sys.stderr)
        sys.exit(1)

    # we need to go through the importer functions based on priority
    for typ, value in sorted(IMPORT_FUNCTIONS.items(), key=lambda x: x[1]['prio']):
        if typ in imp_types:
            if typ in data:
                click.echo('Importing configuration type "{0!s}".'.format(typ))
                value['func'](data[typ], name=name)


@import_cli.command("full")
@click.option(
    "--file",
    "-f",
    "file",
    help="The file to import. It can be a plain python file or a tar.gz archive containing a configuration backup file with a name containing 'edumfa-config-backup'.",
)
@click.option(
    "--update",
    "-u",
    is_flag=True,
    help="Update the existing configuration. New policies, resolvers and events will also be added.",
)
@click.option(
    "--cleanup/--wipe",
    "-c/-w",
    "cleanup",
    is_flag=True,
    help="The configuration on the target machine will be wiped before the import.",
)
@click.option(
    "--purge",
    "-p",
    "purge",
    is_flag=True,
    help="Purge not existing items and keep old (update can be enabled using -u).",
)
def import_full_config(file, cleanup, update, purge):
    data = {}
    if file:
        if os.path.isfile(file):
            if tarfile.is_tarfile(file):
                tarinfo_objects = []
                tar = tarfile.open(file)
                for member in tar.members:
                    if re.search(r"edumfa-config-backup", member.name):
                        tarinfo_objects.append(member)
                tar.extractall(members=tarinfo_objects)
                tar.close()
                for tarinfo in tarinfo_objects:
                    with open(tarinfo.name) as f:
                        data = conf_import(file=f)
                    # cleanup extracted files
                    os.remove(tarinfo.name)
            else:
                with open(file) as f:
                    data = conf_import(file=f)
    else:
        data = conf_import()
    if 'event' in data:
        import_conf_event(data["event"], cleanup=cleanup, update=update, purge=purge)
    if 'resolver' in data:
        import_conf_resolver(data["resolver"], cleanup=cleanup, update=update, purge=purge)
    if 'policy' in data:
        import_conf_policy(data["policy"], cleanup=cleanup, update=update, purge=purge)


@export_cli.command("full")
@click.option("--print_passwords", "-p", "passwords", is_flag=True,
              help="Print the passwords used in the resolver configuration. This will overwrite existing passwords on import.")
@click.option("--archive", "-a",
              help="Compress the created config-backup as tar.gz archive instead of printing to standard out.")
@click.option("--directory", "-d", help="Directory where the backup will be stored.")
def export_full_config(passwords, archive, directory):
    click.echo("Exporting eduMFA configuration.", file=sys.stderr)
    data = {"resolver": get_conf_resolver(print_passwords=passwords), "event": get_conf_event(),
            "policy": get_conf_policy()}
    if archive or directory:
        from socket import gethostname
        DATE = datetime.now().strftime("%Y%m%d-%H%M")
        BASE_NAME = "edumfa-config-backup"
        HOSTNAME = gethostname()
        if not directory:
            directory = './'
        else:
            call(["mkdir", "-p", directory])
        config_backup_file_base = f"{directory}/{BASE_NAME}-{HOSTNAME}-{DATE}"
        config_backup_file = f"{config_backup_file_base}.py"

        with open(config_backup_file) as f:
            conf_export(data, f)
        if archive:
            config_backup_archive = f"{config_backup_file_base}.tar.gz"
            tar = tarfile.open(config_backup_archive, "w:gz")
            tar.add(config_backup_file)
            tar.close()
            # cleanup
            if tarfile.is_tarfile(config_backup_archive):
                os.remove(config_backup_file)
    else:
        conf_export(data, sys.stdout)

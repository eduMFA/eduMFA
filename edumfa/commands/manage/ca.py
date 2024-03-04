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

import click
from flask.cli import AppGroup

from edumfa.lib.caconnector import get_caconnector_list, save_caconnector, get_caconnector_object, get_caconnector_class

ca_cli = AppGroup("ca", help="Manage Certificate Authorities")


@ca_cli.command("create_crl", short_help="Create a new CA connector.")
@click.argument("name", type=str)
@click.option("-f", "--force", is_flag=True, help="Enforce creation of a new CRL")
def create_crl(ca, force=False):
    ca_obj = get_caconnector_object(ca)
    r = ca_obj.create_crl(check_validity=not force)
    if not r:
        print("The CRL was not created.")
    else:
        print(f"The CRL {r!s} was created.")


@ca_cli.command("create", short_help="Create a new CA connector.")
@click.argument('name', type=str)
@click.option('-t', '--type', "catype", default="local", help='The type of the new CA', show_default=True)
def create(name, catype='local'):
    """
    Create a new CA connector. In case of the "localca" also the directory
    structure, the openssl.cnf and the key pair is created.
    """
    ca = get_caconnector_object(name)
    if ca:
        click.echo(f"A CA connector with the name '{name!s}' already exists.")
        sys.exit(1)
    if not catype:
        catype = "local"
    click.echo("Warning: Be sure to set the access rights.")
    click.echo("")
    click.echo("Creating CA connector of type {0!s}.".format(catype))
    ca_class = get_caconnector_class(catype)
    ca_params = ca_class.create_ca(name)
    r = save_caconnector(ca_params)
    if r:
        click.echo(f"Saved CA Connector with ID {r!s}.")
    else:
        click.echo("Error saving CA connector.")


@ca_cli.command("list")
@click.option("-v", "--verbose", is_flag=True, help="Activate verbose output")
def list_ca(verbose=False):
    """
    List the Certificate Authorities.
    """
    lst = get_caconnector_list()
    for ca in lst:
        click.echo(f"{ca.get('connectorname')!s} (type {ca.get('type')!s})")
        if verbose:
            for (k, v) in ca.get("data").items():
                click.echo(f"\t{k!s:20}: {v!s}")

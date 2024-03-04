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

from edumfa.lib.crypto import create_hsm_object
from flask import current_app
from flask.cli import AppGroup

hsm_cli = AppGroup("hsm", help="Manage hardware security modules")


@hsm_cli.command("create_keys")
def create_keys():
    """
    Create new encryption keys on the HSM. Be sure to first setup the HSM module, the PKCS11
    module and the slot/password for the given HSM in your edumfa.cfg.
    Set the variables EDUMFA_HSM_MODULE, EDUMFA_HSM_MODULE_MODULE, EDUMFA_HSM_MODULE_SLOT,
                      EDUMFA_HSM_MODULE_PASSWORD.
    """
    hsm_object = create_hsm_object(current_app.config)
    r = hsm_object.create_keys()
    click.echo("Please add the following to your edumfa.cfg:")
    click.echo("EDUMFA_HSM_MODULE_KEY_LABEL_TOKEN = '{0}'".format(r.get("token")))
    click.echo("EDUMFA_HSM_MODULE_KEY_LABEL_CONFIG = '{0}'".format(r.get("config")))
    click.echo("EDUMFA_HSM_MODULE_KEY_LABEL_VALUE = '{0}'".format(r.get("value")))

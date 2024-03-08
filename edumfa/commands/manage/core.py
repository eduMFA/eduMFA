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
import base64
import os
import sys
from subprocess import call

import click
import flask
import gnupg
import importlib_metadata
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from flask import current_app
from flask.cli import AppGroup

from edumfa.lib.security.default import DefaultSecurityModule
from edumfa.models import db

core_cli = AppGroup("core", help="Core commands")


@core_cli.command("test")
def test():
    """
    Run all nosetests.
    """
    call(['nosetests', '-v',
          '--with-coverage', '--cover-package=edumfa', '--cover-branches',
          '--cover-erase', '--cover-html', '--cover-html-dir=cover'])


@core_cli.command("encrypt_enckey")
@click.argument("encfile", type=click.File("rb"), required=True)
@click.password_option()
def encrypt_enckey(encfile, password):
    """
    You will be asked for a password and the encryption key in the specified
    file will be encrypted with an AES key derived from your password.

    The encryption key in the file is a 96 bit binary key.

    The password based encrypted encryption key is a hex combination of an IV
    and the encrypted data.

    The result can be piped to a new enckey file.
    """
    # TODO we just print out a string here and assume, the user pipes it into a file.
    #      Maybe we should write the file here so we know what is in there

    enckey = encfile.read()
    res = DefaultSecurityModule.password_encrypt(enckey, password)
    click.echo(res)


@core_cli.command("create_enckey")
@click.option("-e", "--enckey_b64", type=str,
              help="base64 encoded plain text key")
def create_enckey(enckey_b64=None):
    """
    If the key of the given configuration does not exist, it will be created.


    :param enckey_b64: (Optional) base64 encoded plain text key
    :return:
    """
    filename = current_app.config.get("EDUMFA_ENCFILE")
    if os.path.isfile(filename):
        click.echo(f"The file \n\t{filename}\nalready exist. We do not overwrite it!")
        sys.exit(1)
    with open(filename, "wb") as f:
        if enckey_b64 is None:
            f.write(DefaultSecurityModule.random(96))
        else:
            click.echo("Warning: Passing enckey via cli input is considered harmful.")
            bin_enckey = base64.b64decode(enckey_b64)
            if len(bin_enckey) != 96:
                click.echo("Error: enckey must be 96 bytes length")
                sys.exit(1)
            f.write(bin_enckey)
    click.echo(f"Encryption key written to {filename}")
    os.chmod(filename, 0o400)
    click.echo(f"The file permission of {filename} was set to 400!")
    click.echo("Please ensure, that it is owned by the right user.")


@core_cli.command("create_pgp_keys")
@click.option("-f", "--force", is_flag=True,
              help="Overwrite existing PGP keys")
@click.option("-k", "--keysize", type=int, default=2048, show_default=True,
              help="Size of the generated PGP keys (in bits)")
def create_pgp_keys(keysize, force):
    """
    Generate PGP keys to allow encrypted token import.
    """
    GPG_HOME = current_app.config.get("EDUMFA_GNUPG_HOME", "/etc/edumfa/gpg")
    gpg = gnupg.GPG(gnupghome=GPG_HOME)
    keys = gpg.list_keys(True)
    if len(keys) and not force:
        click.echo(
            "There are already private keys. If you want to generate a new private key, use the parameter --force.")
        click.echo(keys)
        sys.exit(1)
    input_data = gpg.gen_key_input(key_type="RSA", key_length=keysize,
                                   name_real="eduMFA Server",
                                   name_comment="Import")
    inputs = input_data.split("\n")
    if inputs[-2] == "%commit":
        del (inputs[-1])
        del (inputs[-1])
        inputs.append("%no-protection")
        inputs.append("%commit")
        inputs.append("")
        input_data = "\n".join(inputs)
    gpg.gen_key(input_data)


@core_cli.command("create_audit_keys")
@click.option("-k", "--keysize", type=int, default=2048, show_default=True,
              help="Create keys with the given size in bits")
def create_audit_keys(keysize):
    """
    Create the RSA signing keys for the audit log.
    You may specify an additional keysize.
    The default keysize is 2048 bit.
    """
    filename = current_app.config.get("EDUMFA_AUDIT_KEY_PRIVATE")
    if os.path.isfile(filename):
        click.echo(f"The file \n\t{filename}\nalready exist. We do not overwrite it!")
        sys.exit(1)
    new_key = rsa.generate_private_key(public_exponent=65537,
                                       key_size=keysize,
                                       backend=default_backend())
    priv_pem = new_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption())
    with open(filename, "wb") as f:
        f.write(priv_pem)

    pub_key = new_key.public_key()
    pub_pem = pub_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo)
    with open(current_app.config.get("EDUMFA_AUDIT_KEY_PUBLIC"), "wb") as f:
        f.write(pub_pem)

    click.echo(f"Signing keys written to {filename} and {current_app.config.get('EDUMFA_AUDIT_KEY_PUBLIC')}")
    os.chmod(filename, 0o400)
    click.echo(f"The file permission of {filename} was set to 400!")
    click.echo("Please ensure, that it is owned by the right user.")


@core_cli.command("create_tables")
@click.option("-s", "--stamp", is_flag=True,
              help='Stamp database to current head revision.')
def create_tables(stamp=False):
    """
    Initially create the tables in the database. The database must exist
    (an SQLite database will be created).
    """
    click.echo(db)
    db.create_all()
    if stamp:
        # get the path to the migration directory from the distribution
        p = [x.locate() for x in importlib_metadata.files('edumfa') if
             'migrations/env.py' in str(x)]
        migration_dir = os.path.dirname(os.path.abspath(p[0]))
        fm_stamp(directory=migration_dir)
    db.session.commit()


core_cli.add_command(create_tables, "createdb")


@core_cli.command("drop_tables")
@click.option("-d", "--dropit", type=str,
              help="If You are sure to drop the tables, pass the parameter \"yes\"")
def drop_tables(dropit):
    """
    This drops all the eduMFA database tables.
    Use with caution! All data will be lost!

    For safety reason you need to pass
        --dropit==yes
    Otherwise the command will not drop anything.
    """
    if dropit == "yes":
        click.echo("Dropping all database tables!")
        db.drop_all()
        table_name = "alembic_version"
        db.reflect()
        table = db.metadata.tables.get(table_name, None)
        if table is not None:
            db.metadata.drop_all(bind=db.engine,
                                 tables=[table],
                                 checkfirst=True)
    else:
        click.echo("Not dropping anything!")


@core_cli.command("validate")
@click.argument("user")
@click.argument("password")
@click.option("-r", "--realm", "realm")
def validate(user, password, realm=None):
    """
    Do an authentication request
    """
    from edumfa.lib.user import get_user_from_param
    from edumfa.lib.token import check_user_pass
    try:
        user = get_user_from_param({"user": user, "realm": realm})
        auth, details = check_user_pass(user, password)
        click.echo("RESULT=%s" % auth)
        click.echo("DETAILS=%s" % details)
    except Exception as exx:
        click.echo("RESULT=Error")
        click.echo("ERROR=%s" % exx)


@core_cli.command("profile")
def profile(length=30, profile_dir=None):
    """
    Start the application in profiling mode.
    """
    from werkzeug.middleware.profiler import ProfilerMiddleware
    if flask.has_request_context():
        click.echo("WARNING: The app may behave unrealistically during profiling.")
    current_app.wsgi_app = ProfilerMiddleware(current_app.wsgi_app, restrictions=[length],
                                              profile_dir=profile_dir)
    current_app.run()

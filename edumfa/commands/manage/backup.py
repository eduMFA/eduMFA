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
import os
import re
import sys
from datetime import datetime
from shlex import quote as shlex_quote
from subprocess import Popen, PIPE, call, run

import click
import sqlalchemy
from flask import current_app
from flask.cli import AppGroup

backup_cli = AppGroup("backup", help="Perform backup operations")

MYSQL_DIALECTS = ["mysql", "pymysql", "mysql+pymysql", "mariadb+pymysql"]
PSQL_DIALECTS = ["postgresql+psycopg", "postgresql+psycopg2", "postgresql+pg8000",
                 "postgresql+asyncpg", "postgresql+psycopg2cffi"]


def _write_mysql_defaults(filename, username, password):
    """
    Write the defaults_file for mysql commands

    :param filename: THe name of the file
    :param username: The username to connect to the database
    :param password: The password to connect to the database
    :return:
    """
    with open(filename, "w") as f:
        f.write("""[client]
user={0!s}
password={1!s}
[mysqldump]
no-tablespaces=True""".format(username, password))

    os.chmod(filename, 0o600)
    # set correct owner, if possible
    if os.geteuid() == 0:
        directory_stat = os.stat(os.path.dirname(filename))
        os.chown(filename, directory_stat.st_uid, directory_stat.st_gid)


@backup_cli.command("restore")
@click.argument("backup_file", type=str)
def restore(backup_file: str):
    """
    Restore a previously made backup. You need to specify the tgz file.
    """
    sqluri = None
    config_file = None
    sqlfile = None
    enckey_contained = False

    p = Popen(["tar", "-ztf", backup_file], stdout=PIPE, universal_newlines=True)
    std_out, err_out = p.communicate()
    for line in std_out.split("\n"):
        if re.search(r"/edumfa.cfg$", line):
            config_file = "/{0!s}".format(line.strip())
        elif re.search(r"\.sql", line):
            sqlfile = "/{0!s}".format(line.strip())
        elif re.search(r"/enckey", line):
            enckey_contained = True

    if not config_file:
        raise Exception("Missing config file edumfa.cfg in backup file.")
    if not sqlfile:
        raise Exception("Missing database dump in backup file.")

    if enckey_contained:
        click.echo("Also restoring encryption key 'enckey'")
    else:
        click.echo("NO FILE 'enckey' CONTAINED! BE SURE TO RESTORE THE ENCRYPTION KEY MANUALLY!")
    click.echo("Restoring to {0!s} with data from {1!s}".format(config_file, sqlfile))

    call(["tar", "-zxf", backup_file, "-C", "/"])
    print(60 * "=")
    with open(config_file, "r") as f:
        # Determine the SQLAlchemy URI
        for line in f:
            if re.search("^SQLALCHEMY_DATABASE_URI", line):
                key, value = line.split("=", 1)
                # Strip whitespaces, and ' "
                sqluri = value.strip().strip("'").strip('"')

    if sqluri is None:
        click.echo("No SQLALCHEMY_DATABASE_URI found in {0!s}".format(config_file))
        sys.exit(2)
    sqltype = sqluri.split(":")[0]
    if sqltype == "sqlite":
        productive_file = sqluri[len("sqlite:///"):]
        click.echo("Restore SQLite %s" % productive_file)
        call(["cp", sqlfile, productive_file])
        os.unlink(sqlfile)
    elif sqltype in MYSQL_DIALECTS:
        parsed_sqluri = sqlalchemy.engine.url.make_url(sqluri)
        username = parsed_sqluri.username
        password = parsed_sqluri.password
        hostname = parsed_sqluri.host
        database = parsed_sqluri.database
        defaults_file = "/etc/edumfa/mysql.cnf"
        _write_mysql_defaults(defaults_file, username, password)
        # Rewriting database
        click.echo("Restoring database.")
        call("mysql --defaults-file=%s -h %s %s < %s" % (
            shlex_quote(defaults_file), shlex_quote(hostname), shlex_quote(database), shlex_quote(sqlfile)), shell=True)
        os.unlink(sqlfile)
    elif sqltype in PSQL_DIALECTS:
        parsed_sqluri = sqlalchemy.engine.url.make_url(sqluri)
        env = os.environ.copy()
        env["PGPASSWORD"] = parsed_sqluri.password
        cmd = ['psql', '-U', parsed_sqluri.username, '-d', parsed_sqluri.database,
               '-h', parsed_sqluri.host, '-f', sqlfile]
        run(cmd, env=env)
    else:
        click.echo("unsupported SQL syntax: %s" % sqltype)
        sys.exit(2)


@backup_cli.command("create")
@click.option("-d", "--directory", "target_dir", type=click.Path(file_okay=False, writable=True),
              default="/var/lib/edumfa/backup/", show_default=True, help="Path to the backup directory")
@click.option("-c", "--config_dir", help="Path to eduMFA config directory",
              type=click.Path(exists=True, file_okay=False, writable=True), default="/etc/edumfa/", show_default=True)
@click.option("-r", "--radius_dir", help="Path to FreeRADIUS config directory",
              type=click.Path(exists=True, file_okay=False, readable=True), default=None, show_default=True)
@click.option("-e", "--enckey", is_flag=True, help="Add the encryption key to the backup")
@click.option("-l", "--lock_table_strategy", type=click.Choice(["LAT","ST","SLT"], case_sensitive=False),
              help="""
                Set the strategy for how to lock tables (only needed for mariadb galera cluster).
                Options are:\n
                LAT: Lock ALL tables in ALL databases! (not recommended for productive instances or
                if the cluster has more databases than just edumfa; requires at least RELOAD privilege);\n
                ST: Single transaction (only for InnoDB);\n
                SLT: Skip lock tables (may lead to inconsistent dumps)
                """,
              default=None)
def create(target_dir: str, config_dir: str, radius_dir=None, enckey: bool = False, lock_table_strategy: str = None):
    """
    Create a new backup of the database and the configuration. The default
    does not include the encryption key. Use the 'enckey' option to also
    backup the encryption key. Then you should make sure, that the backups
    are stored safely.

    If you want to also include the RADIUS configuration into the backup
    specify a directory using 'radius_directory'.

    MariaDB Galera cluster currently does not support the LOCK TABLE option
    causing the backup to fail. Therefore when using galera a different lock
    table strategy needs to be set via the '-l' option.
    Please read option documentation and choose your option carefully!
    """
    CONF_DIR = config_dir
    DATE = datetime.now().strftime("%Y%m%d-%H%M")
    BASE_NAME = "eduMFA-backup"

    target_dir = os.path.abspath(target_dir)
    call(["mkdir", "-p", target_dir])
    # set correct owner, if possible
    if os.geteuid() == 0:
        encfile_stat = os.stat(current_app.config.get("EDUMFA_ENCFILE"))
        os.chown(target_dir, encfile_stat.st_uid, encfile_stat.st_gid)

    sqlfile = "%s/dbdump-%s.sql" % (target_dir, DATE)
    backup_file = "%s/%s-%s.tgz" % (target_dir, BASE_NAME, DATE)

    sqluri = current_app.config.get("SQLALCHEMY_DATABASE_URI")
    parsed_sqluri = sqlalchemy.engine.url.make_url(sqluri)
    sqltype = parsed_sqluri.drivername

    if sqltype == "sqlite":
        productive_file = sqluri[len("sqlite:///"):]
        click.echo(f"Backup SQLite {productive_file}")
        sqlfile = "%s/db-%s.sqlite" % (target_dir, DATE)
        call(["cp", productive_file, sqlfile])
    elif sqltype in MYSQL_DIALECTS:
        username = parsed_sqluri.username
        password = parsed_sqluri.password
        hostname = parsed_sqluri.host
        database = parsed_sqluri.database
        defaults_file = "{0!s}/mysql.cnf".format(config_dir)
        _write_mysql_defaults(defaults_file, username, password)
        cmd = ['mysqldump', '--defaults-file={!s}'.format(shlex_quote(defaults_file)), '-h', shlex_quote(hostname)]
        if parsed_sqluri.port:
            cmd.extend(['-P', str(parsed_sqluri.port)])
        cmd.extend(['-B', shlex_quote(database), '-r', shlex_quote(sqlfile)])
        if lock_table_strategy:
            if lock_table_strategy.upper() == 'LAT':
                cmd.append('--lock-all-tables')
            elif lock_table_strategy.upper() == 'ST':
                cmd.append('--single-transaction')
            elif lock_table_strategy.upper() == 'SLT':
                cmd.append('--skip-lock-tables')
        call(cmd, shell=False)
    elif sqltype in PSQL_DIALECTS:
        env = os.environ.copy()
        env["PGPASSWORD"] = parsed_sqluri.password
        cmd = ['pg_dump', '-U', parsed_sqluri.username, '-d', parsed_sqluri.database,
               '-h', parsed_sqluri.host, '-f', sqlfile]
        run(cmd, env=env)
    else:
        click.echo(f"unsupported SQL syntax: {sqltype}")
        sys.exit(2)
    enc_file = current_app.config.get("EDUMFA_ENCFILE")

    backup_call = ["tar", "-zcf", backup_file, CONF_DIR, sqlfile]

    if radius_dir:
        # Simply append the radius directory to the backup command
        backup_call.append(radius_dir)

    if not enckey:
        # Exclude enckey from backup
        # since tar v1.30 --exclude cannot be appended
        backup_call.insert(1, "--exclude={0!s}".format(enc_file))

    call(backup_call)
    os.unlink(sqlfile)
    os.chmod(backup_file, 0o600)

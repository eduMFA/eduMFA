#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
#  2020-04-28 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#             Read tables oc_accounts and oc_users from owncloud
#
__doc__ = """You can use this script to read the tables oc_accounts and
oc_users from owncloud and fill a local user table in eduMFA.

Run this script in a cron job. It will read the users from ownCloud and
* insert new users
* update changed users
* remove deleted users
"""
from sqlalchemy import create_engine
from sqlalchemy.sql import select
from sqlalchemy.schema import ForeignKey
from sqlalchemy import (Table, MetaData, Column, Integer, Unicode)
import sys
import json
import getopt


EXAMPLE_CONFIG_FILE = """{
    "SQL": {
        "OWNCLOUD_URI": "mysql+pymysql://oc:password@localhost/oc",
        "EDUMFA_URI": "mysql+pymysql://pi:password@localhost/pi?charset=utf8mb4",
        "LOCAL_TABLE": "edumfa_oc_users",
        "INSERT_CHUNK_SIZE": 10000
    }
}"""


class Config:

    def __init__(self, config_file):
        with open(config_file, "r") as f:
            contents = f.read()
        config = json.loads(contents)
        self.OWNCLOUD_URI = config.get("SQL").get("OWNCLOUD_URI")
        self.EDUMFA_URI = config.get("SQL").get("EDUMFA_URI")
        self.LOCAL_TABLE = config.get("SQL").get("LOCAL_TABLE")
        self.INSERT_CHUNK_SIZE = config.get("SQL").get("INSERT_CHUNK_SIZE")


def sync_owncloud(config_obj):

    metadata = MetaData()

    user_table = Table(config_obj.LOCAL_TABLE, metadata,
                       Column("id", Integer, primary_key=True, nullable=False),
                       Column("email", Unicode(255), nullable=True),
                       Column("user_id", Unicode(255), nullable=False, unique=True),
                       Column("lower_user_id", Unicode(255), nullable=False, unique=True),
                       Column("display_name", Unicode(255)),
                       Column("backend", Unicode(64)),
                       Column("last_login", Integer, default=0),
                       Column("state", Integer, default=0),
                       Column("password", Unicode(255), nullable=False)
                       )

    oc_accounts_table = Table("oc_accounts", metadata,
                              Column("id", Integer, primary_key=True, nullable=False),
                              Column("email", Unicode(255), nullable=True),
                              Column("user_id", Unicode(255), nullable=False, unique=True),
                              Column("lower_user_id", Unicode(255), nullable=False, unique=True),
                              Column("display_name", Unicode(255)),
                              Column("backend", Unicode(64)),
                              Column("last_login", Integer, default=0),
                              Column("state", Integer, default=0)
                              )

    oc_users_table = Table("oc_users", metadata,
                           Column("uid", Unicode(255), ForeignKey("oc_accounts.user_id")),
                           Column("password", Unicode(255), nullable=False)
                           )

    oc_engine = create_engine(config_obj.OWNCLOUD_URI)
    edumfa_engine = create_engine(config_obj.EDUMFA_URI)

    print("Creating table {0!s}, if it does not exist.".format(config_obj.LOCAL_TABLE))
    metadata.create_all(edumfa_engine)

    conn_oc = oc_engine.connect()
    conn_pi = edumfa_engine.connect()

    def insert_chunks(conn, table, values, chunk_size=100000):
        """
        Split **values** into chunks of size **chunk_size** and insert them sequentially.
        """
        values_length = len(values)
        for chunk in range(0, values_length, chunk_size):
            print('Insert records {} to {} ...'.format(chunk, min(chunk + chunk_size,
                                                                  values_length) - 1))
            try:
                conn.execute(table.insert(), values[chunk:chunk + chunk_size])
            except Exception as err:
                t = 'Failed to insert chunk: {0!s}'.format(err)
                warnings.append(t)
                print(t)

    warnings = []

    s = select([oc_accounts_table, oc_users_table.c.password]).select_from(
        oc_accounts_table.join(oc_users_table, oc_users_table.c.uid == oc_accounts_table.c.user_id))

    owncloud_source = conn_oc.execute(s)

    s = select([user_table])

    edumfa_dest = conn_pi.execute(s)

    # Build a dict with the existing users
    edumfa_users = {}
    for r in edumfa_dest:
        edumfa_users[r.id] = r

    edumfa_users_insert = []
    edumfa_users_update = []
    unchanged = 0
    for r in owncloud_source:
        if r.id not in edumfa_users.keys():
            # This is a new entry
            edumfa_users_insert.append(dict(id=r.id, email=r.email, user_id=r.user_id,
                                        lower_user_id=r.lower_user_id, display_name=r.display_name, password=r.password,
                                        backend=r.backend, last_login=r.last_login, state=r.state))
        else:
            # This is an existing entry
            # Check if the entry is the same
            if r == edumfa_users[r.id]:
                # The values are the same
                print("Entry {0!s}/{1!s} unchanged.".format(r.id, r.user_id))
                unchanged += 1
            else:
                # add to update
                edumfa_users_update.append(dict(id=r.id, email=r.email, user_id=r.user_id,
                                        lower_user_id=r.lower_user_id, display_name=r.display_name, password=r.password,
                                        backend=r.backend, last_login=r.last_login, state=r.state))
            # Delete entry from the eduMFA user list
            del(edumfa_users[r.id])

    edumfa_users_delete = edumfa_users

    print("Processing...")
    print("{0!s} new entries.".format(len(edumfa_users_insert)))
    print("{0!s} unchanged entries.".format(unchanged))
    print("{0!s} updated entries.".format(len(edumfa_users_update)))
    print("{0!s} removed entries.".format(len(edumfa_users_delete)))

    if len(edumfa_users_insert):
        print("Inserting new entries.")
        insert_chunks(conn_pi, user_table, edumfa_users_insert, config_obj.INSERT_CHUNK_SIZE)

    if len(edumfa_users_update):
        print("Updating entries.")
        for upd in edumfa_users_update:
            stmt = user_table.update().where(user_table.c.id == upd.get("id")).values(upd)
            conn_pi.execute(stmt)

    if len(edumfa_users_delete):
        print("Deleting removed entries.")
        for udel in edumfa_users_delete:
            stmt = user_table.delete().where(user_table.c.id == udel)
            conn_pi.execute(stmt)

    if warnings:
        print("We need to inform you about the following WARNINGS:")
        for warning in warnings:
            print(warning)


def usage():
    print("""
edumfa-sync-owncloud.py --generate-example-config [--config <config file>]

    --generate-example-config, -g   Output an example config file.
                                    This is a JSON file, that needs to be passed
                                    to this command.

    --config, -c <file>             The config file, that contains the complete
                                    configuration.

{0!s}""".format(__doc__))


def main():
    try:
        opts, args = getopt.getopt(sys.argv[1:], "gc:", ["generate-example-config", "config="])
    except getopt.GetoptError as e:
        print(str(e))
        sys.exit(1)

    config_file = None
    generate_config = False

    for o, a in opts:
        if o in ("-g", "--generate-example-config"):
            generate_config = True
            print(EXAMPLE_CONFIG_FILE)
        elif o in ("-c", "--config"):
            config_file = a
        else:
            print("Unknown parameter: {0!s}".format(o))
            sys.exit(3)

    if config_file:
        config_obj = Config(config_file)
        sync_owncloud(config_obj)
        sys.exit(0)

    else:
        if not generate_config:
            usage()
            sys.exit(1)


if __name__ == '__main__':
    main()

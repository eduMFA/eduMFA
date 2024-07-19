#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
#  2020-06-13 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#  2019-10-04 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#  2018-02-09 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#  2016-09-14 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#
__doc__ = """You can use this script to migrate a LinOTP database to eduMFA.
All tokens and token assignments are transferred to eduMFA.

You only need an export of the LinOTP "Token" table.
You need to generate a config file and adapt it to your needs.

SQL section contains the database connections to the LinOTP and
the eduMFA database.

SQL:INSERT_CHUNK_SIZE gives you a speed advantage. This many tokens will
be inserted at one time.

MIGRATE defines which elements should be migrated: This can be tokens, tokeninfo and assignment.

The ASSIGNMENTS section defines, to which eduMFA users the old token-assignments
    should be migrated to.

The "resolver" key maps LinOTP-resolvers to eduMFA-Resolvers.
The key is the LinOTP resolver and the value is the new eduMFA resolver.

The "realm" key puts tokens that are migrated into the specified eduMFA resolver (key)
into the given eduMFA realm (value). Note: There is no logic checking with the
eduMFA resolver-realm-configuration done.
So take care that the eduMFA resolver is really located in the specified eduMFA realm.

In this example the resolvername "lokal" from LinOTP gets imported to
eduMFA with the resolver "PIResolver" in realm "pirealm".

Tokens, that were not assigned to a user will be assigned to the realms specified
in the list "unassigned_tokens".

LinOTP (sometimes) uses a mixed endian notation for the objectGUID of users in Active Directory.
So if your users can not be found due to an unknown objectGUID, you need to set "convert_endian"
to true. This will convert the mixed endian notation to a standard notation used by eduMFA.

The NEW_TOKENINFO section can set any arbitrary tokeninfo for the 
migrated tokens.
"""
import binascii
import getopt
import json
import os
import re
import sys

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    MetaData,
    Table,
    Unicode,
    UnicodeText,
    create_engine,
)
from sqlalchemy.orm import sessionmaker
from sqlalchemy.schema import ForeignKey, Sequence
from sqlalchemy.sql import select

from edumfa.lib.crypto import aes_cbc_decrypt, aes_cbc_encrypt
from edumfa.lib.utils import hexlify_and_unicode

EXAMPLE_CONFIG_FILE = """{
    "SQL": {
        "LINOTP_URI": "mysql+pymysql://linotp:linotp@localhost/linotp2",
        "EDUMFA_URI": "mysql+pymysql://pi:QEK_k_f3SGbu@localhost/pi?charset=utf8mb4",
        "INSERT_CHUNK_SIZE": 10000
    },
    "MIGRATE": {
        "tokens": true,
        "tokeninfo": true,
        "tokeninfo_unicode_keys": ["phone"],
        "assignments": false
    },
    "ASSIGNMENTS": {
        "resolver": {"local": "localpw"},
        "realm": {"localpw": "neuerrealm"},
        "unassigned_tokens": ["testfoo"],
        "convert_endian": true
    },
    "ENCRYPTION": {
        "reencrypt": false,
        "linotp_enc_file": "/etc/linotp2/encKey",
        "edumfa_enc_file": "/etc/edumfa/enckey"
    },
    "NEW_TOKENINFO": {
        "arbitrary_migrationkey": "somevalue"
    }
}"""


# These patterns are used to convert a middle endian UUID to a standard UUID:
# 33221100554477668899AABBCCDDEEFF -> 00112233-4455-6677-8899-AABBCCDDEEFF
UUID_MATCH_PATTERN = (
    "^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})"
    "([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})"
    "([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})"
    "([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$"
)

UUID_REPLACE_PATTERN = "\\4\\3\\2\\1-\\6\\5-\\8\\7-\\9\\10-\\11\\12\\13\\14\\15\\16"


class Config:

    def __init__(self, config_file):
        with open(config_file, "r") as f:
            contents = f.read()
        config = json.loads(contents)
        self.ASSIGNMENTS = config.get("ASSIGNMENTS")
        self.LINOTP_URI = config.get("SQL").get("LINOTP_URI")
        self.EDUMFA_URI = config.get("SQL").get("EDUMFA_URI")
        self.INSERT_CHUNK_SIZE = config.get("SQL").get("INSERT_CHUNK_SIZE")
        self.MIGRATE = config.get("MIGRATE")
        self.REENCRYPT = config.get("ENCRYPTION", {}).get("reencrypt")
        self.LINOTP_ENC_FILE = config.get("ENCRYPTION", {}).get("linotp_enc_file")
        self.EDUMFA_ENC_FILE = config.get("ENCRYPTION", {}).get("edumfa_enc_file")
        self.NEW_TOKENINFO = config.get("NEW_TOKENINFO", {})

        if self.REENCRYPT:
            self.LINOTP_ENC_KEY = read_enckey(self.LINOTP_ENC_FILE)
            self.EDUMFA_ENC_KEY = read_enckey(self.EDUMFA_ENC_FILE)
            if not (self.LINOTP_ENC_KEY and self.EDUMFA_ENC_KEY):
                print("Failed to read both enckey files.")
                sys.exit(2)
        else:
            self.LINOTP_ENC_KEY = self.EDUMFA_ENC_KEY = None


def reencrypt(enc_data, iv, old_key, new_key):
    # decrypt LinOTP
    iv = binascii.unhexlify(iv)
    input_data = binascii.unhexlify(enc_data)
    output = aes_cbc_decrypt(old_key, iv, input_data)
    if not output:
        raise Exception("invalid encoded secret!")
    # unpad
    output = output.rstrip(b"\0")
    # The stripping of the ascii chars was missing for LinOTP 2.7.2
    eof = output.rfind(b"\x01\x02")
    if eof >= 0:
        output = output[:eof]
    data = binascii.a2b_hex(output)

    # encrypt anew
    iv = os.urandom(16)
    input_data = binascii.b2a_hex(data)
    input_data += b"\x01\x02"
    padding = (16 - len(input_data) % 16) % 16
    input_data += padding * b"\0"

    res = aes_cbc_encrypt(new_key, iv, input_data)
    return hexlify_and_unicode(res), hexlify_and_unicode(iv)


def dict_without_keys(d, keys):
    new_d = d.copy()
    for key in keys:
        if key in d:
            new_d.pop(key)
    return new_d


def migrate(config_obj):
    print(f"Re-Encryption token data: {config_obj.REENCRYPT!s}")

    # This maps the resolver types. You must not change this!
    resolver_map = {
        "LDAPIdResolver": "ldapresolver",
        "SQLIdResolver": "sqlresolver",
        "PasswdIdResolver": "passwdresolver",
    }

    token_serial_id_map = {}
    realm_id_map = {}
    resolver_id_map = {}

    metadata = MetaData()

    token_table = Table(
        "token",
        metadata,
        Column("id", Integer, Sequence("token_seq"), primary_key=True, nullable=False),
        Column("description", Unicode(80), default=""),
        Column(
            "serial", Unicode(40), default="", unique=True, nullable=False, index=True
        ),
        Column("tokentype", Unicode(30), default="HOTP", index=True),
        Column("user_pin", Unicode(512), default=""),
        Column("user_pin_iv", Unicode(32), default=""),
        Column("so_pin", Unicode(512), default=""),
        Column("so_pin_iv", Unicode(32), default=""),
        Column("pin_seed", Unicode(32), default=""),
        Column("otplen", Integer(), default=6),
        Column("pin_hash", Unicode(512), default=""),
        Column("key_enc", Unicode(1024), default=""),
        Column("key_iv", Unicode(32), default=""),
        Column("maxfail", Integer(), default=10),
        Column("active", Boolean(), nullable=False, default=True),
        Column("revoked", Boolean(), default=False),
        Column("locked", Boolean(), default=False),
        Column("failcount", Integer(), default=0),
        Column("count", Integer(), default=0),
        Column("count_window", Integer(), default=10),
        Column("sync_window", Integer(), default=1000),
        Column("rollout_state", Unicode(10), default=""),
    )

    tokenowner_table = Table(
        "tokenowner",
        metadata,
        Column(
            "id", Integer, Sequence("tokenowner_seq"), primary_key=True, nullable=False
        ),
        Column("token_id", Integer, ForeignKey("token.id"), nullable=False),
        Column("resolver", Unicode(120), default="", index=True),
        Column("user_id", Unicode(320), default="", index=True),
        Column("realm_id", Integer, ForeignKey("realm.id"), nullable=False),
    )

    tokeninfo_table = Table(
        "tokeninfo",
        metadata,
        Column("id", Integer, Sequence("tokeninfo_seq"), primary_key=True),
        Column("Key", Unicode(255), nullable=False),
        Column("Value", UnicodeText(), default=""),
        Column("Type", Unicode(100), default=""),
        Column("Description", Unicode(2000), default=""),
        Column("token_id", Integer()),
    )

    tokenrealm_table = Table(
        "tokenrealm",
        metadata,
        Column("id", Integer(), Sequence("tokenrealm_seq"), primary_key=True),
        Column("token_id", Integer()),
        Column("realm_id", Integer()),
    )

    realm_table = Table(
        "realm",
        metadata,
        Column("id", Integer, Sequence("realm_seq"), primary_key=True),
        Column("name", Unicode(255), default=""),
        Column("default", Boolean(), default=False),
        Column("option", Unicode(40), default=""),
    )

    resolver_table = Table(
        "resolver",
        metadata,
        Column("id", Integer, Sequence("resolver_seq"), primary_key=True),
        Column("name", Unicode(255), default=""),
        Column("rtype", Unicode(255), default=""),
    )

    resolver_config_table = Table(
        "resolverconfig",
        metadata,
        Column("id", Integer, Sequence("resolverconf_seq"), primary_key=True),
        Column("resolver_id", Integer),
        Column("Key", Unicode(255), default=""),
        Column("Value", Unicode(2000), default=""),
        Column("Type", Unicode(2000), default=""),
        Column("Description", Unicode(2000), default=""),
    )

    resolverrealm_table = Table(
        "resolverrealm",
        metadata,
        Column("id", Integer, Sequence("resolverrealm_seq"), primary_key=True),
        Column("resolver_id", Integer),
        Column("realm_id", Integer),
        Column("priority", Integer),
    )

    #
    # LinOTP table definitions
    #

    linotp_token_table = Table(
        "Token",
        metadata,
        Column("LinOtpTokenId", Integer(), primary_key=True, nullable=False),
        Column("LinOtpTokenDesc", Unicode(80), default=""),
        Column(
            "LinOtpTokenSerialnumber",
            Unicode(40),
            default="",
            unique=True,
            nullable=False,
            index=True,
        ),
        Column("LinOtpTokenType", Unicode(30), default="HMAC", index=True),
        Column("LinOtpTokenInfo", Unicode(2000), default=""),
        Column("LinOtpTokenPinUser", Unicode(512), default=""),
        Column("LinOtpTokenPinUserIV", Unicode(32), default=""),
        Column("LinOtpTokenPinSO", Unicode(512), default=""),
        Column("LinOtpTokenPinSOIV", Unicode(32), default=""),
        Column("LinOtpIdResolver", Unicode(120), default="", index=True),
        Column("LinOtpIdResClass", Unicode(120), default=""),
        Column("LinOtpUserid", Unicode(320), default="", index=True),
        Column("LinOtpSeed", Unicode(32), default=""),
        Column("LinOtpOtpLen", Integer(), default=6),
        Column("LinOtpPinHash", Unicode(512), default=""),
        Column("LinOtpKeyEnc", Unicode(1024), default=""),
        Column("LinOtpKeyIV", Unicode(32), default=""),
        Column("LinOtpMaxFail", Integer(), default=10),
        Column("LinOtpIsactive", Boolean(), default=True),
        Column("LinOtpFailCount", Integer(), default=0),
        Column("LinOtpCount", Integer(), default=0),
        Column("LinOtpCountWindow", Integer(), default=10),
        Column("LinOtpSyncWindow", Integer(), default=1000),
    )

    linotp_engine = create_engine(config_obj.LINOTP_URI)
    edumfa_engine = create_engine(config_obj.EDUMFA_URI)

    linotp_session = sessionmaker(bind=linotp_engine)()
    edumfa_session = sessionmaker(bind=edumfa_engine)()

    conn_linotp = linotp_engine.connect()
    conn_pi = edumfa_engine.connect()

    def insert_chunks(conn, table, values, chunk_size=100000, record_name="records"):
        """
        Split **values** into chunks of size **chunk_size** and insert them sequentially.
        """
        values_length = len(values)
        for chunk in range(0, values_length, chunk_size):
            print(
                "Insert {} {} to {} ...".format(
                    record_name, chunk, min(chunk + chunk_size, values_length) - 1
                )
            )
            try:
                conn.execute(table.insert(), values[chunk : chunk + chunk_size])
            except Exception as err:
                t = f"Failed to insert chunk: {err!s}"
                warnings.append(t)
                print(t)

    # Values to be imported
    token_values = []
    tokeninfo_values = []
    tokenrealm_values = []
    tokenowner_values = []

    warnings = []

    # Process Assignments in table "tokenrealm"
    if config_obj.MIGRATE.get("assignments"):
        s = select([realm_table])
        result = conn_pi.execute(s)
        for r in result:
            realm_id_map[r["name"]] = r["id"]

        s = select([resolver_table])
        result = conn_pi.execute(s)
        for r in result:
            resolver_id_map[r["name"]] = r["id"]

        print(f"Realm-Map: {realm_id_map}")
        print(f"Resolver-Map: {resolver_id_map}")

    # Process Tokens

    if config_obj.MIGRATE.get("tokens"):
        s = select([linotp_token_table])
        result = conn_linotp.execute(s)

        i = 0
        for r in result:
            i = i + 1
            print(f"processing token #{i!s}: {r['LinOtpTokenSerialnumber']!s}")
            # Adapt type
            ttype = r["LinOtpTokenType"]
            if ttype.lower() == "hmac":
                ttype = "HOTP"
            # Adapt resolver
            linotp_resolver = r["LinOtpIdResClass"].split(".")[-1]

            # Adapt resolver type
            resolver_type = ""
            if r["LinOtpIdResClass"]:
                resolver_type = r["LinOtpIdResClass"].split(".")[1]
                resolver_type = resolver_map.get(resolver_type)

            # Adapt tokeninfo
            ti = {}
            if r["LinOtpTokenInfo"]:
                ti = json.loads(r["LinOtpTokenInfo"])

            if config_obj.MIGRATE.get("assignments"):
                user_pin = r["LinOtpTokenPinUser"]
                user_pin_iv = r["LinOtpTokenPinUserIV"]
                # Map the LinOTP-Resolver to the PI-Resolver
                resolver = config_obj.ASSIGNMENTS.get("resolver").get(linotp_resolver)
                if not resolver and linotp_resolver:
                    warnings.append(
                        "No mapping defined for the LinOTP "
                        "resolver: {0!s}".format(linotp_resolver)
                    )
                resolver_type = resolver_type
                user_id = r["LinOtpUserid"]
                if config_obj.ASSIGNMENTS.get("convert_endian"):
                    print(f" +--- converting UUID {user_id!s}")
                    user_id = re.sub(UUID_MATCH_PATTERN, UUID_REPLACE_PATTERN, user_id)
                    print(f"  +-- to              {user_id!s}")
            else:
                user_pin = None
                user_pin_iv = None
                resolver = None
                resolver_type = None
                user_id = None

            key_enc = r["LinOtpKeyEnc"]
            key_iv = r["LinOtpKeyIV"]
            if config_obj.REENCRYPT:
                print(" +--- reencrypting token...")
                key_enc, key_iv = reencrypt(
                    key_enc,
                    key_iv,
                    config_obj.LINOTP_ENC_KEY,
                    config_obj.EDUMFA_ENC_KEY,
                )

            token_values.append(
                dict(
                    description=r["LinOtpTokenDesc"],
                    serial=r["LinOtpTokenSerialnumber"],
                    tokentype=ttype,
                    user_pin=user_pin,
                    user_pin_iv=user_pin_iv,
                    so_pin=r["LinOtpTokenPinSO"],
                    so_pin_iv=r["LinOtpTokenPinSOIV"],
                    pin_seed=r["LinOtpSeed"],
                    pin_hash=r["LinOtpPinHash"],
                    key_enc=key_enc,
                    key_iv=key_iv,
                    maxfail=r["LinOtpMaxFail"],
                    active=r["LinOtpIsactive"],
                    failcount=r["LinOtpFailCount"],
                    count=r["LinOtpCount"],
                    count_window=r["LinOtpCountWindow"],
                    sync_window=r["LinOtpSyncWindow"],
                    # We add the user_id only that we can use it for the tokenowner!
                    user_id=user_id,
                    resolver=resolver,
                )
            )

            if config_obj.MIGRATE.get("tokeninfo") and ti:
                # Add tokeninfo for this token
                for k, v in ti.items():
                    if k in config_obj.MIGRATE.get("tokeninfo_unicode_keys", []):
                        v = v.encode("ascii", "ignore").decode("utf8")
                    tokeninfo_values.append(
                        dict(
                            serial=r["LinOtpTokenSerialnumber"],
                            Key=k,
                            Value=v,
                            token_id=r["LinOtpTokenId"],
                        )
                    )
                    print(f" +--- processing tokeninfo {k!s}")
                if config_obj.NEW_TOKENINFO:
                    print(" +--- processing new tokeninfo")
                    for k, v in config_obj.NEW_TOKENINFO.items():
                        tokeninfo_values.append(
                            dict(
                                serial=r["LinOtpTokenSerialnumber"],
                                Key=k,
                                Value=v,
                                token_id=r["LinOtpTokenId"],
                            )
                        )

        print()
        print(f"Adding {len(token_values)} tokens...")
        # Insert into database without the user_id
        insert_chunks(
            conn_pi,
            token_table,
            [dict_without_keys(d, ["user_id", "resolver"]) for d in token_values],
            config_obj.INSERT_CHUNK_SIZE,
            record_name="token records",
        )

        # fetch the new token_id's in eduMFA and write them to the
        # token serial id map.
        s = select([token_table])
        result = conn_pi.execute(s)
        for r in result:
            token_serial_id_map[r["serial"]] = r["id"]

        # rewrite the id's in the token_values list
        for i in range(0, len(token_values)):
            token_values[i]["id"] = token_serial_id_map[token_values[i]["serial"]]

        if config_obj.MIGRATE.get("tokeninfo"):
            # Now we have to rewrite the token_id in the tokeninfo_values
            for ti in tokeninfo_values:
                ti["token_id"] = token_serial_id_map[ti["serial"]]
                del ti["serial"]

            print(f"Adding {len(tokeninfo_values)} token infos...")
            insert_chunks(
                conn_pi,
                tokeninfo_table,
                tokeninfo_values,
                config_obj.INSERT_CHUNK_SIZE,
                "tokeninfo records",
            )

    if config_obj.MIGRATE.get("assignments"):
        # If the token is assigned, we also need to create an entry for tokenrealm
        # We need to determine the realm_id for this resolver!
        for token in token_values:
            token_id = token.get("id")
            resolver = token.get("resolver")
            user_id = token.get("user_id")
            if resolver and user_id:
                realm = config_obj.ASSIGNMENTS.get("realm").get(resolver)
                realm_id = realm_id_map.get(realm)
                print(
                    "Assigning token {} for resolver {} to realm_id {} "
                    "(realm {})".format(token_id, resolver, realm_id, realm)
                )
                tokenrealm_values.append(dict(token_id=token_id, realm_id=realm_id))

                # Now we need to fill the tokenowner table, so that the tokens are actually
                # assigned to  user
                tokenowner_values.append(
                    dict(
                        token_id=token_id,
                        realm_id=realm_id,
                        resolver=resolver,
                        user_id=user_id,
                    )
                )
            else:
                # The token has no resolver and thus is not assigned
                for tokenrealm in config_obj.ASSIGNMENTS.get("unassigned_tokens", []):
                    realm_id = realm_id_map.get(tokenrealm)
                    if realm_id:
                        tokenrealm_values.append(
                            dict(token_id=token_id, realm_id=realm_id)
                        )

        print(f"Adding {len(tokenrealm_values)} tokenrealms...")
        insert_chunks(
            conn_pi,
            tokenrealm_table,
            tokenrealm_values,
            config_obj.INSERT_CHUNK_SIZE,
            record_name="tokenrealm records",
        )

        print(f"Adding {len(tokenowner_values)} tokenowners...")
        insert_chunks(
            conn_pi,
            tokenowner_table,
            tokenowner_values,
            config_obj.INSERT_CHUNK_SIZE,
            record_name="tokenowner records",
        )

    if warnings:
        print("We need to inform you about the following WARNINGS:")
        for warning in warnings:
            print(warning)


def usage():
    print(
        f"""
edumfa-migrate-linotp.py --generate-example-config [--config <config file>]

    --generate-example-config, -g   Output an example config file. 
                                    This is a JSON file, that needs to be passed
                                    to this command.

    --config, -c <file>             The config file, that contains the complete
                                    configuration.

{__doc__!s}
"""
    )


def read_enckey(encfile):
    with open(encfile, "rb") as f:
        secret = f.read()[:32]
    return secret


def main():
    try:
        opts, args = getopt.getopt(
            sys.argv[1:], "gc:", ["generate-example-config", "config="]
        )
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
            print(f"Unknown parameter: {o!s}")
            sys.exit(3)

    if config_file:
        config_obj = Config(config_file)
        migrate(config_obj)
        sys.exit(0)

    else:
        if not generate_config:
            usage()
            sys.exit(1)


if __name__ == "__main__":
    main()

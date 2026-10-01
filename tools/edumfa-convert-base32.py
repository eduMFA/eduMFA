#!/usr/bin/env python
#
#  2018-07-27 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#             init
__doc__ = """Read a file containing serials and base32 encoded secrets and converting it to hex."""

import argparse
import base64
import binascii
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument(
    "file",
    help='The CSV file with the base32 secrets.You can specify "-" to read from stdin.',
    type=argparse.FileType(),
)
parser.add_argument("-t", "--type", help="The token type (like TOTP)")
parser.add_argument("-d", "--digits", help="The number of digits")
parser.add_argument("-s", "--timestep", help="The timestep (like 30 or 60)")
args = parser.parse_args()

content = args.file.readlines()
for line in content:
    values = [x.strip() for x in line.split(",")]
    if len(values) < 2:
        # not enough data (serial and secret) to process
        continue

    serial = values[0]
    secret = values[1]
    try:
        secret = binascii.hexlify(base64.b32decode(secret))
    except (TypeError, binascii.Error):
        sys.stderr.write(f"Error converting secret of serial {serial}.\n")
        continue

    print(f"{serial}, {secret.decode('utf8')}", end="")

    if args.type:
        print(f", {args.type}", end="")
    elif len(values) > 2:
        print(f", {values[2]}", end="")

    if args.digits:
        print(f", {args.digits}", end="")
    elif len(values) > 3:
        print(f", {values[3]}", end="")

    if args.timestep:
        print(f", {args.timestep}", end="")
    elif len(values) > 4:
        print(f", {values[4]}", end="")

    print()

#!/usr/bin/env python
#
#  2018-05-27 Cornelius Kölbel <cornelius.koelbel@netknights.it>
#

__doc__ = """
You can use this script to update counter values of tokens in the eduMFA
database. This is helpful after database migrations. Counters in the old
instance may have been updated, since users still authenticate against this
old instance. You would simply fetch these updated counters and use this
script to update them in the new eduMFA database.

You can update counters like

edumfa-export-linotp-counter.py -c MIGRATION/linotp.ini  | ./tools/edumfa-update-counter.py -c /etc/edumfa/edumfa.cfg -i -
"""

import argparse
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from edumfa.models import Token


def get_edumfa_uri(config_file):
    with open(config_file) as f:
        content = f.readlines()

    lines = [l.strip() for l in content]
    sql_uri = ""
    for line in lines:
        if line.startswith("SQLALCHEMY_DATABASE_URI"):
            sql_uri = line.split("=", 1)[1].strip().strip("'").strip('"')
    return sql_uri


def read_counter_file(import_file):
    update_list = []
    for line in import_file.readlines():
        try:
            serial, counter = (v.strip() for v in line.split(","))
            update_list.append((f"{serial}", int(counter)))
        except ValueError as ve:
            # If there is a line, that does not comply
            sys.stderr.write(f"Failed to parse line: {line!s}\n")

    return update_list


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-c",
        "--config",
        help="eduMFA config file. We only need the SQLALCHEMY_DATABASE_URI.",
        required=True,
    )
    parser.add_argument(
        "file",
        help="The CSV file with the updated counters. The file should contain one "
        "serial and counter per line split by a comma. "
        'You can specify "-" to read from stdin.',
        type=argparse.FileType(),
    )
    parser.add_argument(
        "-i",
        "--increase-only",
        help="Only update the token counter, if the new counter value "
        "is bigger than the existing in the database.",
        action="store_const",
        const=True,
    )
    args = parser.parse_args()

    # Parse data

    SQL_URI = get_edumfa_uri(args.config)
    counters = read_counter_file(args.file)

    # Start DB stuff

    edumfa_engine = create_engine(SQL_URI)
    edumfa_session = sessionmaker(bind=edumfa_engine)()

    print(f"Starting updating {len(counters)!s} counters:")
    updated = 0
    not_found = 0
    processed = 0
    for count in counters:
        processed += 1
        if args.increase_only:
            r = edumfa_session.query(Token).filter_by(serial=count[0]).first()
            if r and r.count >= count[1]:
                # The counter in the database is bigger
                continue
        sys.stdout.write(f"\r {processed!s}: {count[0]!s}     ")
        r = (
            edumfa_session.query(Token)
            .filter_by(serial=count[0])
            .update({"count": count[1]})
        )
        if r > 0:
            # r==0, if the token was not found!
            updated += 1
        else:
            not_found += 1
        # Depending on the time of running, we might do the session.commit after each update to avoid
        # blocking the Token table.

    edumfa_session.commit()

    print()
    print(f"{processed!s:6} tokens processed.")
    print(f"{updated!s:6} counters updated.")
    print(f"{not_found!s:6} tokens not found.")


if __name__ == "__main__":
    main()

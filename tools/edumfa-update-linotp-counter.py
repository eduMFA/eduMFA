#!/usr/bin/python
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

from sqlalchemy import Boolean, Column, Integer, MetaData, Unicode, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()
metadata = MetaData()


class LinToken(Base):
    __tablename__ = "Token"

    LinOtpTokenId = Column(Integer, primary_key=True, nullable=False)
    LinOtpTokenDesc = Column(Unicode(80), default="")
    LinOtpTokenSerialnumber = Column(
        Unicode(40), default="", unique=True, nullable=False, index=True
    )
    LinOtpTokenType = Column(Unicode(30), default="HMAC", index=True)
    LinOtpTokenInfo = Column(Unicode(2000), default="")
    LinOtpTokenPinUser = Column(Unicode(512), default="")
    LinOtpTokenPinUserIV = Column(Unicode(32), default="")
    LinOtpTokenPinSO = Column(Unicode(512), default="")
    LinOtpTokenPinSOIV = Column(Unicode(32), default="")
    LinOtpIdResolver = Column(Unicode(120), default="", index=True)
    LinOtpIdResClass = Column(Unicode(120), default="")
    LinOtpUserid = Column(Unicode(320), default="", index=True)
    LinOtpSeed = Column(Unicode(32), default="")
    LinOtpOtpLen = Column(Integer, default=6)
    LinOtpPinHash = Column(Unicode(512), default="")
    LinOtpKeyEnc = Column(Unicode(1024), default="")
    LinOtpKeyIV = Column(Unicode(32), default="")
    LinOtpMaxFail = Column(Integer, default=10)
    LinOtpIsactive = Column(Boolean(), default=True)
    LinOtpFailCount = Column(Integer, default=0)
    LinOtpCount = Column(Integer, default=0)
    LinOtpCountWindow = Column(Integer, default=10)
    LinOtpSyncWindow = Column(Integer, default=1000)


def get_linotp_uri(config_file):
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
        help="The CSV file with the updated counters. The file should contain one serial and "
        'counter per line split by a comma. You can specify "-" to read from stdin.',
        type=argparse.FileType(),
    )
    parser.add_argument(
        "-i",
        "--increase-only",
        help="Only update the token counter, if the new counter value"
        "is bigger than the existing in the database.",
        action="store_const",
        const=True,
    )
    args = parser.parse_args()

    # Parse data

    SQL_URI = get_linotp_uri(args.config)
    counters = read_counter_file(args.file)

    # Start DB stuff

    linotp_engine = create_engine(SQL_URI)
    linotp_session = sessionmaker(bind=linotp_engine)()

    print(f"Starting updating {len(counters)!s} counters:")
    updated = 0
    not_found = 0
    processed = 0
    unknown_tokens = []
    for count in counters:
        processed += 1
        if args.increase_only:
            r = (
                linotp_session.query(LinToken)
                .filter_by(LinOtpTokenSerialnumber=count[0])
                .first()
            )
            if r and r.LinOtpCount >= count[1]:
                # The counter in the database is bigger
                continue
        sys.stdout.write(f"\r {processed!s}: {count[0]!s}     ")
        r = (
            linotp_session.query(LinToken)
            .filter_by(LinOtpTokenSerialnumber=count[0])
            .update({"LinOtpCount": count[1]})
        )
        if r > 0:
            # r==0, if the token was not found!
            updated += 1
        else:
            not_found += 1
            unknown_tokens.append(count[0])
        # Depending on the time of running, we might do the session.commit after each update to avoid
        # blocking the Token table.

    linotp_session.commit()

    print()
    print(f"{processed!s:6} tokens processed.")
    print(f"{updated!s:6} counters updated.")
    print(f"{not_found!s:6} tokens not found.")
    print(f"List of unknown tokens: {unknown_tokens!s}")


if __name__ == "__main__":
    main()

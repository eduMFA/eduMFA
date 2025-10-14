"""Extend mfa_audit.user and mfa_audit.administrator to 64 characters.

The number for the "existing_type" does not have an effect: no matter if it is
larger or smaller, it will be changed to have a length of 64 chars.
This will fail on upgrade if there are existing entries longer than 64
characters. This will also fail on downgrade if any existing entry is longer than 20
characters.

Revision ID: a844dc0c3fb9
Revises: 414079706620
Create Date: 2025-08-01 14:06:18.532560

"""

# revision identifiers, used by Alembic.
revision = "a844dc0c3fb9"
down_revision = "414079706620"

import sqlalchemy as sa
from alembic import op


def upgrade():
    print("Setting mfa_audit.user to a maximum of 64 characters")
    op.alter_column(
        "mfa_audit",
        "user",
        existing_type=sa.Unicode(length=20),
        type_=sa.Unicode(length=64),
        existing_nullable=True,
    )
    print("Setting mfa_audit.administrator to a maximum of 64 characters")
    op.alter_column(
        "mfa_audit",
        "administrator",
        existing_type=sa.Unicode(length=20),
        type_=sa.Unicode(length=64),
        existing_nullable=True,
    )


def downgrade():
    print("Resetting mfa_audit.user to a maximum of 20 characters")
    op.alter_column(
        "mfa_audit",
        "user",
        existing_type=sa.Unicode(length=64),
        type_=sa.Unicode(length=20),
        existing_nullable=True,
    )
    print("Resetting mfa_audit.administrator to a maximum of 20 characters")
    op.alter_column(
        "mfa_audit",
        "administrator",
        existing_type=sa.Unicode(length=64),
        type_=sa.Unicode(length=20),
        existing_nullable=True,
    )

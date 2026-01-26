"""Extend mfa_audit.info and mfa_audit.action_detail to 128 characters.

info: Some default messages exceed the current 50 char limit, e.g. the webauthn
challenge texts or the import of tokens. Depending on the file name, the
latter might exceed 100 characters.
action_detail: The fudispasskeys event generates a 77 character long message.

Revision ID: 2a74c6522937
Revises: a844dc0c3fb9
Create Date: 2025-11-25 11:26:20.567441

"""

# revision identifiers, used by Alembic.
revision = "2a74c6522937"
down_revision = "a844dc0c3fb9"

import sqlalchemy as sa
from alembic import op


def upgrade():
    print("Setting mfa_audit.info to a maximum of 128 characters")
    op.alter_column(
        "mfa_audit",
        "info",
        existing_type=sa.Unicode(length=50),
        type_=sa.Unicode(length=128),
        existing_nullable=True,
    )
    print("Setting mfa_audit.action_detail to a maximum of 128 characters")
    op.alter_column(
        "mfa_audit",
        "action_detail",
        existing_type=sa.Unicode(length=50),
        type_=sa.Unicode(length=128),
        existing_nullable=True,
    )


def downgrade():
    op.alter_column(
        "mfa_audit",
        "info",
        existing_type=sa.Unicode(length=128),
        type_=sa.Unicode(length=50),
        existing_nullable=True,
    )
    op.alter_column(
        "mfa_audit",
        "action_detail",
        existing_type=sa.Unicode(length=128),
        type_=sa.Unicode(length=50),
        existing_nullable=True,
    )

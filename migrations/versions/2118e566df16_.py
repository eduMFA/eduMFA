"""Add timeout to SMTP server definition

Revision ID: 2118e566df16
Revises: 14a1bcb10018
Create Date: 2018-02-09 08:48:03.308744

"""

# revision identifiers, used by Alembic.
revision = "2118e566df16"
down_revision = "14a1bcb10018"

import sqlalchemy as sa
from alembic import op


def upgrade():
    try:
        op.add_column("smtpserver", sa.Column("timeout", sa.Integer(), nullable=True))
    except Exception as exx:
        print("Could not add column 'smtpserver.timeout'")
        print(exx)


def downgrade():
    op.drop_column("smtpserver", "timeout")

"""SMTP server are identified by their.. identifier. This field is currently not
unique, but is enforced to be unique by application code. This migration makes
sure it is unique at the DB level, too.

Revision ID: 7a1a7108fc01
Revises: 9cad6f046bd2
Create Date: 2026-07-08 13:35:04.279064

"""

# revision identifiers, used by Alembic.
revision = "7a1a7108fc01"
down_revision = "9cad6f046bd2"

import sqlalchemy as sa
from alembic import op


def upgrade():
    op.create_unique_constraint(None, "smtpserver", ["identifier"])


def downgrade():
    op.drop_constraint(None, "smtpserver", type_="unique")

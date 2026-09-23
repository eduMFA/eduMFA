"""Add column 'handle_missing_data' to the policycondition table


Revision ID: 20f39dad5d69
Revises: 1b2262ddbf6b
Create Date: 2025-04-04 09:57:56.313709

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.exc import OperationalError, ProgrammingError

# revision identifiers, used by Alembic.
revision = "20f39dad5d69"
down_revision = "1b2262ddbf6b"


def upgrade():
    op.add_column(
        "policycondition",
        sa.Column("handle_missing_data", sa.Unicode(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("policycondition", "handle_missing_data")

"""v3.12: Add column 'handle_missing_data' to the policycondition table


Revision ID: 5f40baab76ca
Revises: 903a6ed6f6c4
Create Date: 2025-04-04 09:57:56.313709

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.exc import OperationalError, ProgrammingError

# revision identifiers, used by Alembic.
revision = "5f40baab76ca"
down_revision = "903a6ed6f6c4"


def upgrade():
    op.add_column(
        "policycondition",
        sa.Column("handle_missing_data", sa.Unicode(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("policycondition", "handle_missing_data")

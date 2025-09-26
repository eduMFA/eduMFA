"""Add column for triggered policies in Audit Table.

Revision ID: a63df077051a
Revises: d2ae8e54b628
Create Date: 2018-10-31 16:00:49.219821

"""

# revision identifiers, used by Alembic.
revision = "a63df077051a"
down_revision = "d2ae8e54b628"

import sqlalchemy as sa
from alembic import op


def upgrade():
    try:
        op.add_column(
            "pidea_audit", sa.Column("policies", sa.String(length=255), nullable=True)
        )
    except Exception as exx:
        print(f'Adding of column "policies" in table pidea_audit failed: {exx!r}')
        print("This is expected behavior if this column already exists.")


def downgrade():
    op.drop_column("pidea_audit", "policies")

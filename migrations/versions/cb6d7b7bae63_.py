"""Add column used_login to usercache

Revision ID: cb6d7b7bae63
Revises: a63df077051a
Create Date: 2018-12-18 11:59:27.486883

"""

# revision identifiers, used by Alembic.
revision = "cb6d7b7bae63"
down_revision = "a63df077051a"

import sqlalchemy as sa
from alembic import op


def upgrade():
    try:
        op.add_column(
            "usercache", sa.Column("used_login", sa.Unicode(length=64), nullable=True)
        )
        op.create_index(
            op.f("ix_usercache_used_login"), "usercache", ["used_login"], unique=False
        )
    except Exception as exx:
        print(f'Adding of column "used_login" in table usercache failed: {exx!r}')
        print("This is expected behavior if this column already exists.")


def downgrade():
    op.drop_index(op.f("ix_usercache_used_login"), table_name="usercache")
    op.drop_column("usercache", "used_login")

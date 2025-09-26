"""empty message

Revision ID: 414079706620
Revises: 7d82d8b680a9
Create Date: 2024-11-30 13:49:31.091598

"""

# revision identifiers, used by Alembic.
revision = "414079706620"
down_revision = "7d82d8b680a9"

import sqlalchemy as sa
from alembic import op
from sqlalchemy import BigInteger
from sqlalchemy.dialects import mysql, postgresql, sqlite

BigIntegerType = (
    BigInteger()
    .with_variant(postgresql.BIGINT(), "postgresql")
    .with_variant(mysql.BIGINT(), "mysql")
    .with_variant(sqlite.INTEGER(), "sqlite")
)


def upgrade():
    print("Setting mfa_audit.id to bigint")
    op.alter_column(
        "mfa_audit",
        "id",
        existing_type=sa.Integer(),
        type_=BigIntegerType,
        existing_nullable=False,
    )
    print("Setting challenge.id to bigint")
    op.alter_column(
        "challenge",
        "id",
        existing_type=sa.Integer(),
        type_=BigIntegerType,
        existing_nullable=False,
    )
    pass


def downgrade():
    print("Resetting mfa_audit.id to int")
    op.alter_column(
        "mfa_audit",
        "id",
        existing_type=BigIntegerType,
        type_=sa.Integer(),
        existing_nullable=False,
    )
    print("Resetting challenge.id to int")
    op.alter_column(
        "challenge",
        "id",
        existing_type=BigIntegerType,
        type_=sa.Integer(),
        existing_nullable=False,
    )
    pass

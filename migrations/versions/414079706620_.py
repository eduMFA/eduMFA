"""empty message

Revision ID: 414079706620
Revises: 7d82d8b680a9
Create Date: 2024-11-30 13:49:31.091598

"""

# revision identifiers, used by Alembic.
revision = '414079706620'
down_revision = '7d82d8b680a9'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.alter_column('mfa_audit', 'id',
                   existing_type=sa.Integer(),
                   type_=sa.BigInteger(),
                   existing_nullable=False)
    op.alter_column('challenge', 'id',
                   existing_type=sa.Integer(),
                   type_=sa.BigInteger(),
                   existing_nullable=False)
    pass


def downgrade():
    op.alter_column('mfa_audit', 'id',
                   existing_type=sa.BigInteger(),
                   type_=sa.Integer(),
                   existing_nullable=False)
    op.alter_column('challenge', 'id',
                   existing_type=sa.BigInteger(),
                   type_=sa.Integer(),
                   existing_nullable=False)
    pass
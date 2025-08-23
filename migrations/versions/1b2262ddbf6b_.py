"""Decrypt WebAuthn tokens. 

Before this version, WebAuthn tokens were stored in an encrypted format. This migration will decrypt the tokens and store them in a plain format. 
Decrypting the credential id is not really necessary, as it is not sensitive information.

Revision ID: 1b2262ddbf6b
Revises: a844dc0c3fb9
Create Date: 2025-08-23 08:05:06.963794

"""

# revision identifiers, used by Alembic.
revision = '1b2262ddbf6b'
down_revision = 'a844dc0c3fb9'

from alembic import op
import sqlalchemy as sa
from sqlalchemy import orm

from edumfa.models import Token


def upgrade():
    print("Migrating WebAuthn tokens credential_id to an unencrypted format")
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    for token in session.query(Token).filter(Token.tokentype == 'webauthn').all():
        token.set_otpkey(token.get_otpkey().getKey(), encrypted=False)
        session.add(token)
    session.commit()


def downgrade():
    print("Migrating WebAuthn tokens credential_id to an encrypted format")
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    for token in session.query(Token).filter(Token.tokentype == 'webauthn').all():
        token.set_otpkey(token.get_otpkey(encrypted=False).getKey())
        session.add(token)
    session.commit()

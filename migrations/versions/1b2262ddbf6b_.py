"""Store the credential id of WebAuthn tokens unencrypted.

The credential id of a WebAuthn token is stored in the otpkey column of the
token table. It is public information (it is sent to the client with every
authentication request), so it does not need to be protected. Decrypting it on
every authentication is nevertheless expensive, especially with many WebAuthn
tokens or a hardware security module.

This migration decrypts the otpkey of all existing WebAuthn tokens and stores it
in plain text. An empty IV marks the otpkey as unencrypted. The downgrade
encrypts the credential ids again.

The security module (encryption key or HSM) must be available while running
this migration. Tokens that can not be decrypted are reported and skipped. They
keep working, since the credential id is decrypted transparently in that case.

Revision ID: 1b2262ddbf6b
Revises: 9cad6f046bd2
Create Date: 2025-08-23 08:05:06.963794

"""

# revision identifiers, used by Alembic.
revision = "1b2262ddbf6b"
down_revision = "9cad6f046bd2"

import binascii
import sys

import sqlalchemy as sa
from alembic import op

from edumfa.lib.crypto import decrypt, encrypt, get_hsm, geturandom
from edumfa.lib.utils import hexlify_and_unicode, to_unicode

token_table = sa.table(
    "token",
    sa.column("id", sa.Integer),
    sa.column("tokentype", sa.Unicode),
    sa.column("key_enc", sa.Unicode),
    sa.column("key_iv", sa.Unicode),
)


def _get_webauthn_tokens(connection: sa.engine.Connection) -> list[tuple[int, str, str]]:
    """
    Return the id, key_enc and key_iv of all WebAuthn tokens, ordered by id.
    """
    stmt = (
        sa.select(token_table.c.id, token_table.c.key_enc, token_table.c.key_iv)
        .where(sa.func.lower(token_table.c.tokentype) == "webauthn")
        .order_by(token_table.c.id)
    )
    return connection.execute(stmt).fetchall()



def _set_otpkey(connection: sa.engine.Connection, token_id: int, key_enc: str, key_iv: str) -> None:
    connection.execute(
        sa.update(token_table)
        .where(token_table.c.id == token_id)
        .values(key_enc=key_enc, key_iv=key_iv)
    )



def _is_encrypted(key_iv: str) -> bool:
    return bool(key_iv.strip())


def decrypt_credential_ids(connection: sa.engine.Connection) -> tuple[int, int]:
    """
    Decrypt the otpkey (credential id) of all WebAuthn tokens and store it in
    plain text. Tokens that are already stored unencrypted and tokens that can
    not be decrypted are skipped.

    :param connection: a SQLAlchemy connection
    :return: the number of migrated tokens and the number of failed tokens
    :rtype: tuple[int, int]
    """
    tokens = _get_webauthn_tokens(connection)
    total = len(tokens)
    migrated = failed = 0
    for idx, (token_id, key_enc, key_iv) in enumerate(tokens, start=1):
        if not _is_encrypted(key_iv):
            print(
                f" -> WebAuthn token {token_id} ({idx}/{total}) is already stored unencrypted."
            )
            continue
        print(
            f" -> Decrypting credential id of WebAuthn token {token_id} ({idx}/{total})"
        )
        try:
            credential_id = decrypt(
                binascii.unhexlify(key_enc or ""), binascii.unhexlify(key_iv)
            )
        except Exception as e:
            failed += 1
            print(
                f" -> ERROR: Could not decrypt the credential id of WebAuthn token {token_id}: {e!r}",
                file=sys.stderr,
            )
            continue
        _set_otpkey(connection, token_id, to_unicode(credential_id), "")
        migrated += 1
    return migrated, failed



def encrypt_credential_ids(connection: sa.engine.Connection) -> int:
    """
    Encrypt the plain text otpkey (credential id) of all WebAuthn tokens again.
    Tokens that are already stored encrypted are skipped.

    :param connection: a SQLAlchemy connection
    :return: the number of migrated tokens
    :rtype: int
    """
    tokens = _get_webauthn_tokens(connection)
    total = len(tokens)
    migrated = 0
    for idx, (token_id, key_enc, key_iv) in enumerate(tokens, start=1):
        if _is_encrypted(key_iv):
            print(
                f" -> WebAuthn token {token_id} ({idx}/{total}) is already stored encrypted."
            )
            continue
        print(
            f" -> Encrypting credential id of WebAuthn token {token_id} ({idx}/{total})"
        )
        iv = geturandom(16)
        _set_otpkey(
            connection, token_id, encrypt(key_enc or "", iv), hexlify_and_unicode(iv)
        )
        migrated += 1
    return migrated


def upgrade():
    print("Storing the credential id of WebAuthn tokens unencrypted")
    # Fail early with a meaningful error, if the security module is not ready.
    get_hsm()
    migrated, failed = decrypt_credential_ids(op.get_bind())
    print(f" -> Decrypted the credential id of {migrated} WebAuthn token(s).")
    if failed:
        print(
            f" -> WARNING: The credential id of {failed} WebAuthn token(s) could not be "
            "decrypted. These tokens keep their encrypted credential id and continue "
            "to work.",
            file=sys.stderr,
        )


def downgrade():
    print("Encrypting the credential id of WebAuthn tokens")
    get_hsm()
    migrated = encrypt_credential_ids(op.get_bind())
    print(f" -> Encrypted the credential id of {migrated} WebAuthn token(s).")

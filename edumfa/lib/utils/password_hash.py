import bcrypt

from edumfa.lib.utils import to_bytes


def verify_with_crypt_context(crypt_context, password, password_hash):
    """
    Verify password hashes using passlib CryptContext.

    Falls back to bcrypt directly for bcrypt hashes to work around passlib
    compatibility issues with bcrypt>=5.
    """

    try:
        return crypt_context.verify(password, password_hash)
    except ValueError:
        if crypt_context.identify(password_hash) != "bcrypt":
            raise

        password_bytes = to_bytes(password)[:72]
        hash_bytes = to_bytes(password_hash)
        return bcrypt.checkpw(password_bytes, hash_bytes)

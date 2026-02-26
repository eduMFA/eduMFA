import bcrypt

from edumfa.lib.utils import to_bytes


def verify_with_crypt_context(
    crypt_context,
    password: str | bytes,
    password_hash: str | bytes,
) -> bool:
    """
    Verify password hashes using passlib CryptContext.

    Falls back to bcrypt directly for bcrypt hashes to work around passlib
    compatibility issues with bcrypt>=5.

    :param crypt_context: passlib crypt context used for verification
    :type crypt_context: passlib.context.CryptContext
    :param password: plaintext password to verify
    :type password: str | bytes
    :param password_hash: encoded password hash from storage
    :type password_hash: str | bytes
    :return: True if the password matches, otherwise False
    :rtype: bool
    """

    try:
        return crypt_context.verify(password, password_hash)
    except ValueError:
        if crypt_context.identify(password_hash) != "bcrypt":
            raise

        password_bytes = to_bytes(password)[:72]
        hash_bytes = to_bytes(password_hash)
        return bcrypt.checkpw(password_bytes, hash_bytes)

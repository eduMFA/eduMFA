from os import getenv


def _getenv(key: str, default: str | None = None) -> str:
    """
    Get an environment variable and raise an exception if it does not exist and
    no default is given.

    :param key: The environment variable to get.
    :param default: The value to return if the environment variable doesn't
        exist.
    :return: The environment variable's value or the default if given.
    :raises ValueError: If the variable is not set and there is no default
        value.
    """
    value = getenv(key, default)
    if not value:
        raise ValueError(f"Environment variable '{key}' not set! Can't start...")
    else:
        return value


SQLALCHEMY_DATABASE_URI = f"{_getenv('DB_DRIVER')}://{_getenv('DB_USER')}:{_getenv('DB_PASSWORD')}@{_getenv('DB_HOSTNAME')}/{_getenv('DB_DATABASE')}"
SUPERUSER_REALM = _getenv("SUPERUSER_REALM", "super,administrators").split(",")
SECRET_KEY = _getenv("SECRET_KEY")
EDUMFA_PEPPER = _getenv("EDUMFA_PEPPER")
EDUMFA_ENCFILE = "/etc/edumfa/enckey"
EDUMFA_AUDIT_KEY_PRIVATE = "/etc/edumfa/private.pem"
EDUMFA_AUDIT_KEY_PUBLIC = "/etc/edumfa/public.pem"
EDUMFA_LOGFILE = "/var/log/edumfa/edumfa.log"
EDUMFA_LOGCONFIG = "/etc/edumfa/logging.yml"
EDUMFA_UI_DEACTIVATED = _getenv("EDUMFA_UI_DEACTIVATED", "False") == "True"
EDUMFA_AUDIT_SQL_TRUNCATE = True

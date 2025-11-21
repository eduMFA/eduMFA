from os import getenv


def get_content_from_file(path: str) -> str:
    """Return the content from a path. Strip newlines.

    :param path: The path to read the file from.
    :return: The content of the file stripped of newlines.
    :raises FileNotFoundError: If the file at path can't be found.
    """
    with open(path) as fp:
        content = fp.read()
    # remove any leading/trailing newlines
    content = content.strip("\n")
    return content


def _getenv(key: str, default: str | None) -> str:
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


def get_var(key: str, default: str | None = None) -> str:
    """
    Decide whether to get the variable from the environment or a file,
    depending on if there is a environment variable with a _PATH-suffix
    which overrides the environment variable without it.

    :param key: The environment variable to get.
    :param default: The value to return if the environment variable doesn't
        exist.
    :return: The variable's value or the default if given.
    :raises ValueError: If the variable is not set and there is no default
        value.
    """
    variable_with_path_value = getenv(f"{key}_PATH")
    if variable_with_path_value:
        return get_content_from_file(variable_with_path_value)
    else:
        return _getenv(key, default)


SQLALCHEMY_DATABASE_URI = f"{get_var('DB_DRIVER')}://{get_var('DB_USER')}:{get_var('DB_PASSWORD')}@{get_var('DB_HOSTNAME')}/{get_var('DB_DATABASE')}"
SUPERUSER_REALM = get_var("SUPERUSER_REALM", "super,administrators").split(",")
SECRET_KEY = get_var("SECRET_KEY")
EDUMFA_PEPPER = get_var("EDUMFA_PEPPER")
EDUMFA_ENCFILE = "/etc/edumfa/enckey"
EDUMFA_AUDIT_KEY_PRIVATE = "/etc/edumfa/private.pem"
EDUMFA_AUDIT_KEY_PUBLIC = "/etc/edumfa/public.pem"
EDUMFA_LOGFILE = "/var/log/edumfa/edumfa.log"
EDUMFA_LOGCONFIG = "/etc/edumfa/logging.yml"
EDUMFA_UI_DEACTIVATED = get_var("EDUMFA_UI_DEACTIVATED", "False") == "True"
EDUMFA_AUDIT_SQL_TRUNCATE = True

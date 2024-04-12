# -*- coding: utf-8 -*-

import os
import logging
import secrets
import string
log = logging.getLogger(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
basedir = "/".join(basedir.split("/")[:-1]) + "/"


pubtest_key = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0stF+PVh/qR7I82ywgDW
X2rPxKnlBugU33SAbxZjfNz+aKYYM+irKJ0IdTOLtQ85DzZaEhocqO7cg1Qw85Ac
gU8NEIUdRQdHilO558Mc/E95jDeiI7AbzuLlG2gFyMHkObqwoA2N9ARk9vck+pIo
gCVhZfHs+ifRqdOMzbGNtWp8XGwpp9YLEFTZ2ZBloWJ6kkijatXwY5nTlP5ugbEU
cKMamksTyvRdZFryKwK3HfAQoL6fJAfB3u4NVp5nfcuD180MKcGk8CR9zwuXkRX5
m+qnl1W6iD0z5ws/SrtWBJiMuFm3hGaXdQLZVABSqgmvaru3GZbldlQU/0pcV855
NwIDAQAB
-----END PUBLIC KEY-----"""

non_matchin_pubkey = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0R9Nos93gt6JdiY/Q+ac
WuukYcwr+JlCDa+RX8UDuKfF3wVkSjwAl6s3ADrEnRIgi9qCQD52o29YEVugftVh
HKiC+Gw5Cf95hkWKLl1MFoI6JUMDnNtPlPJrsCwLCi79TV+24BZ0v19P9ivxDa+c
bHUR+vUHbvYfhzpf5Zq8gHTNEQda6+ufcC48VjCdJwOiJJcjNZMZhYrQBoYyCHxm
HUb6rdpz/AsBSMV3+kZiDqv/NA5dgR8dXAK2or8JSK/ghw8c3qgt+yLW+1g9FDao
6Bn6LrQkUkMv/cANYsiVk/pnxtsb11cEbYNyv2VQd/lbCCMwK/rkuipZxu8XJl6g
WQIDAQAB
-----END PUBLIC KEY-----
"""


def _random_password(size):
    log.info("SECRET_KEY not set in config. Generating a random key.")
    passwd = [secrets.choice(string.ascii_lowercase + \
                             string.ascii_uppercase + string.digits) for _x in range(size)]
    return "".join(passwd)


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    # SQL_ALCHEMY_DATABASE_URI = "mysql://privacyidea:XmbSrlqy5d4IS08zjz"
    # "GG5HTt40Cpf5@localhost/privacyidea"
    EDUMFA_ENCFILE = os.path.join(basedir, "tests/testdata/enckey")
    EDUMFA_HSM = "default"
    EDUMFA_AUDIT_MODULE = "edumfa.lib.auditmodules.sqlaudit"
    EDUMFA_AUDIT_KEY_PRIVATE = os.path.join(basedir, "tests/testdata/private.pem")
    EDUMFA_AUDIT_KEY_PUBLIC = os.path.join(basedir, "tests/testdata/public.pem")
    EDUMFA_LOGFILE = "edumfa.log"
    EDUMFA_LOGLEVEL = logging.INFO
    CACHE_TYPE = "simple"
    EDUMFA_EXTERNAL_LINKS = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # EDUMFA_GNUPG_HOME = "gpg"
    # EDUMFA_LOGO = "otherlogo.png"
    # EDUMFA_AUDIT_SQL_URI = sqlite://
    EDUMFA_VASCO_LIBRARY = None
    EDUMFA_CUSTOM_CSS = False


class DevelopmentConfig(Config):
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY') or 't0p s3cr3t'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'data-dev.sqlite')
    EDUMFA_LOGLEVEL = logging.DEBUG
    EDUMFA_TRANSLATION_WARNING = "[Missing]"


class TestingConfig(Config):
    TESTING = True
    # This is used to encrypt the auth token
    SUPERUSER_REALM = ['adminrealm']
    SECRET_KEY = 'secret'  # nosec B105 # used for testing
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'data-test.sqlite')
    # This is used to encrypt the admin passwords
    EDUMFA_PEPPER = ""
    # This is only for testing encrypted files
    EDUMFA_ENCFILE_ENC = "tests/testdata/enckey.enc"
    EDUMFA_LOGLEVEL = logging.INFO
    EDUMFA_GNUPG_HOME = "tests/testdata/gpg"
    EDUMFA_AUDIT_SQL_TRUNCATE = True
    CACHE_TYPE = "None"
    EDUMFA_SCRIPT_HANDLER_DIRECTORY = "tests/testdata/scripts/"
    EDUMFA_NOTIFICATION_HANDLER_SPOOLDIRECTORY = "tests/testdata/"
    EDUMFA_NODE = "Node1"
    EDUMFA_NODES = ["Node1", "Node2"]
    EDUMFA_ENGINE_REGISTRY_CLASS = "null"
    EDUMFA_TRUSTED_JWT = [{"public_key": pubtest_key,
                       "algorithm": "HS256",
                       "role": "user",
                       "realm": "realm1",
                       "username": "userA",
                       "resolver": "resolverX"},
                      {"public_key": non_matchin_pubkey,
                       "algorithm": "RS256",
                       "role": "user",
                       "realm": "realm1",
                       "username": "userA",
                       "resolver": "resolverX"},
                      {"public_key": pubtest_key,
                       "algorithm": "RS256",
                       "role": "user",
                       "realm": "realmX",
                       "resolver": "resolverX",
                       "username": "h.*s"},
                      {"public_key": pubtest_key,
                       "algorithm": "RS256",
                       "role": "user",
                       "realm": "realm1",
                       "username": "userA",
                       "resolver": "resolverX"}]


class AltUIConfig(TestingConfig):
    EDUMFA_INDEX_HTML = "testui.html"
    EDUMFA_STATIC_FOLDER = "../tests/testdata/altstatic"
    EDUMFA_TEMPLATE_FOLDER = "../tests/testdata/altstatic/templates"


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'data.sqlite')
    #SQLALCHEMY_DATABASE_URI = "mysql://pi2:pi2@localhost/pi2"
    # This is used to encrypt the auth_token
    SECRET_KEY = os.environ.get('SECRET_KEY') or _random_password(24)
    # This is used to encrypt the admin passwords
    EDUMFA_PEPPER = "Never know..."
    # This is used to encrypt the token data and token passwords
    EDUMFA_ENCFILE = os.path.join(basedir, "enckey")
    # This is used to sign the audit log
    EDUMFA_AUDIT_KEY_PRIVATE = os.path.join(basedir, "private.pem")
    EDUMFA_AUDIT_KEY_PUBLIC = os.path.join(basedir, "public.pem")
    EDUMFA_LOGLEVEL = logging.INFO
    SUPERUSER_REALM = ['superuser']


class HerokuConfig(Config):
    SQLALCHEMY_DATABASE_URI = "postgres://mvfkmtkwzuwojj:" \
                              "wqy_btZE3CPPNWsmkfdmeorxy6@" \
                              "ec2-54-83-0-61.compute-1." \
                              "amazonaws.com:5432/d6fjidokoeilp6"
    #SQLALCHEMY_DATABASE_URI = "mysql://pi2:pi2@localhost/pi2"
    # This is used to encrypt the auth_token
    SECRET_KEY = os.environ.get('SECRET_KEY') or 't0p s3cr3t'
    # This is used to encrypt the admin passwords
    EDUMFA_PEPPER = "Never know..."
    # This is used to encrypt the token data and token passwords
    EDUMFA_ENCFILE = os.path.join(basedir, "deploy/heroku/enckey")
    # This is used to sign the audit log
    EDUMFA_AUDIT_KEY_PRIVATE = os.path.join(basedir,
                                        "deploy/heroku/private.pem")
    EDUMFA_AUDIT_KEY_PUBLIC = os.path.join(basedir, "deploy/heroku/public.pem")
    SUPERUSER_REALM = ['superuser']


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
    'heroku': HerokuConfig,
    'altUI': AltUIConfig
}

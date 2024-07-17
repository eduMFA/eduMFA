# -*- coding: utf-8 -*-
from setuptools import setup, find_packages, find_namespace_packages
import os
import stat
import sys

VERSION = "2.2.0"

# Taken from kennethreitz/requests/setup.py
package_directory = os.path.realpath(os.path.dirname(__file__))


def get_file_contents(file_path):
    """Get the context of the file using full path name."""
    content = ""
    try:
        full_path = os.path.join(package_directory, file_path)
        content = open(full_path, 'r').read()
    except:
        print("### could not open file {0!r}".format(file_path), file=sys.stderr)
    return content


def get_file_list(file_path):
    full_path = os.path.join(package_directory, file_path)
    file_list = os.listdir(full_path)
    # Filter out __pycache__
    file_list = [x for x in file_list if "__pycache__" not in x]
    # now we need to add the path to the files
    return [file_path + f for f in file_list]


install_requires = [
    "Flask-Babel==4.0.0",
    "Flask-Migrate==4.0.7",
    "Flask-SQLAlchemy==3.1.1",
    "Flask-Versioned==0.9.4-20101221",
    "Flask==3.0.3",
    "PyJWT==2.8.0",
    "PyMySQL==1.1.1",
    "PyYAML==6.0.1",
    "SQLAlchemy==2.0.31",
    "argon2_cffi==23.1.0",
    "beautifulsoup4[lxml]==4.12.3",
    "cbor2==5.6.4",
    "configobj==5.0.8",
    "croniter==2.0.7",
    "cryptography==42.0.8",
    "defusedxml==0.7.1",
    "google-auth==2.32.0",
    "grpcio==1.64.1",
    "huey[redis]==2.5.1",
    "importlib_metadata==8.0.0",
    "ldap3==2.9.1",
    "lxml==5.2.2",
    "netaddr==1.3.0",
    "passlib[bcrypt]==1.7.4",
    "pyOpenSSL==24.1.0",
    "pydash==8.0.1",
    "pyrad==2.4",
    "python-dateutil==2.9.0.post0",
    "python-gnupg==0.5.2",
    "requests==2.32.3",
    "segno==1.6.1",
    "smpplib==2.2.3",
    "typing-extensions==4.12.2",
    "pyasn1==0.6.0",
    "urllib3==2.2.2",
]


def get_man_pages(dir):
    """
    Get man pages in a directory.
    :param dir:
    :return: list of file names
    """
    files = os.listdir(dir)
    r_files = []
    for file in files:
        if file.endswith(".1"):
            r_files.append(dir + "/" + file)
    return r_files


def get_scripts(dir):
    """
    Get files that are executable
    :param dir:
    :return: list of file names
    """
    files = os.listdir(dir)
    r_files = []
    for file in files:
        if os.stat(dir + "/" + file)[stat.ST_MODE] & stat.S_IEXEC:
            r_files.append(dir + "/" + file)
    return r_files


setup(
    name='edumfa',
    version=VERSION,
    description='eduMFA: identity, multifactor authentication (OTP), authorization, audit',
    author='edumfa.io',
    license='AGPLv3',
    author_email='edumfa@listserv.dfn.de',
    url='https://www.edumfa.io',
    keywords='OTP, two factor authentication, management, security',
    python_requires='>=3.8',
    packages=find_namespace_packages(),
    package_data={
        'edumfa.translations': ["*", "**/*"],
        'edumfa.static': ["*", "**/*"],
    },
    scripts=get_scripts("tools"),
    entry_points={
        'console_scripts': [
            'edumfa-manage = edumfa.commands.manage.main:cli'
        ]
    },
    extras_require={
        'doc': [
            "Pallets-Sphinx-Themes==2.1.3",
            "Sphinx==7.4.5",
            "sphinxcontrib-httpdomain==1.8.1",
            "sphinxcontrib-plantuml==0.30",
            "sphinxcontrib-spelling==8.0.0"
        ],
        'test': [
            "mock==5.1.0",
            "pytest==8.2.2",
            "pytest-cov==5.0.0",
            "responses==0.25.3",
            "testfixtures==8.3.0"
        ],
        'postgres': ['psycopg2==2.9.9'],
        'hsm': ['PyKCS11==1.5.16'],
        'kerberos': ['gssapi==1.8.3']
    },
    install_requires=install_requires,
    data_files=[
        ('etc/edumfa/', ['deploy/apache/edumfaapp.wsgi', 'deploy/edumfa/dictionary']),
        ('share/man/man1', get_man_pages("tools")),
        ('lib/edumfa/migrations', ["migrations/alembic.ini", "migrations/env.py", "migrations/README", "migrations/script.py.mako"]),
        ('lib/edumfa/migrations/versions', get_file_list("migrations/versions/")),
        ('lib/edumfa/', ['requirements.txt'])
    ],
    classifiers=[
        "Framework :: Flask",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Programming Language :: Python",
        "Development Status :: 5 - Production/Stable",
        "Topic :: Internet",
        "Topic :: Security",
        "Topic :: System :: Systems Administration :: Authentication/Directory",
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12'
    ],
    zip_safe=False,
    long_description=get_file_contents('README.rst')
)

eduMFA
===========

.. image:: https://codecov.io/gh/eduMFA/eduMFA/coverage.svg?branch=main
    :target: https://codecov.io/gh/eduMFA/eduMFA?branch=main

.. image:: https://img.shields.io/pypi/v/eduMFA.svg
    :alt: Latest Version
    :target: https://pypi.python.org/pypi/eduMFA/#history

.. image:: https://img.shields.io/pypi/pyversions/edumfa.svg
    :alt: PyPI - Python Version
    :target: https://pypi.python.org/pypi/edumfa/

.. image:: https://img.shields.io/github/license/edumfa/edumfa.svg
    :alt: License
    :target: https://pypi.python.org/pypi/edumfa/
    
.. image:: https://readthedocs.org/projects/edumfa/badge/?version=latest
    :alt: Documentation
    :target: http://edumfa.readthedocs.org/en/latest/

    
eduMFA is an open solution for strong two-factor authentication like
OTP tokens, SMS, smartphones or SSH keys.
Using eduMFA you can enhance your existing applications like local login
(PAM, Windows Credential Provider), 
VPN, remote access, SSH connections, access to websites or web portals with
a second factor during authentication. Thus boosting the security of your 
existing applications.

The project eduMFA is based on the privacyIDEA Project and aims to provide up-to-date multifactor authentication for academic institutions.

Overview
========

eduMFA runs as an additional service in your network, and you can connect different
applications to eduMFA.

eduMFA does not bind you to any decision of the authentication
protocol, nor does it dictate you where your user information should be
stored. This is achieved by its totally modular architecture.
eduMFA is not only open as far as its modular architecture is
concerned. But eduMFA is completely licensed under the AGPLv3.

It supports a wide variety of authentication devices like OTP tokens 
(HMAC, HOTP, TOTP, OCRA, mOTP), Yubikey (HOTP, TOTP, AES), FIDO U2F, as well
as FIDO2 WebAuthn devices like Yubikey and Plug-Up, smartphone Apps like Google
Authenticator, FreeOTP, Token2  or TiQR, SMS, Email, SSH keys, x509 certificates
and Registration Codes for easy deployment.

eduMFA is based on Flask and SQLAlchemy as the python backend. The
web UI is based on angularJS and bootstrap.
A MachineToken design lets you assign tokens to machines. Thus, you can use
your Yubikey to unlock LUKS, assign SSH keys to SSH servers or use Offline OTP
with PAM.



Setup
=====

For setting up the system to *run* it, please read install instructions 
at `edumfa.readthedocs.io <http://edumfa.readthedocs.io/en/latest/installation/index.html>`_.

If you want to setup a development environment start like this::

    git clone https://github.com/edumfa/edumfa.git
    cd edumfa
    virtualenv venv
    source venv/bin/activate
    pip install .
    
.. _testing_env:

You may additionally want to set up your environment for testing, by adding the
additional dependencies::

    pip install .[test]


Getting and updating submodules
===============================

The client-side library for the registering and signing of WebAuthn-Credentials
resides in a submodule.

To fetch all submodules for this repository, run::

   git submodule update --init --recursive

When pulling changes from upstream later, you can automatically update any outdated
submodules, by running::

   git pull --recurse-submodules

Running it
==========

First You need to create a `config-file <https://edumfa.readthedocs.io/en/latest/installation/system/inifile.html>`_.

Then create the database tables and the encryption key::

    ./edumfa-manage create_tables
    ./edumfa-manage create_enckey

If You want to keep the development database upgradable, You should `stamp
<https://edumfa.readthedocs.io/en/latest/installation/upgrade.html>`_ it
to simplify updates::

    ./edumfa-manage db stamp head -d migrations/

Create the key for the audit log::

    ./edumfa-manage create_audit_keys

Create the first administrator::

    ./edumfa-manage admin add <username>

Run it::

    ./edumfa-manage runserver

Now you can connect to ``http://localhost:5000`` with your browser and login
as administrator.

Run tests
=========

If you have followed the steps above to set up your
`environment for testing <#testing-env>`__, running the test suite should be as
easy as running `pytest <http://pytest.org/>`_ with the following options::

    python -m pytest -v --cov=eduMFA --cov-report=html tests/

Contributing
============

There are a lot of different ways to contribute to eduMFA, even
if you are not a developer.

If you found a security vulnerability please report it to us using the reporting form provided by GitHub

You can find detailed information about contributing here:
https://github.com/eduMFA/eduMFA/blob/main/CONTRIBUTING.md

Code structure
==============

The database models are defined in ``models.py`` and tested in 
tests/test_db_model.py.

Based on the database models there are the libraries ``lib/config.py`` which is
responsible for basic configuration in the database table ``config``.
And the library ``lib/resolver.py`` which provides functions for the database
table ``resolver``. This is tested in tests/test_lib_resolver.py.

Based on the resolver there is the library ``lib/realm.py`` which provides
functions
for the database table ``realm``. Several resolvers are combined into a realm.

Based on the realm there is the library ``lib/user.py`` which provides functions 
for users. There is no database table user, since users are dynamically read 
from the user sources like SQL, LDAP, SCIM or flat files.

Versioning
==========
eduMFA adheres to `Semantic Versioning <http://semver.org/>`_.

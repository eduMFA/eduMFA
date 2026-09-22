.. _pip_install:

Python Package Index
--------------------

.. index:: pip install, virtual environment

You can install eduMFA usually on any Linux distribution in a python
virtual environment. This way you keep all eduMFA code in one defined
subdirectory.

eduMFA currently runs with Python 3.10 to 3.14. Other
versions either do not work or are not tested.

You first need to install a package for creating a python `virtual environment
<https://virtualenv.pypa.io/en/stable/>`_.

Now you can setup the virtual environment for eduMFA like this::

  virtualenv /opt/edumfa

  cd /opt/edumfa
  source bin/activate

Now you are within the python virtual environment and you can run::

  pip install edumfa

in order to install the latest eduMFA version from
`PyPI <https://pypi.org/project/eduMFA>`_.

Deterministic Installation
^^^^^^^^^^^^^^^^^^^^^^^^^^

Each eduMFA version pins the version of its dependencies. However, those
dependencies have dependencies themselves, and some of those transitive
dependencies do not have their version pinned. This means installing the same
eduMFA version at different points in time can result in a different set of
dependency versions to be installed.

If you want to avoid this and stick to the tested versions at the time of
release, you can now install the pinned and tested versions of the
dependencies::

  pip install -r lib/edumfa/requirements.txt

It would even be safer to install the pinned dependencies *before* installing eduMFA.
So if you e.g. know that you are going to install version 1.2.3 you can run::

    pip install -r https://raw.githubusercontent.com/eduMFA/eduMFA/v1.2.3/requirements.txt
    pip install edumfa==1.2.3

.. _pip_configuration:

Configuration
^^^^^^^^^^^^^

Database
........

Please refer to :ref:`choosing_a_database`. Create a database, as well as a user
with full permissions to that database.

The database server should be installed on the host or be otherwise reachable.

You must then add the database name, user and password to your ``edumfa.cfg``.
See :ref:`cfgfile` for more information on the configuration.

Setting up eduMFA
.................

Additionally to the database connection a new ``EDUMFA_PEPPER`` and ``SECRET_KEY``
must be added to that configuration file in order to secure the installation::

    PEPPER="$(tr -dc A-Za-z0-9_ </dev/urandom | head -c48)"
    echo "EDUMFA_PEPPER = '$PEPPER'" >> /path/to/edumfa.cfg
    SECRET="$(tr -dc A-Za-z0-9_ </dev/urandom | head -c48)"
    echo "SECRET_KEY = '$SECRET'" >> /path/to/edumfa.cfg

An encryption key for encrypting the secrets in the database and a key for
signing the :ref:`audit` log is also needed (the following commands should be
executed inside the virtual environment)::

    edumfa-manage create_enckey  # encryption key for the database
    edumfa-manage create_audit_keys  # key for verification of audit log entries

To create the database tables execute::

    edumfa-manage create_tables

After creating a local administrative user with::

    edumfa-manage admin add <login>

the development server can be started with::

    edumfa-manage runserver

.. warning::
    The development server should not be used for a productive environment.

Webserver
.........

To serve authentication requests and provide the management UI a
`WSGI <https://wsgi.readthedocs.io/en/latest/index.html>`_ capable webserver
like `Apache2 <https://httpd.apache.org/>`_ or `nginx <https://nginx.org/en>`_
is needed.

Setup and configuration of a webserver can be a complex procedure depending on
several parameter (host OS, SSL, internal network structure, ...).
More on the WSGI setup for eduMFA can be found in :ref:`wsgiscript`.

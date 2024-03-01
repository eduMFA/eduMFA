
.. _install_centos:

CentOS Installation
-------------------

Step-by-Step installation on CentOS
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. index:: CentOS, Red Hat, RHEL

In this chapter we describe a way to install eduMFA on CentOS 7 based on the
installation via :ref:`pip_install`. It follows the
approach used in the enterprise packages (See `RPM Repository`_).

.. _centos_setup_services:

Setting up the required services
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

In this guide we use Python 2.7 even though its end-of-life draws closer.
CentOS 7 will support Python 2 until the end of its support frame.
Basically the steps for using eduMFA with Python 3 are the same but several
other packages need to be installed [#py3]_.

First the necessary packages need to be installed::

    $ yum install mariadb-server httpd mod_wsgi mod_ssl python-virtualenv policycoreutils-python

Now enable and configure the services::

    $ systemctl enable --now httpd
    $ systemctl enable --now mariadb
    $ mysql_secure_installation

Setup the database for the eduMFA server::

    $ echo 'create database pi;' | mysql -u root -p
    $ echo 'create user "pi"@"localhost" identified by "<dbsecret>";' | mysql -u root -p
    $ echo 'grant all privileges on pi.* to "pi"@"localhost";' | mysql -u root -p

If this should be a pinned installation (i.e. with all the package pinned to
the versions with which we are developing/testing), some more packages need to
be installed for building these packages::

    $ yum install gcc postgresql-devel

Create the necessary directories::

    $ mkdir /etc/eduMFA
    $ mkdir /opt/eduMFA
    $ mkdir /var/log/eduMFA

Add a dedicated user for the eduMFA server and change some ownerships::

    $ useradd -r -M -d /opt/eduMFA eduMFA
    $ chown eduMFA:eduMFA /opt/eduMFA /etc/eduMFA /var/log/eduMFA

Install the eduMFA server
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Now switch to that user and install the virtual environment for the eduMFA
server::

    $ su - eduMFA

Create the virtual environment::

    $ virtualenv /opt/eduMFA

activate it::

    $ . /opt/eduMFA/bin/activate

and install/update some prerequisites::

    (eduMFA)$ pip install -U pip setuptools

If this should be a pinned installation (that is the environment we use to build and test),
we need to install some pinned dependencies first. They should match the version of the targeted
eduMFA. You can get the latest version tag from the `GitHub release page <https://github
.com/eduMFA/eduMFA/releases>`_ or the `PyPI package history <https://pypi
.org/project/eduMFA/#history>`_ (e.g. "3.3.1")::

        (eduMFA)$ export PI_VERSION=3.3.1
        (eduMFA)$ pip install -r https://raw.githubusercontent.com/eduMFA/eduMFA/v${PI_VERSION}/requirements.txt

Then just install the targeted eduMFA version with::

        (eduMFA)$ pip install eduMFA==${PI_VERSION}

.. _centos_setup_pi:

Setting up eduMFA
^^^^^^^^^^^^^^^^^^^^^^

In order to setup eduMFA a configuration file must be added in
``/etc/eduMFA/edumfa.cfg``. It should look something like this::

    import logging
    # The realm, where users are allowed to login as administrators
    SUPERUSER_REALM = ['super']
    # Your database
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://pi:<dbsecret>@localhost/pi'
    # This is used to encrypt the auth_token
    #SECRET_KEY = 't0p s3cr3t'
    # This is used to encrypt the admin passwords
    #EDUMFA_PEPPER = "Never know..."
    # This is used to encrypt the token data and token passwords
    EDUMFA_ENCFILE = '/etc/eduMFA/enckey'
    # This is used to sign the audit log
    EDUMFA_AUDIT_KEY_PRIVATE = '/etc/eduMFA/private.pem'
    EDUMFA_AUDIT_KEY_PUBLIC = '/etc/eduMFA/public.pem'
    EDUMFA_AUDIT_SQL_TRUNCATE = True
    # The Class for managing the SQL connection pool
    PI_ENGINE_REGISTRY_CLASS = "shared"
    EDUMFA_AUDIT_POOL_SIZE = 20
    EDUMFA_LOGFILE = '/var/log/eduMFA/eduMFA.log'
    EDUMFA_LOGLEVEL = logging.INFO

Make sure the configuration file is not world readable:

.. code-block:: bash

    (eduMFA)$ chmod 640 /etc/eduMFA/edumfa.cfg

More information on the configuration parameters can be found in :ref:`cfgfile`.

In order to secure the installation a new ``EDUMFA_PEPPER`` and ``SECRET_KEY`` must be generated:

.. code-block:: bash

    (eduMFA)$ PEPPER="$(tr -dc A-Za-z0-9_ </dev/urandom | head -c24)"
    (eduMFA)$ echo "EDUMFA_PEPPER = '$PEPPER'" >> /etc/eduMFA/edumfa.cfg
    (eduMFA)$ SECRET="$(tr -dc A-Za-z0-9_ </dev/urandom | head -c24)"
    (eduMFA)$ echo "SECRET_KEY = '$SECRET'" >> /etc/eduMFA/edumfa.cfg

From now on the ``edumfa-manage``-tool can be used to configure and manage the eduMFA server:

.. code-block:: bash

    (eduMFA)$ edumfa-manage create_enckey  # encryption key for the database
    (eduMFA)$ edumfa-manage create_audit_keys  # key for verification of audit log entries
    (eduMFA)$ edumfa-manage create_tables  # create the database structure
    (eduMFA)$ edumfa-manage db stamp head -d /opt/eduMFA/lib/eduMFA/migrations/  # stamp the db

An administrative account is needed to configure and maintain eduMFA:

.. code-block:: bash

    (eduMFA)$ edumfa-manage admin add <admin-user>

Setting up the Apache webserver
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Now We need to set up apache to forward requests to eduMFA, so the next
steps are executed as the ``root``-user again.

First the SELinux settings must be adjusted in order to allow the
``httpd``-process to access the database and write to the eduMFA logfile::

    $ semanage fcontext -a -t httpd_sys_rw_content_t "/var/log/eduMFA(/.*)?"
    $ restorecon -R /var/log/eduMFA

and::

    $ setsebool -P httpd_can_network_connect_db 1

If the user store is an LDAP-resolver, the ``httpd``-process also needs to access
the ldap ports::

    $ setsebool -P httpd_can_connect_ldap 1

If something does not seem right, check for "``denied``" entries in
``/var/log/audit/audit.log``

Some LDAP-resolver could be listening on a different port.
In this case SELinux has to be configured accordingly.
Please check the SELinux audit.log to see if SELinux might block any connection.

For testing purposes we use a self-signed certificate which should already have
been created. In production environments this should be replaced by a certificate
from a trusted authority.

To correctly load the apache config file for eduMFA we need to disable some
configuration first::

    $ cd /etc/httpd/conf.d
    $ mv ssl.conf ssl.conf.inactive
    $ mv welcome.conf welcome.conf.inactive
    $ curl -o eduMFA.conf https://raw.githubusercontent.com/NetKnights-GmbH/centos7/master/SOURCES/eduMFA.conf

In order to avoid recreation of the configuration files during update You can
create empty dummy files for ``ssl.conf`` and ``welcome.conf``.

And we need a corresponding ``wsgi``-script file in ``/etc/eduMFA/``::

    $ cd /etc/eduMFA
    $ curl -O https://raw.githubusercontent.com/NetKnights-GmbH/centos7/master/SOURCES/eduMFAapp.wsgi

If `firewalld` is running (:code:`$ firewall-cmd --state`) You need to open the https
port to allow connections::

    $ firewall-cmd --permanent --add-service=https
    $ firewall-cmd --reload

After a restart of the apache webserver (:code:`$ systemctl restart httpd`)
everything should be up and running.
You can log in with Your admin user at ``https://<eduMFA server>`` and start
enrolling tokens.

.. _rpm_installation:

RPM Repository
~~~~~~~~~~~~~~

.. index:: RPM, YUM

For customers with a valid service level agreement [#SLA]_ with NetKnights
there is an RPM repository,
that can be used to easily install and update eduMFA on CentOS 7 / RHEL 7.
For more information see [#RPMInstallation]_.

.. rubric:: Footnotes

.. [#py3] https://stackoverflow.com/questions/42004986/how-to-install-mod-wgsi-for-apache-2-4-with-python3-5-on-centos-7
.. [#SLA] https://netknights.it/en/leistungen/service-level-agreements/
.. [#RPMInstallation] https://netknights.it/en/additional-service-eduMFA-support-customers-centos-7-repository/

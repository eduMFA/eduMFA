.. _install_docker:

Docker Installation
-------------------

.. index:: docker

eduMFA offers a OCI container image which can be used with different container
engines. The image contains a default logging configuration printing the logs to the
container log, performs database maintenance on start, and runs the application
on port 8000.

This page assumes Docker will be used.  

Prerequisites
.............

Before proceeding, ensure that you have:

1. Docker installed on your system
2. Access to the GitHub container registry

Running eduMFA without compose
..............................

In general, using a compose file as described
:ref:`below <install_docker_compose>` is recommended for maintainability and the
ability to include other services like eduMFA's database. But you can also
create the container directly:

.. code-block:: bash

   docker run -d -p 8000:8000 --name edumfa ghcr.io/edumfa/edumfa:1.2.3

This command will:

- Run the container in detached mode (``-d``)
- Map port 8000 on the host to port 8000 in the container (``-p 8000:8000``)
- Name the container "edumfa" (``--name edumfa``)

Without a configuration, eduMFA will be unable to start though. See
:ref:`docker_config` for your options, the examples below use a configuration
file. You likely also want to mount a volume for the encryption and audit keys
at ``/etc/edumfa/``. Combined this would look like this:

.. code-block:: bash

   docker run -d -p 8000:8000 -v edumfa-keys:/etc/edumfa -e 'EDUMFA_CONFIGFILE=/run/edumfa/edumfa.cfg' -v /path/to/edumfa.cfg:/run/edumfa/edumfa.cfg:ro --name edumfa ghcr.io/edumfa/edumfa:1.2.3

This will create a named volume ``edumfa-keys`` that will contain the
encryption key and the audit key. Make sure to keep them as safe as your
database backups! Without the encryption key, you won't be able to restore them.

Upgrading eduMFA
................

To update eduMFA to a newer version, use the new tag and recreate the container:

.. code-block:: bash

   docker pull ghcr.io/edumfa/edumfa:v1.2.4
   docker stop edumfa
   docker rm edumfa
   docker run -d -p 8000:8000 -v edumfa-keys:/etc/edumfa -e 'EDUMFA_CONFIGFILE=/run/edumfa/edumfa.cfg' -v /path/to/edumfa.cfg:/run/edumfa/edumfa.cfg:ro --name edumfa ghcr.io/edumfa/edumfa:v1.2.4

You can see the list of available tags at `the container registry <https://ghcr.io/edumfa/edumfa>`_.

Running your own scripts
....................

To run your own scripts on startup, put them into the ``/opt/edumfa/user-scripts/`` directory with a ``.sh`` suffix:

.. code-block:: bash

   docker run -d -p 8000:8000 -v /path/to/script.sh:/opt/edumfa/user-scripts/script.sh:ro -v edumfa-keys:/etc/edumfa -e 'EDUMFA_CONFIGFILE=/run/edumfa/edumfa.cfg' -v /path/to/edumfa.cfg:/run/edumfa/edumfa.cfg:ro --name edumfa ghcr.io/edumfa/edumfa:v1.2.4

It will be executed as a bash script before the server process is spawned. It's also possible to execute multiple files by placing multiple scripts with the suffix there [#bashGlobbing]_.

.. _install_docker_compose:

Docker Compose
..............

To avoid the verbosity of ``docker run`` above, you can use a compose file.
Here's a sample ``docker-compose.yml`` file also containing a MariaDB service
using :ref:`environment variable based configuration <docker_config_env>`.

.. code-block:: yaml

   services:
     mariadb:
       image: docker.io/mariadb:lts-noble
       restart: always
       volumes:
         - mariadb-data:/var/lib/mysql:rw
       environment:
         MARIADB_DATABASE: ${MARIADB_DATABASE}
         MARIADB_USER: ${MARIADB_USER}
         MARIADB_PASSWORD: ${MARIADB_PASSWORD}
         MARIADB_ROOT_PASSWORD: ${MARIADB_ROOT_PASSWORD}
       healthcheck:
         test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
         start_period: 10s
         interval: 10s
         timeout: 5s
         retries: 3

     edumfa:
       image: ghcr.io/edumfa/edumfa:1.2.3
       restart: always
       ports:
         - "8000:8000"
       volumes:
         - edumfa-keys:/etc/edumfa/:rw
       environment:
         DB_DRIVER: mysql+pymysql
         DB_HOSTNAME: mariadb
         DB_USER: ${MARIADB_USER}
         DB_PASSWORD: ${MARIADB_PASSWORD}
         DB_DATABASE: ${MARIADB_DATABASE}
         SECRET_KEY: ${EDUMFA_SECRET_KEY}
         EDUMFA_PEPPER: ${EDUMFA_PEPPER}
       depends_on:
         mariadb:
           condition: service_healthy

   volumes:
     edumfa-keys:
     mariadb-data:


The above environment variables would have to be declared in the ``.env`` file.
The database can of course also be located elsewhere, as long as it's reachable.
Adding a reverse proxy is left as an exercise to the reader.


To start eduMFA using Docker Compose, in the same directory run:

.. code-block:: bash

   docker compose up -d

For more information on using eduMFA, please refer to :ref:`first_steps`.

.. _docker_config:

Configuration
.............

There are two ways of configuring eduMFA in the image: via environment variables
or via a classic configuration file. Environment variables simplify
configuration but might not be sufficient for advanced configurations.

.. _docker_config_env:

via environment variables
~~~~~~~~~~~~~~~~~~~~~~~~~

Below are the variables which are available. Those which are not marked as
optional are required for eduMFA to work.

- DB_DATABASE: the database to use on the database system
- DB_DRIVER: The driver for the database system, which is the first part of the :ref:`database_connect` until the colon.
- DB_HOSTNAME: the hostname of the database system
- DB_PASSWORD: the password for DB_USER
- DB_USER: the user on the database system
- SECRET_KEY: the secret key which signs API tokens, should be at least 24 random characters long
- EDUMFA_PEPPER: the pepper to use for password hashing, should be at least 24 random characters long
- EDUMFA_ADMIN_PASS: the password for the local eduMFA admin (optional, default: will be generated)
- EDUMFA_ADMIN_USER: the username for the local eduMFA admin (optional, default: ``admin``)
- EDUMFA_AUDIT_KEY_PRIVATE: an alternative path to the audit key (optional, default: ``/etc/edumfa/private.pem``)
- EDUMFA_AUDIT_KEY_PUBLIC: an alternative path to the audit certificate (optional, default: ``/etc/edumfa/public.pem``)
- EDUMFA_ENCFILE: an alternative path to the enckey (optional, default: ``/etc/edumfa/enckey``)
- EDUMFA_LOGCONFIG: a path to an alternative logging config (optional, default: image provided)
- EDUMFA_UI_DEACTIVATED: whether to disable the WebUI (optional, default: ``False``)
- SUPERUSER_REALM: which realms should be superuser realms (optional, default: ``super,administrators``)
- EDUMFA_CSS: URL of custom css stylesheet (optional)
- EDUMFA_LOGO: filename of custom logo (optional)
- EDUMFA_PAGE_TITLE: custom page title (optional)

You can also add a "_FILE" suffix to each variable name and pass a path to read
the value from a file instead. This is helpful if used with a secret manager
such as Docker Secrets, and is also considered best practice for sensitive data.

For example instead of passing ``SECRET_KEY``:

.. code-block:: bash

   SECRET_KEY_FILE: /etc/edumfa/secret_key.txt

via configuration file
~~~~~~~~~~~~~~~~~~~~~~

Alternatively, you can mount your own ``edumfa.cfg`` instead of configuring
eduMFA via environment variables. To do so, mount it as a file and set the
environment variable ``EDUMFA_CONFIGFILE`` to its path.

.. rubric:: Footnotes

.. [#bashGlobbing] The execution order depends on the way Bash expands ``*.sh``. Read more in the `POSIX specification`_.
.. _POSIX specification: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html#tag_18_13_03

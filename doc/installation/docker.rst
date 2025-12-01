.. _install_docker:

Docker Installation
-------------------

.. index:: docker

eduMFA can be easily deployed using Docker containers. This guide will walk you through the process of installing eduMFA using Docker images from GitHub Registry.

Prerequisites
.............

Before proceeding, ensure that you have:

1. Docker installed on your system
2. Access to GitHub Registry


Docker Compose
..............

For the most setups you should use Docker Compose. Here's a sample `docker-compose.yml` file also containing a mariadb service. 

The container contains a default logging configuration printing the logs to `stdout`, performs database maintanance on start and runs the application on port 8000.

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
       image: ghcr.io/edumfa/edumfa:latest
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
         EDUMFA_ADMIN_USER: ${EDUMFA_ADMIN_USER}
         EDUMFA_ADMIN_PASS: ${EDUMFA_ADMIN_PASS}
         EDUMFA_UI_DEACTIVATED: ${EDUMFA_UI_DEACTIVATED}
       depends_on:
         mariadb:
           condition: service_healthy

   volumes:
     edumfa-keys:
     mariadb-data:


The `.env` file should contain the following variables:

- MARIADB_USER: the MariaDB user
- MARIADB_PASSWORD: the MariaDB password
- MARIADB_DATABASE: the MariaDB database
- MARIADB_ROOT_PASSWORD: the MariaDB root password (not used by eduMFA, required)
- EDUMFA_SECRET_KEY: the secret key which signs API tokens, should be at least 24 random characters long
- EDUMFA_PEPPER: the pepper to use for password hashing, should be at least 24 random characters long
- EDUMFA_ADMIN_USER: the username for the local eduMFA admin (optional)
- EDUMFA_ADMIN_PASS: the password for the local eduMFA admin (optional)
- SUPERUSER_REALM: which realms should be superuser realms (optional)
- EDUMFA_UI_DEACTIVATED: whether to disable the WebUI (optional)

You can also add a "_PATH" suffix to each variable name and pass a path to read the value from a file instead. For example instead of passing `SECRET_KEY`:

.. code-block:: bash

   SECRET_KEY_PATH: /etc/edumfa/secret_key.txt

Alternatively, you can mount your own `edumfa.cfg` instead of configuring eduMFA via environment variables.

To start eduMFA using Docker Compose, run:

.. code-block:: bash

   docker compose up -d

For more information on using eduMFA, please refer to :ref:`first_steps`.

Pulling the eduMFA Docker Image
...............................

To pull the eduMFA Docker image without `docker compose` from GitHub Registry, use the following command:

.. code-block:: bash

   docker pull ghcr.io/edumfa/edumfa:latest

You can replace `latest` with a specific version tag if needed e.g. `2.2.0`

Running eduMFA Container
........................

To run the eduMFA container, use the following command:

.. code-block:: bash

   docker run -d -p 8000:8000 --name edumfa ghcr.io/edumfa/edumfa:latest

This command will:

- Run the container in detached mode (`-d`)
- Map port 8000 on the host to port 8000 in the container (`-p 8000:8000`)
- Name the container "edumfa" (`--name edumfa`)

Running your own scripts
....................

To run your own scripts on startup, put it into the `/opt/edumfa/user-scripts/` directory with a `.sh` suffix:

.. code-block:: bash

   docker run -d -p 8000:8000 -v /path/to/script.sh:/opt/edumfa/user-scripts/script.sh --name edumfa ghcr.io/edumfa/edumfa:latest

It will be executed as a bash script. It's also possible to execute multiple files by placing multiple scripts with the suffix there [#bashGlobbing]_.

Persistent Data 
...............

To persist data between container restarts, you can mount a volume for the database:

.. code-block:: bash

   docker run -d -p 8000:8000 -v /path/to/edumfa.cfg:/etc/edumfa/edumfa.cfg -v edumfa-config:/etc/edumfa --name edumfa ghcr.io/edumfa/edumfa:latest

This will create a named volume `edumfa-config` that will persist your eduMFA configuration. This volume will contain the encryption key and the audit key.

Depending on your own configuration and your individual setup you may need to adjust the paths.

Updating eduMFA manually
...............

To update eduMFA to a newer version, pull the latest image and recreate the container:

.. code-block:: bash

   docker pull ghcr.io/edumfa/edumfa:latest
   docker stop edumfa
   docker rm edumfa
   docker run -d -p 8000:8000 -v /path/to/edumfa.cfg:/etc/edumfa/edumfa.cfg -v edumfa-config:/etc/edumfa --name edumfa ghcr.io/edumfa/edumfa:latest


.. rubric:: Footnotes

.. [#bashGlobbing] The execution order depends on the way Bash expands `*.sh`. Read more in the `POSIX specification`_.
.. _POSIX specification: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html#tag_18_13_03

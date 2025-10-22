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

Beside the `docker-compose.yml` you must create your own `edumfa.cfg` and replace the paths. 

The container contains a default logging configuration printing the logs to `stdout`, performs database maintanance on start and runs the application using `guincorn` on port 8000.

For production you should replace the passwords and secrets with your own values. 

.. code-block:: cfg
   
   # The realm, where users are allowed to login as administrators
   SUPERUSER_REALM = ['super', 'administrators']
   # Your database
   SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://edumfa:pass@mariadb/edumfa'
   # This is used to encrypt the auth_token
   SECRET_KEY = 'strong-key'
   # This is used to encrypt the admin passwords
   EDUMFA_PEPPER = "strong-pepper"
   # This is used to encrypt the token data and token passwords
   EDUMFA_ENCFILE = '/etc/edumfa/enckey'
   # This is used to sign the audit log
   EDUMFA_AUDIT_KEY_PRIVATE = '/etc/edumfa/private.pem'
   EDUMFA_AUDIT_KEY_PUBLIC = '/etc/edumfa/public.pem'

.. code-block:: yaml

   services:
     mariadb:
       image: docker.io/mariadb:lts-jammy
       restart: always
       volumes:
         - maria-data:/var/lib/mysql:rw
       environment:
         - MARIADB_PORT_NUMBER=3306
         - MARIADB_DATABASE=edumfa
         - MARIADB_USER=edumfa
         - MARIADB_PASSWORD=pass
         - MARIADB_ROOT_PASSWORD=pass
       healthcheck:
         test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
         start_period: 10s
         interval: 10s
         timeout: 5s
         retries: 3
     edumfa:
       image: ghcr.io/edumfa/edumfa:latest
       ports:
         - "8000:8000"
       volumes:
         - edumfa-config:/etc/edumfa
         - /path/to/edumfa.cfg:/etc/edumfa/edumfa.cfg
       environment:
         - EDUMFA_ADMIN_USER=admin
         - EDUMFA_ADMIN_PASS=Passwort123
       depends_on:
         mariadb:
           condition: service_healthy

   volumes:
      edumfa-config:
      maria-data:

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

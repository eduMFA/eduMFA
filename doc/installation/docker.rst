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

Pulling the eduMFA Docker Image
...............................

To pull the eduMFA Docker image from GitHub Registry, use the following command:

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

Persistent Data
...............

To persist data between container restarts, you can mount a volume for the database:

.. code-block:: bash

   docker run -d -p 8000:8000  -v /path/to/config.cfg:/etc/edumfa/edumfa.cfg -v edumfa_data:/etc/edumfa --name edumfa ghcr.io/edumfa/edumfa:latest

This will create a named volume `edumfa_data` that will persist your eduMFA data. This volume will contain the encryption key and the audit key.

Depending on your own configuration and your individual setup you may need to adjust the paths.

Updating eduMFA
...............

To update eduMFA to a newer version, pull the latest image and recreate the container:

.. code-block:: bash

   docker pull ghcr.io/edumfa/edumfa:latest
   docker stop edumfa
   docker rm edumfa
   docker run -d -p 8000:8000  -v /path/to/config.cfg:/etc/edumfa/edumfa.cfg -v edumfa_data:/etc/edumfa --name edumfa ghcr.io/edumfa/edumfa:latest

Docker Compose
..............

For more complex setups, you can use Docker Compose. Here's a sample `docker-compose.yml` file:

.. code-block:: yaml

   version: '3'
   services:
     edumfa:
       image: ghcr.io/edumfa/edumfa:latest
       ports:
         - "8000:8000"
       volumes:
         - edumfa_data:/etc/edumfa
         - /path/to/config.cfg:/etc/edumfa/edumfa.cfg
       environment:
         - EDUMFA_ADMIN_USER=admin
         - EDUMFA_ADMIN_PASS=Passwort123

   volumes:
     edumfa_data:

To start eduMFA using Docker Compose, run:

.. code-block:: bash

   docker-compose up -d

For more information on using eduMFA, please refer to :ref:`first_steps`.
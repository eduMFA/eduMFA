.. _install_helm:

Helm Installation
-------------------

.. index:: helm

.. warning:: This chart is currently considered experimental and does not offer
             configuration stability until version 1.0.0. Breaking changes can
             happen in any release.

An eduMFA Helm chart which enables quick installation in a Kubernetes setup. It
works as a deployment, which is accompanied by:

- A Helm hook on install and upgrade which upgrades the database schema.
- CronJobs which take care of audit rotation and challenge cleanup.

It does not contain a database or possibilities to execute user-defined scripts.

Prerequisites
.............

- A database for eduMFA to use.
- Helm has to be installed.
- The name of the namespace you want to use.
- If you want to use the below guide to create the essential secret,
  `uv <https://docs.astral.sh/uv/getting-started/installation/>`_  has to be
  installed.

Create Secret
..............

The chart needs a secret containing the following fields:

- ``enckey`` The encryption key for the token secrets in the database.
- ``private.pem`` The audit private key.
- ``public.pem`` The audit public key.
- ``secret_key`` The key for signing JWTs.
- ``pepper`` The pepper for the passwords stored in eduMFA.
- ``db_password`` The password for the DB user.
Failing to provide these values will mean the Helm deployment fails. Here is an example how to create a suitable secret:

.. XXX: It would be nice to have path options for the uv commands below.

1. Create an empty directory, ``cd`` into it.
2. Create the enckey

- Create a new key and note its path ``uv run -w edumfa --prerelease=allow edumfa-manage create_enckey``
- Move the key to your current directory.
2. Create the audit key

- Create the key: ``uv run -w edumfa --prerelease=allow edumfa-manage create_audit_keys``
- Move the certificate and key to your current directory.
3. Create a secret key for the JWTs: ``$ tr -dc A-Za-z0-9_ </dev/urandom | head -c24 > secret_key``
4. Create a pepper: ``$ tr -dc A-Za-z0-9_ </dev/urandom | head -c24 > pepper``
5. Create ``db_password`` with the password for the database user.
6. Create a Kubernetes secret from these files: ``$ kubectl create secret generic edumfa-secrets --from-file=. -n $YOUR_NAMESPACE``
7. **Backup the files in this directory before deleting them!**  Especially the enckey is necessary to restore from a database backup as token secrets are encrypted.
8. After **backing them up** you may delete the directory and files.

Installation
............

This is an explanation how to test out the draft PR.

1. Create the secret as described above.
2. Get a
   `values.yaml <https://raw.githubusercontent.com/eduMFA/eduMFA/5d8b4bfb050a621dc16cf2d3fdd295b8bae487d8/deploy/charts/edumfa/values.yaml>`_.
3. Edit ``values.yaml`` to  your liking. At minimum, change ``edumfa.db``.
4. Install: ``helm install -n $YOUR_NAMESPACE my-release -f values.yaml  'oci://ghcr.io/aleyna72072/edumfa' --version 0.1.0``


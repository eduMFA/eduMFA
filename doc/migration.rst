.. _migration_guides:

Migration
=========

This page contains the latest major migration guide for eduMFA.

.. note::
   This guide currently covers migration from privacyIDEA to eduMFA.
   After eduMFA 3.0.0 is released, this page will be updated to cover the
   latest migration path.

Migrating from privacyIDEA 3.9.2
--------------------------------

.. caution::
   - Make a full backup of your existing installation before starting. Include
     configuration files, encryption keys, and the database.
   - Upgrade to the latest supported privacyIDEA version (3.9.2) before
     switching to eduMFA.
   - These steps are applicable for all previously released versions.

High-level migration steps
~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Uninstall privacyIDEA and stop your web service (Apache2 or nginx).
2. Move or copy configuration from ``/etc/privacyidea/`` to ``/etc/edumfa/``.
3. Rename ``pi.cfg`` to ``edumfa.cfg``.
4. Replace ``PI_`` configuration keys with ``EDUMFA_`` keys (for example,
   ``PI_ENCFILE`` becomes ``EDUMFA_ENCFILE``).
5. Update configuration paths to ``/etc/edumfa/``.
6. Update the log file path to ``/var/log/edumfa/edumfa.log``.
7. Install eduMFA (container, pip, or ``.deb`` package).
8. Replace usage of privacyIDEA scripts such as ``pi-manage`` with
   ``edumfa-manage`` in cron jobs and systemd units.
9. Replace ``privacyideaapp.wsgi`` with ``edumfaapp.wsgi`` and adjust paths in
   Apache2 or nginx configurations.
10. Perform the database migration steps below.

Database migration
~~~~~~~~~~~~~~~~~~

Run [1]_:

.. code-block:: bash

   edumfa-schema-upgrade /opt/edumfa/lib/edumfa/migrations

The command is typically located in ``/opt/edumfa/bin``.

If you use server ``.deb`` packages (``edumfa-apache2`` or ``edumfa-nginx``),
database migration is executed automatically during package installation.

Manual SQL fallback
~~~~~~~~~~~~~~~~~~~

If automatic migration fails, apply the equivalent SQL changes as a last resort.

- First, make sure that you're on the correct database version.

  - ``edumfa-manage db -d /opt/edumfa/lib/edumfa/migrations current`` [1]_
    should return ``5cb310101a1f``.
  - Alternatively, you can just look at the single row in the
    ``alembic_version`` table. It should have the same value.
  - Only continue if this is the case! If not, update your database to that
    version [2]_.

- Rename table ``pidea_audit`` to ``mfa_audit``.
- Rename table ``privacyideaserver`` to ``edumfaserver``.
- PostgreSQL: rename sequence ``privacyideaserver_id_seq`` to
  ``edumfaserver_id_seq``.
- MariaDB: rename sequence ``privacyideaserver_seq`` to
  ``edumfaserver_seq``.
- Rename column ``mfa_audit.privacyidea_server`` to
  ``mfa_audit.edumfa_server``.
- Rename column ``policy.pinode`` to ``policy.edumfanode``.
- In ``policy.action``, replace ``login_mode=privacyIDEA`` with
  ``login_mode=eduMFA``.
- In ``policy.action``, replace ``privacyideaserver_read`` with
  ``edumfaserver_read``.
- In ``policy.action``, replace ``privacyideaserver_write`` with
  ``edumfaserver_write``.
- In ``smsgateway.providermodule``, replace ``privacyidea.`` with ``edumfa.``.

After that, make sure to stamp the database to the version which is already
migrated:
``edumfa-manage db -d /opt/edumfa/lib/edumfa/migrations stamp 0d011e94a8e8``.
This tells eduMFA that the migration from privacyIDEA to eduMFA has already
happened.

Now run the rest of the database upgrade operations to update to the current
eduMFA version:
``edumfa-schema-upgrade /opt/edumfa/lib/edumfa/migrations`` [1]_.

.. [1] Note that this path can be different on your machine, depending on how
   you installed eduMFA. In the container, the path would for example be
   `/usr/local/lib/edumfa/migrations` instead.
   The correct directory should contain a "versions" directory and an
   "alembic.ini" file.

.. [2] That database version is the one in privacyIDEA 3.9.2. It is necessary to
   be on that exact version to make sure your database schema does not miss any
   changes.

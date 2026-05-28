.. _release_changelog:

Changelog
=========

This page tracks notable release highlights for eduMFA.
For version-to-version upgrade steps, see :ref:`migration_guides`.

.. warning::
   eduMFA 3.0.0 is expected to remove multiple features. The current work in
   progress tracking issue is `#875 <https://github.com/eduMFA/eduMFA/issues/875>`_.

.. caution::
   Due to new fields in ``edumfa.cfg``, upgrading via Ubuntu packages can cause apt to prompt you to replace it. Replacing it will remove secrets from your current configuration, so keep your existing file and add only the new fields manually.

   This is tracked in `issue #1124 <https://github.com/eduMFA/eduMFA/issues/1124>`_.

eduMFA 2.9.2
------------

This release contains no functional changes, but only docs related issues. This causes version 2.9.1 to not be available in docs.


eduMFA 2.9.1
------------

.. warning::
   Please see this
   `important notice <https://edumfa.readthedocs.io/en/v2.9.2/integrations/shibboleth.html>`_
   regarding Passkeys and users which are locked in a resolver. The Shibboleth
   plugin ``fudiscr`` will ship a feature for fudispasskeys which makes it easy
   to check for locked users. This will be in version 2.3.1 and has to be
   enabled first.

Bug Fixes
~~~~~~~~

- Fixed a vulnerability enabling the replay of Passkey logins, see
  `advisory <https://github.com/advisories/GHSA-j5rm-v3vh-vx94>`_.
- Fixed a vulnerability introduced by faulty snapshot isolation in MySQL and
  MariaDB, see `advisory <https://github.com/advisories/GHSA-qq2p-4282-cfc5>`_.
- Fixed a denial-of-service vulnerability caused by a bug which increments all
  failcounters in a resolver, see
  `advisory <https://github.com/advisories/GHSA-74r7-3mjm-jc5v>`_.
- Fixed ``reset_all_user_tokens`` for Passkey login.
- Fixed a possible pitfall during setup. Stamping is no longer done manually but
  with ``create_tables``.
- Fixes to the container image:

  + Fixed using ``EDUMFA_CONFIGFILE`` to override the default path.
  + Fixed the config check when using ``EDUMFA_CONFIGFILE``.
  + Moved the config files to ``/opt`` instead of ``/etc`` to avoid changes to
    them not being applied during an upgrade.
  + Stopped logging the admin password if the password was set manually.
  + Fixed setting admin credentials from a file.
- Applies security updates to multiple libraries.

See full `commit history <https://github.com/eduMFA/eduMFA/compare/v2.9.0...v2.9.1>`_.

eduMFA 2.9.0
------------

.. warning::
   This release drops support for Python 3.9. Upgrade your runtime to Python
   3.10 or newer before updating to this release.

Highlights
~~~~~~~~~~

- Added support for Python 3.14.
- Added token creation timestamps.
- Added a policy to enforce TOTP timeshift settings.
- Added configurable timeouts for Firebase requests.
- Added environment-variable-based container configuration.
- Re-introduced the version number in the web UI footer.
- Dropped support for Python 3.9.

See
`full changelog for 2.9.0 <https://github.com/eduMFA/eduMFA/blob/eb8e5140ca0b29f206cbf8ada8cba3cfec31523a/READ_BEFORE_UPDATE.md#edumfa-290>`_
and `commit history <https://github.com/eduMFA/eduMFA/compare/v2.8.0...v2.9.0>`_.

Release Archive
---------------

For previous releases, see `eduMFA releases on GitHub <https://github.com/eduMFA/eduMFA/releases>`_.

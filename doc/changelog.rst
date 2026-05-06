.. _release_changelog:

Changelog
=========

This page tracks notable release highlights for eduMFA.
For version-to-version upgrade steps, see :ref:`migration_guides`.

.. caution::
   Due to new fields in ``edumfa.cfg``, upgrading via Ubuntu packages can cause apt to prompt you to replace it. Replacing it will remove secrets from your current configuration, so keep your existing file and add only the new fields manually.

   This is tracked in `issue #1124 <https://github.com/eduMFA/eduMFA/issues/1124>`_.

eduMFA 2.9.0
------------

.. warning::
   This release drops support for Python 3.9. Upgrade your runtime to Python
   3.10 or newer before updating to this release.

.. warning::
   eduMFA 3.0.0 is expected to remove multiple features. The current work in
   progress tracking issue is `#875 <https://github.com/eduMFA/eduMFA/issues/875>`_.

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

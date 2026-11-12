.. _release_changelog:

Changelog
=========

This page tracks notable release highlights for eduMFA.
For version-to-version upgrade steps, see :ref:`migration_guides`.

.. warning::
   Review the :ref:`deprecations_3_0` before upgrading to eduMFA 3.0.0.

.. caution::
   Due to new fields in ``edumfa.cfg``, upgrading via Ubuntu packages can cause apt to prompt you to replace it. Replacing it will remove secrets from your current configuration, so keep your existing file and add only the new fields manually.

   This is tracked in `issue #1124 <https://github.com/eduMFA/eduMFA/issues/1124>`_.

eduMFA 2.X.Y (unreleased)
--------------------------

.. _deprecations_3_0:

Deprecations for eduMFA 3.0.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The following changes are planned for eduMFA 3.0.0. See
`the release tracking issue <https://github.com/eduMFA/eduMFA/issues/875>`_
for the current status.

* **Token types.** Use the token list's type filter to find enrolled tokens
  of type ``u2f``, ``push`` (legacy PUSH), ``daypassword``, ``daplug``,
  ``vasco`` or ``certificate`` and plan replacements before upgrading.
  Re-enroll compatible U2F devices as :ref:`webauthn` tokens and replace legacy
  PUSH tokens with :ref:`edupush_token`. For Day Password tokens, consider
  :ref:`pw_token` or :ref:`indexedsecret_token` with a validity period.
  If you rely on Certificate tokens, report your use case in the release
  tracking issue. Archiving that token type is still being considered.
* **Archived token types.** :ref:`four_eyes_token`, :ref:`questionnaire_token`,
  :ref:`ocra_token`, :ref:`tiqr_token` and :ref:`motp_token` are planned for
  archival. They will remain available with coverage limited to the existing
  unit tests. Report problems through GitHub issues or pull requests.
* **User management.** Move creation, editing and deletion of users from
  :ref:`editable resolvers <useridresolvers>` to your identity management
  system or underlying user directory. Review workflows that depend on
  writing to a resolver, including self-registration and password reset.
* **Enrollment and authorization policies.** Use standard enrollment for new
  HOTP and TOTP tokens and review the :ref:`two-step policies <2step_enrollment>`.
  Review policies that use :ref:`force_app_pin` or
  :ref:`application_tokentype_policy`. The WebUI policies
  ``show_android_privacyidea_authenticator`` and
  ``show_ios_privacyidea_authenticator`` are planned to be replaced by an
  eduMFA app policy.
* **Token images.** The :ref:`appimageurl enrollment policy <policy_appimageurl>`
  is planned for removal. The planned ``edupush_image_url`` authentication
  policy provides images for eduPUSH tokens after enrollment and during
  challenge polling.
* **Legacy PUSH policies.** ``enrollPUSH`` and the ``push_*`` enrollment
  and authentication actions are planned for removal, including the
  per-user token limits.
* **eduPUSH TLS.** The ``edupush_ssl_verify`` action is planned for removal
  from enrollment and authentication policies. Use an HTTPS endpoint with
  a certificate trusted by the mobile device.
* **TOTP timeshift.** Review the system-wide ``totp.useTimeShift`` setting and
  policies with ``totp_timeshift=default``. The system default is planned for
  removal. Set timeshift explicitly for enrollments that require it.
* **Installation and integrations.** Plan a move from the eduMFA
  :ref:`Ubuntu packages <install_ubuntu>` to a supported installation method
  such as :ref:`install_docker_compose`. The bundled FreeRADIUS plugin is
  planned for removal from this repository. Use the separate
  `eduMFA RADIUS plugin repository <https://github.com/eduMFA/edumfa-radius>`_.

Server logs report deprecated token enrollments and flag active deprecated
policies, editable resolvers and the TOTP system default when loading
configuration.

The future of the ``DisableAutoChallengeJanitor`` and
``DisableClientTracking`` settings is under discussion in the release
tracking issue.

Changes
~~~~~~~

- The credential id of WebAuthn tokens is no longer stored encrypted. It is
  public information that is sent to the client with every authentication
  request, so encrypting it only cost time. This removes one decryption per
  WebAuthn token from every authentication, which is noticeable with many
  WebAuthn tokens or a hardware security module. The public key and all other
  token data are not affected. See :ref:`webauthn`.

Upgrade Notes
~~~~~~~~~~~~~

- The database migration decrypts the credential id of all existing WebAuthn
  tokens once. Tokens that can not be decrypted are reported and keep working 
  with their encrypted credential id. Downgrading the schema encrypts the 
  credential ids again.

eduMFA 2.9.6
------------

This release fixes multiple security issues.

Bug Fixes
~~~~~~~~~

- Fixed a vulnerability allowing users on an editable resolver to edit other
  users attributes, see
  `advisory <https://github.com/eduMFA/eduMFA/security/advisories/GHSA-h4fq-8pff-cq4v>`_.
- Fixed a vulnerability allowing the impersonation of a user if usernameless
  login is enabled and the target user has a SPASS token. See
  `advisory <https://github.com/eduMFA/eduMFA/security/advisories/GHSA-gqm8-ccgr-7r67>`_.
- Fixed the enrollment of certain types of WebAuthn authenticators.
- Fixed token defaults not applying for the default tokentype in the WebUI.
- Fixed the privacyIDEA to eduMFA migration for PostgreSQL databases.
- Applies security updates to multiple libraries, including certifi. This
  removes
  `compromised CA certificates <https://github.com/advisories/GHSA-6q48-6c7w-9gw2>`_.

Documentation
~~~~~~~~~~~~~

- Updates length recommendations for the secret key and pepper.
- Adds warning that the ``remote_user`` policy can enable authentication bypass
  if it is missing a properly configured webserver.

.. note::
  The ``remote_user`` policy in the WebUI scope enables users to be authenticated
  by (for example) an external SSO service. If that policy is enabled eduMFA reads
  the ``remote_user`` WSGI environment variable. Failing that, the HTTP header
  "Remote-User" is evaluated. This feature is intended for containerized flows,
  where the WSGI server and reverse proxy doing the authentication are separated.
  Now, if:

  - this policy is enabled and
  - there is no authentication in the same webserver setting the WSGI
    server variable (which takes precedence)
  - the reverse proxy is passing user-provided Remote-User headers to the WSGI
    server

  Then an attacker can impersonate any user by simply specifying the "Remote-User"
  header. This is now communicated more clearly in the WebUI and the
  documentation.
  To get rid of this trap, a future minor version of eduMFA will introduce an
  optional feature to specify trusted proxy IP addresses. A major version will
  then make it mandatory to use the ``Remote-User`` HTTP header.

See full `commit history <https://github.com/eduMFA/eduMFA/compare/v2.9.5...v2.9.6>`_.

eduMFA 2.9.5
------------

This release contains no functional changes but fixes an issue with uploading
to PyPi. This causes version 2.9.4 to not be available there.

eduMFA 2.9.4
------------

This release fixes the Blast-RADIUS attack for the RADIUS token.

Bug Fixes
~~~~~~~~~

- Fixed the `Blast-RADIUS <https://www.blastradius.fail/>`_ attack for RADIUS
  tokens, too. See `advisory <https://github.com/eduMFA/eduMFA/security/advisories/GHSA-hmmw-j78p-f6mv>`_.
- Actually fixed ``edumfa-pip-update`` when used with Python 3.14, which was
  missing from v2.9.3.
- Applies security updates to multiple libraries.

See full `commit history <https://github.com/eduMFA/eduMFA/compare/v2.9.3...v2.9.4>`_.

eduMFA 2.9.3
------------

This release fixes issues introduced in v2.9.2.

Bug Fixes
~~~~~~~~~

- Fixed an incompatibility with PostgreSQL. To avoid issues like this in the future:

  + eduMFA will soon declare its supported databases. These will likely be
    MariaDB and PostgreSQL.
  + Unittests now additionally run against those supported DBs (instead of only
    SQLite as a development database).
- Fixed dangling database sessions under high load when writing to the
  ClientApplication table.
- Fixed an error message when trying to login with unassigned passkeys.
- Fixed ``edumfa-pip-update`` when used with Python 3.14.
- Fixed ``edumfa-manage`` in the container outside of the entrypoint (e.g. for
  interactive shells or cronjobs).

See full `commit history <https://github.com/eduMFA/eduMFA/compare/v2.9.2...v2.9.3>`_.

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
~~~~~~~~~

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

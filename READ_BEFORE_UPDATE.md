# Update Notes

## Migrating from privacyIDEA 3.9.2 to eduMFA

> [!CAUTION]
>  * Make a backup of your existing installation! This backup should include the config files, the encryption keys and
     the database.
>  * Ensure that you use the latest supported privacyIDEA version 3.9.2 and then upgrade to eduMFA
> 
> These migration steps are applicable for all versions released up to now

* Uninstall privacyIDEA and stop your `Apache2` or `nginx` service
* Move/Copy all configurations from `/etc/privacyidea/` to `/etc/edumfa/`
    * The config file needs to be renamed from `pi.cfg` to `edumfa.cfg`
    * Rename/Replace `PI_` in the configuration file with `EDUMFA_` (e.g. `PI_ENCFILE` changes to `EDUMFA_ENCFILE`)
    * Update the paths in the configuration file to `/etc/edumfa/`
    * Update the log file path to `/var/log/edumfa/edumfa.log`
* Install eduMFA (e.g. using Container, PIP or the `.deb` Package)
    * When using the `.deb` package, make sure not to overwrite the existing configuration file when prompted
    * When using the server `.deb` package (`edumfa-apache2`, `edumfa-nginx`), the database migration will be executed automatically. Additionally the web server configuration and a cron entry will be installed.
* Check your `crontab`, `systemd` services for the usage of `pi-manage` or any other privacyIDEA script and replace it with `edumfa-manage`
* Check your `Apache2` or `nginx` configurations for usage of the `privacyideaapp.wsgi` and replace it with `edumfaapp.wsgi` and fix all required paths
* Execute the database migration using `edumfa-schema-upgrade` located in the `/opt/edumfa/bin`. You also need to provide the migration dir `/opt/edumfa/lib/edumfa/migrations`. The latest migration will rename several columns and tables from privacyIDEA related names to eduMFA
    * In case of an error executing this migration you also can perform the required migrations using SQL
        * Rename the table `pidea_audit` to `mfa_audit`
        * Rename the table `privacyideaserver` to `edumfaserver`
        * In case of Postgres: Rename the sequence `privacyideaserver_id_seq` to `edumfaserver_id_seq`
        * In case of MariaDB: Rename the sequence `privacyideaserver_seq` to `edumfaserver_seq`
        * Rename the column `mfa_audit.privacyidea_server` to `mfa_audit.edumfa_server`
        * Rename the column `policy.pinode` to `policy.edumfanode`
        * Replace all occurrences of `login_mode=privacyIDEA` in `policy.action` with `login_mode=eduMFA`
        * Replace all occurrences of `privacyideaserver_read` in `policy.action` with `edumfaserver_read`
        * Replace all occurrences of `privacyideaserver_write` in `policy.action` with `edumfaserver_write`
        * Replace all occurrences of `privacyidea.` in `smsgateway.providermodule` with `edumfa.`

## eduMFA 2.0.2

* chore: Configure Renovate by @renovate in https://github.com/eduMFA/eduMFA/pull/7
* chore: do not inherit from `object` by @aburch in https://github.com/eduMFA/eduMFA/pull/61
* chore: fix doc dependencies by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/80
* docs: update documentation (no corresponding issue) by @Thaoden in https://github.com/eduMFA/eduMFA/pull/87
* fix: migration for apache and nginx packages by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/88
* fix: print logo to stderr by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/89
* fix: correct audit log rotation example in crontab by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/103
* fix: correct cronjob by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/102
* test: add missing sms provider tests by @j-hoff in https://github.com/eduMFA/eduMFA/pull/109
* feat: add support for PostgreSQL in backup script by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/10
* docs: change docs theme to furo + upgrade docs dependencies by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/908
* chore(deps): update dependency pytz to v2024 by @renovate in https://github.com/eduMFA/eduMFA/pull/107
* chore(deps): update dependency pydash to v8 by @renovate in https://github.com/eduMFA/eduMFA/pull/106
* chore(deps): update dependency netaddr to v0.10.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/111
* chore(deps): update dependency babel to v2.14.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/67
* chore(deps): update dependency alembic to v1.13.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/66
* chore(deps): update dependency werkzeug to v3.0.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/65
* chore(deps): update dependency sqlalchemy to v1.4.52 by @renovate in https://github.com/eduMFA/eduMFA/pull/64
* chore(deps): update dependency flask-migrate to v4.0.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/63
* chore(deps): update softprops/action-gh-release action to v2 by @renovate in https://github.com/eduMFA/eduMFA/pull/60
* chore(deps): update dependency idna to v3.7 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/55
* chore(deps): update actions/checkout action to v4 by @renovate in https://github.com/eduMFA/eduMFA/pull/58
* chore(deps): update dependency flask to v3.0.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/62
* chore(deps): update dependency async-timeout to v4.0.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/68
* chore(deps): update dependency smpplib to v2.2.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/73
* chore(deps): update dependency cachetools to v5.3.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/69
* chore(deps): update dependency sphinxcontrib-qthelp to v1.0.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/77
* chore(deps): update dependency sphinxcontrib-htmlhelp to v2.0.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/76
* chore(deps): update dependency sphinxcontrib-applehelp to v1.0.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/74
* chore(deps): update dependency sphinxcontrib-devhelp to v1.0.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/75
* chore(deps): update dependency croniter to v1.4.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/86
* chore(deps): update dependency charset-normalizer to v3.3.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/85
* chore(deps): update dependency cffi to v1.16.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/84
* chore(deps): update dependency cbor2 to v5.6.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/82
* chore(deps): update dependency bcrypt to v4.1.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/79
* chore(deps): update dependency responses to v0.25.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/101
* chore(deps): update dependency redis to v4.6.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/100
* chore(deps): update dependency pykcs11 to v1.5.15 by @renovate in https://github.com/eduMFA/eduMFA/pull/71
* chore(deps): update dependency lxml to v5.2.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/94
* chore(deps): update dependency pyjwt to v2.8.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/96

## eduMFA 2.0.1

* chore: switch to psycopg2 instead of psycopg2-binary
* fix: correct sequence creation for galera
* ci: build ubuntu packages always (only upload on release)

## eduMFA 2.0.0

> [!CAUTION]
> This release drops support for Python 3.6 and Python 3.7. 
> 
> Both versions are deprecated and no longer supported by eduMFA. In favor of major dependency upgrades and supporting Python 3.11 and 3.12 the outdated versions are removed! 

### Internal changes:

* chore: Several (major) dependency upgrades
* chore: Rework CLI tools and drop `Flask-Script`

## eduMFA 1.5.1

* fix: correct location of venv for ubuntu packages by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/47
* fix: ignore revoked, disabled webauthn tokens for passkey auth by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/50
* fix: correct handling of login mode by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/48

## eduMFA 1.5.0

* feat: api: set tokeninfo on init by @j-hoff in https://github.com/eduMFA/eduMFA/pull/36
* feat: add ubuntu packages by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/13
* feat: log passkey usage by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/30
* feat: allow customization of passkey label by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/42
* feat: more detailed logging for eduMFA migration script by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/44
* fix: add missing flask-migrate logging by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/41
* fixed typo: Attributes -> Attributes by @linuxrrze in https://github.com/eduMFA/eduMFA/pull/43

## eduMFA 1.4.0

* ci: fix branch names by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/22
* docs: start fixing incorrect camel case by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/25
* docs: cleanup old refs and fix path names by @j-hoff in https://github.com/eduMFA/eduMFA/pull/28
* docs: use fu repo by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/33
* docs: add docu for new sms provider "Http Message To Uid Provider" by @j-hoff in https://github.com/eduMFA/eduMFA/pull/21
* feat: smstoken: add configurable URL which is called after check, extend test by @j-hoff in https://github.com/eduMFA/eduMFA/pull/18
* feat: make result value available in logginghandler, verbosely log set tokeninfo by @j-hoff in https://github.com/eduMFA/eduMFA/pull/19
* feat: new API endpoint POST /info/<serial> to bulk modify tokeninfo by @j-hoff in https://github.com/eduMFA/eduMFA/pull/20
* feat: token janitor find by user by @pmainz in https://github.com/eduMFA/eduMFA/pull/32
* fix: make ldap connections persistent and restartable by @j-hoff in https://github.com/eduMFA/eduMFA/pull/16
* fix: wrong indentation caused false "Action .. requires serial number" line by @j-hoff in https://github.com/eduMFA/eduMFA/pull/17
* fix: improve handling of resident keys by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/26
* fix: rename provider module names in DB on migration by @j-hoff in https://github.com/eduMFA/eduMFA/pull/29

## eduMFA 1.3.0

* Fixed handling Windows Hello passkeys
* Include curl in container to enable health checks
* Bugfixes for CI and docs

## eduMFA 1.2.0

* Only bugfix release for CI actions no functional changes

## eduMFA 1.1.0

* Only bugfix release for CI actions no functional changes

## eduMFA 1.0.0

* Add option to enroll passkeys
* Add option to include description in user notifications
* Add containers as release artifacts
* Add option to filter the user_token_number on a given range instead of constant
* Add option to use the `Remote-User` header behind a reverse proxy



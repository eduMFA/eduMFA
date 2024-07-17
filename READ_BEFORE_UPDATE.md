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

## eduMFA 2.2.0 

> [!CAUTION]
> **This release fixes a possible security vulnerability.**
>
> eduMFA prior version 2.2.0 was also affected by [blastRADIUS](https://www.blastradius.fail/) ([CVE-2024-3596](https://nvd.nist.gov/vuln/detail/CVE-2024-3596)). In case you are using the RADIUS Token we strongly recommend you to upgrade to version 2.2.0. 
>
> Please note that this upgrade requires a database migration and you must replace the radius dictionary used by eduMFA! Beside these changes you should enable the `Message Authenticator` option introduced in the UI in case your RADIUS server supports this option.
> 
> Thanks a lot to @Janfred for the hint and @sklemer1 for the fix!

### Further changes
* chore(deps): update dependency google-auth to v2.32.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/203
* chore(deps): update dependency sphinx to v7.4.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/206
* chore(deps): update dependency setuptools to v70 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/209
* chore(deps): update dependency setuptools to v70.3.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/192
* chore(deps): update dependency croniter to v2.0.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/213
* chore(deps): update dependency cachetools to v5.4.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/210
* chore(deps): update dependency sphinx to v7.4.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/207

## eduMFA 2.1.0

* fix: corrected typo in e-mail address by @st-hofmann in https://github.com/eduMFA/eduMFA/pull/171
* feat: handle passkey AuthenticatorDataFlags  by @ekupris in https://github.com/eduMFA/eduMFA/pull/161
* feat: ignore event handler in case of passkey auth by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/199
* feat: add edumfa-push token type by @johannwagner in https://github.com/eduMFA/eduMFA/pull/104
* chore(deps): update dependency pytest to v8 by @renovate in https://github.com/eduMFA/eduMFA/pull/148
* chore(deps): update dependency redis to v5 by @renovate in https://github.com/eduMFA/eduMFA/pull/149
* chore(deps): update dependency zipp to v3.19.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/169
* chore(deps): update dependency mako to v1.3.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/166
* chore(deps): update dependency lxml to v5.2.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/165
* chore(deps): update dependency pykcs11 to v1.5.16 by @renovate in https://github.com/eduMFA/eduMFA/pull/167
* chore(deps): update dependency flask-sqlalchemy to v3.1.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/110
* chore(deps): update dependency cryptography to v42.0.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/173
* chore(deps): update dependency cbor2 to v5.6.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/172
* chore(deps): update dependency pytest to v8.2.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/175
* chore(deps): update dependency redis to v5.0.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/176
* chore(deps): update dependency grpcio to v1.64.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/170
* chore(deps): update dependency huey to v2.5.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/174
* chore(deps): update dependency requests to v2.32.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/168
* chore: test dependencies by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/182
* chore(deps): update dependency urllib3 to v2.2.2 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/186
* chore(deps): update docker/build-push-action action to v6 by @renovate in https://github.com/eduMFA/eduMFA/pull/188
* chore(deps): update dependency zipp to v3.19.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/178
* chore(deps): update dependency certifi to v2024.6.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/179
* chore(deps): update dependency packaging to v24.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/183
* chore(deps): update dependency netaddr to v1 by @renovate in https://github.com/eduMFA/eduMFA/pull/147
* chore(deps): update dependency pyasn1 to v0.6.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/112
* chore(deps): update dependency alembic to v1.13.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/195
* chore(deps): update dependency sqlalchemy to v2.0.31 by @renovate in https://github.com/eduMFA/eduMFA/pull/190
* chore(deps): update dependency redis to v5.0.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/189
* chore(deps): update dependency google-auth to v2.30.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/181
* chore(deps): update dependency typing-extensions to v4.12.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/191
* chore(deps): update dependency importlib-metadata to v8 by @renovate in https://github.com/eduMFA/eduMFA/pull/194
* chore(deps): update dependency gssapi to v1.8.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/70
* chore(deps): pin dependencies by @renovate in https://github.com/eduMFA/eduMFA/pull/196
* chore(deps): update dependency google-auth to v2.31.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/198
* chore(deps): update dependency certifi to v2024.7.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/200


## eduMFA 2.0.3

* fix: redirect filename arg for policy creation by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/158
* chore(deps): update dependency werkzeug to v3.0.3 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/117
* chore(deps): update dependency jinja2 to v3.1.4 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/116
* chore(deps): update dependency pymysql to v1.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/97
* chore(deps): update dependency pyasn1-modules to v0.4.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/113
* chore(deps): update dependency certifi to v2023.11.17 by @renovate in https://github.com/eduMFA/eduMFA/pull/83
* chore(deps): update dependency python-gnupg to v0.5.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/72
* chore(deps): update dependency mako to v1.3.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/95
* chore(deps): update dependency grpcio to v1.63.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/92
* chore(deps): update dependency certifi to v2024 by @renovate in https://github.com/eduMFA/eduMFA/pull/122
* chore(deps): update dependency importlib-metadata to v6.11.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/121
* chore(deps): update dependency babel to v2.15.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/120
* chore(deps): update dependency bcrypt to v4.1.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/118
* chore(deps): update dependency cryptography to v42.0.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/119
* chore(deps): update dependency setuptools to v69.5.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/126
* chore(deps): update dependency blinker to v1.8.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/125
* chore(deps): update dependency pydash to v8.0.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/124
* chore(deps): update dependency docutils to v0.21.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/127
* chore(deps): update dependency furo to v2024.5.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/128
* chore(deps): update dependency itsdangerous to v2.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/133
* chore(deps): update dependency huey to v2.5.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/132
* chore(deps): update dependency croniter to v2 by @renovate in https://github.com/eduMFA/eduMFA/pull/131
* chore(deps): update dependency argon2-cffi to v23 by @renovate in https://github.com/eduMFA/eduMFA/pull/130
* chore(deps): update dependency pycparser to v2.22 by @renovate in https://github.com/eduMFA/eduMFA/pull/135
* chore(deps): update dependency mock to v5.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/134
* chore(deps): update dependency pygments to v2.18.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/136
* chore(deps): update dependency segno to v1.6.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/139
* chore(deps): update dependency soupsieve to v2.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/140
* chore(deps): update dependency testfixtures to v7.2.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/142
* chore(deps): update dependency python-dateutil to v2.9.0.post0 by @renovate in https://github.com/eduMFA/eduMFA/pull/138
* chore(deps): update dependency google-auth to v2.29.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/129
* chore(deps): update dependency pytest to v7.4.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/137
* chore(deps): update dependency zipp to v3.18.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/144
* chore(deps): update dependency typing-extensions to v4.11.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/143
* chore(deps): update dependency sphinxcontrib-plantuml to v0.29 by @renovate in https://github.com/eduMFA/eduMFA/pull/141
* feat: add email headers to prevent auto-replies by @j-hoff in https://github.com/eduMFA/eduMFA/pull/152
* chore(deps): update dependency pymysql to v1.1.1 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/155
* chore(deps): bump requests from 2.31.0 to 2.32.2 in the pip group across 1 directory by @dependabot in https://github.com/eduMFA/eduMFA/pull/156
* chore: upgrade dependencies by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/157
* docs: get rid of plantuml dep by replacing uml with prerendered png by @j-hoff in https://github.com/eduMFA/eduMFA/pull/160


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



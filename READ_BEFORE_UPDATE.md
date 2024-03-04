# Update Notes

## eduMFA 1.3.0

* Fixed handling Windows Hello passkeys
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

### Migrating from privacyIDEA 3.9.2 to eduMFA 1.0.0

> [!CAUTION]
>  * Make a backup of your existing installation! This backup should include the config files, the encryption keys and the database.
>  * Ensure that you use the latest supported privacyIDEA version 3.9.2 and then upgrade to eduMFA 1.0.0

* Uninstall privacyIDEA and stop your nginx or `Apache2`service
* Install eduMFA (e.g. using Container, PIP or the `.deb` Package)
* Move/Rename the following variables and files
  * The default location for the configuration file has been updated to `/etc/edumfa/edumfa.cfg`
  * Rename/Replace `PI_` in the configuration file with `EDUMFA_` (e.g. `PI_ENCFILE` changes to `EDUMFA_ENCFILE`)
  * Check your `crontab`, `systemd` services for the usage of `pi-manage` or any other privacyIDEA script and replace it with `edumfa-manage`
  * Check your `Apache2` or `nginx` configurations for usage of the `privacyideaapp.wsgi` and replace it with `edumfaapp.wsgi` and fix all required paths
* Execute the database migration using `edumfa-schema-upgrade`. 
The latest migration will rename several columns and tables from privacyIDEA related names to eduMFA 
  * In case of an error executing this migration you also can perform the required migrations using SQL
    * Rename the table `pidea_audit` to `mfa_audit`
    * Rename the table `privacyideaserver` to `edumfaserver`
    * In case of Postgres: Rename the sequence `privacyideaserver_id_seq` to `edumfaserver_id_seq`
    * In case of MariaDB: Rename the sequence `privacyideaserver_seq` to `edumfaserver_seq`
    * Rename the column `mfa_audit.privacyidea_server` to `mfa_audit.edumfa_server`
    * Rename the column `policy.pinode` to `policy.edumfanode`
    * Replace all occurences of `login_mode=privacyIDEA` in `policy.action` with `login_mode=eduMFA`
    * Replace all occurences of `privacyideaserver_read` in `policy.action` with `edumfaserver_read`
    * Replace all occurences of `privacyideaserver_write` in `policy.action` with `edumfaserver_write`
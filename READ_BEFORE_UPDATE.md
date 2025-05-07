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

## eduMFA 2.8.0

> [!CAUTION]
> 
>  Starting with this release we no longer provide ubuntu packages for ubuntu focal.
> 

* chore: Drop support for ubuntu focal by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/613
* ci: allow manual trigger for docker ci action by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/608
* feat: add hybrid transport for webauthn by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/599
* feat: decrease log level for crypto usage by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/603
* feat: disable timeshift by @j-hoff in https://github.com/eduMFA/eduMFA/pull/465
* feat: handle hmac-extension by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/602
* feat: improve policy logging by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/604
* feat: reduce/optimize audit logging by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/590
* feat: rename property (`EDUMFA_REDUCE_SQLAUDIT`)  by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/594
* feat: start adding audience check by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/511

* chore(deps): update dependency alembic to v1.15.2 - autoclosed by @renovate in https://github.com/eduMFA/eduMFA/pull/586
* chore(deps): update dependency beautifulsoup4 to v4.13.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/605
* chore(deps): update dependency certifi to v2025.4.26 by @renovate in https://github.com/eduMFA/eduMFA/pull/618
* chore(deps): update dependency charset-normalizer to v3.4.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/625
* chore(deps): update dependency cryptography to v44.0.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/626
* chore(deps): update dependency google-auth to v2.40.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/629
* chore(deps): update dependency importlib-metadata to v8.7.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/619
* chore(deps): update dependency lxml to v5.4.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/614
* chore(deps): update dependency mako to v1.3.10 by @renovate in https://github.com/eduMFA/eduMFA/pull/596
* chore(deps): update dependency pyasn1-modules to v0.4.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/585
* chore(deps): update dependency redis to v6 by @renovate in https://github.com/eduMFA/eduMFA/pull/624
* chore(deps): update dependency rsa to v4.9.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/606
* chore(deps): update dependency setuptools to v80.3.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/627
* chore(deps): update dependency soupsieve to v2.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/612
* chore(deps): update dependency sqlalchemy to v2.0.40 by @renovate in https://github.com/eduMFA/eduMFA/pull/584
* chore(deps): update dependency typing-extensions to v4.13.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/597
* chore(deps): update dependency urllib3 to v2.4.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/598
* fix(deps): pin dependencies by @renovate in https://github.com/eduMFA/eduMFA/pull/601
* fix(deps): update dependency coverage to v7.8.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/587
* fix(deps): update dependency packaging to v25 by @renovate in https://github.com/eduMFA/eduMFA/pull/609
* fix(deps): update dependency pytest-cov to v6.1.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/592
* fix(deps): update dependency types-pyyaml to v6.0.12.20250402 by @renovate in https://github.com/eduMFA/eduMFA/pull/589

## eduMFA 2.7.2

* chore: fix read the docs spec by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/581
* feat: add handling of prf extension by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/582
* chore(deps): pin dependencies by @renovate in https://github.com/eduMFA/eduMFA/pull/564
* chore(deps): update dependency alembic to v1.15.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/558
* chore(deps): update dependency bcrypt to v4.3.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/553
* chore(deps): update dependency cryptography to v44.0.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/554
* chore(deps): update dependency grpcio to v1.71.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/563
* chore(deps): update dependency huey to v2.5.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/572
* chore(deps): update dependency jinja2 to v3.1.6 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/560
* chore(deps): update dependency pytz to v2025.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/578
* chore(deps): update dependency segno to v1.6.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/566
* chore(deps): update dependency setuptools to v78 by @renovate in https://github.com/eduMFA/eduMFA/pull/577
* chore(deps): update dependency sqlalchemy to v2.0.39 by @renovate in https://github.com/eduMFA/eduMFA/pull/567
* chore(deps): update dependency typing-extensions to v4.13.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/580
* fix(deps): update dependency attrs to v25.3.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/569
* fix(deps): update dependency coverage to v7.7.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/575
* fix(deps): update dependency iniconfig to v2.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/573
* fix(deps): update dependency mock to v5.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/557
* fix(deps): update dependency pyparsing to v3.2.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/576
* fix(deps): update dependency pytest to v8.3.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/555
* fix(deps): update dependency responses to v0.25.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/565
* fix(deps): update dependency sphinx to v8.2.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/556
* fix(deps): update dependency types-pyyaml to v6.0.12.20250326 by @renovate in https://github.com/eduMFA/eduMFA/pull/579

## eduMFA 2.7.1

* fix: correct session leak in sqlaudit module by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/547
* chore(deps): update dependency cachetools to v5.5.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/545
* fix(deps): update dependency sphinx to v8.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/544

## eduMFA 2.7.0

* docs: fix some version strings by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/509
* feat: use fixed format for last_auth timestamp in tokeninfo by @j-hoff in https://github.com/eduMFA/eduMFA/pull/510
* docs: Fix pip command to install test deps by @j-hoff in https://github.com/eduMFA/eduMFA/pull/513
* Add support for Crowdin localization by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/515
* ci: add docs in ci by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/512
* registration codes can be explicitly set via otpkey parameter by @pmainz in https://github.com/eduMFA/eduMFA/pull/520
* fix session handling by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/531
* feat: add option to define error behavior on orphan by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/533
* fix: correct extraction of credProps by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/542
* fixed config parameter translation warning by @pmainz in https://github.com/eduMFA/eduMFA/pull/529
* chore(deps): update dependency alembic to v1.14.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/519
* chore(deps): update dependency babel to v2.17.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/530
* chore(deps): update dependency beautifulsoup4 to v4.13.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/534
* chore(deps): update dependency cachetools to v5.5.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/522
* chore(deps): update dependency certifi to v2025 by @renovate in https://github.com/eduMFA/eduMFA/pull/527
* chore(deps): update dependency cryptography to v44.0.1 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/541
* chore(deps): update dependency google-auth to v2.38.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/523
* chore(deps): update dependency grpcio to v1.70.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/524
* chore(deps): update dependency importlib-metadata to v8.6.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/521
* chore(deps): update dependency lxml to v5.3.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/538
* chore(deps): update dependency mako to v1.3.9 by @renovate in https://github.com/eduMFA/eduMFA/pull/535
* chore(deps): update dependency pydash to v8.0.5 - autoclosed by @renovate in https://github.com/eduMFA/eduMFA/pull/517
* chore(deps): update dependency pytz to v2025 by @renovate in https://github.com/eduMFA/eduMFA/pull/528
* chore(deps): update dependency smpplib to v2.2.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/518
* chore(deps): update dependency sqlalchemy to v2.0.38 by @renovate in https://github.com/eduMFA/eduMFA/pull/536
* fix(deps): update dependency attrs to v25 by @renovate in https://github.com/eduMFA/eduMFA/pull/526
* fix(deps): update dependency coverage to v7.6.12 by @renovate in https://github.com/eduMFA/eduMFA/pull/540
* fix(deps): update dependency responses to v0.25.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/507

## eduMFA 2.6.1

* revert: fix: use format string for last auth timestamp by @j-hoff in https://github.com/eduMFA/eduMFA/pull/505

## eduMFA 2.6.0

> [!CAUTION]
> 
>  As mentioned in the previous release this version does no longer support Python 3.8!
> 

* chore: add support for python 3.13 by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/357
* chore: drop support for Python 3.8 by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/384
* docs: add healthcheck for Mariadb by @johanneskastl in https://github.com/eduMFA/eduMFA/pull/476
* fix: add check to exec user scripts only if scripts are available by @fbmei in https://github.com/eduMFA/eduMFA/pull/474
* fix: extract uv requirement per token by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/501
* fix: use format string for last auth timestamp by @j-hoff in https://github.com/eduMFA/eduMFA/pull/494
* chore(deps): update dependency certifi to v2024.12.14 by @renovate in https://github.com/eduMFA/eduMFA/pull/477
* chore(deps): update dependency charset-normalizer to v3.4.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/486
* chore(deps): update dependency click to v8.1.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/482
* chore(deps): update dependency croniter to v6 by @renovate in https://github.com/eduMFA/eduMFA/pull/479
* chore(deps): update dependency cryptography to v44 by @renovate in https://github.com/eduMFA/eduMFA/pull/441
* chore(deps): update dependency flask-migrate to v4.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/500
* chore(deps): update dependency google-auth to v2.37.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/475
* chore(deps): update dependency grpcio to v1.69.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/490
* chore(deps): update dependency jinja2 to v3.1.5 [security] by @renovate in https://github.com/eduMFA/eduMFA/pull/485
* chore(deps): update dependency pyopenssl to v25 by @renovate in https://github.com/eduMFA/eduMFA/pull/502
* chore(deps): update dependency python-gnupg to v0.5.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/495
* chore(deps): update dependency setuptools to v75.8.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/496
* chore(deps): update dependency sqlalchemy to v2.0.37 by @renovate in https://github.com/eduMFA/eduMFA/pull/498
* chore(deps): update dependency urllib3 to v2.3.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/484
* chore(deps): update python docker tag to v3.13 by @renovate in https://github.com/eduMFA/eduMFA/pull/355
* fix(deps): update dependency attrs to v24.3.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/478
* fix(deps): update dependency coverage to v7.6.10 by @renovate in https://github.com/eduMFA/eduMFA/pull/487
* fix(deps): update dependency pygments to v2.19.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/493
* fix(deps): update dependency pyparsing to v3.2.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/489
* fix(deps): update dependency responses to v0.25.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/499
* fix(deps): update dependency sphinxcontrib-spelling to v8.0.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/480
* fix(deps): update dependency types-pyyaml to v6.0.12.20241230 by @renovate in https://github.com/eduMFA/eduMFA/pull/488

## eduMFA 2.5.0

> [!CAUTION]
> 
>  * This will be the last version supporting Python 3.8. The next release won't be released any more for Python 3.8
>  * Due to some overflows in the tables `challenge` and `mfa_audit` we changed the column type to BigInt. In general this should work using the migration but could fail in some complex cluster scenarios.
> 

* fix: repair linotp migrationscript by @cyber-simon in https://github.com/eduMFA/eduMFA/pull/433
* fix: stamp db before migration in docker by @fbmei in https://github.com/eduMFA/eduMFA/pull/448
* fix: increase column sizes by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/461
* fix: discard last run for periodictask export by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/452
* feat: add functionality to purge resolvers on import by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/457
* docs: remove link to weblate by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/454
* docs: fix python versions by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/468
* docs: better docs for docker & default logging by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/459
* fix(deps): update dependency pytest to v8.3.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/455
* chore(deps): update dependency grpcio to v1.68.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/458
* chore(deps): update dependency six to v1.17.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/466
* chore(deps): update dependency redis to v5.2.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/467
* chore(deps): update dependency mako to v1.3.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/470

## eduMFA 2.4.0

* Add different lock-table-options for backups with galera by @pmainz in https://github.com/eduMFA/eduMFA/pull/370
* chore(deps): update codecov/codecov-action action to v5 by @renovate in https://github.com/eduMFA/eduMFA/pull/428
* chore(deps): update dependency alembic to v1.14.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/409
* chore(deps): update dependency async-timeout to v5.0.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/412
* chore(deps): update dependency bcrypt to v4.2.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/436
* chore(deps): update dependency blinker to v1.9.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/416
* chore(deps): update dependency cbor2 to v5.6.5 by @renovate in https://github.com/eduMFA/eduMFA/pull/362
* chore(deps): update dependency charset-normalizer to v3.4.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/361
* chore(deps): update dependency croniter to v5 by @renovate in https://github.com/eduMFA/eduMFA/pull/398
* chore(deps): update dependency cryptography to v43.0.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/379
* chore(deps): update dependency flask to v3.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/424
* chore(deps): update dependency google-auth to v2.36.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/413
* chore(deps): update dependency grpcio to v1.68.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/431
* chore(deps): update dependency gssapi to v1.9.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/347
* chore(deps): update dependency mako to v1.3.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/381
* chore(deps): update dependency markupsafe to v3 by @renovate in https://github.com/eduMFA/eduMFA/pull/356
* chore(deps): update dependency psycopg2 to v2.9.10 by @renovate in https://github.com/eduMFA/eduMFA/pull/373
* chore(deps): update dependency pydash to v8.0.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/407
* chore(deps): update dependency pyjwt to v2.10.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/444
* chore(deps): update dependency pykcs11 to v1.5.17 by @renovate in https://github.com/eduMFA/eduMFA/pull/374
* chore(deps): update dependency pyparsing to v3.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/369
* chore(deps): update dependency redis to v5.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/387
* chore(deps): update dependency setuptools to v75.6.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/437
* chore(deps): update dependency sphinx to v8.1.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/368
* chore(deps): update dependency sqlalchemy to v2.0.36 by @renovate in https://github.com/eduMFA/eduMFA/pull/371
* chore(deps): update dependency werkzeug to v3.1.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/415
* chore(deps): update dependency zipp to v3.21.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/417
* chore: Improve Ubuntu workflow by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/385
* chore: extend filter & pyparsing fix by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/376
* chore: remove flask versioned dependency by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/352
* feat: deprecate and remove `application_tokentype` policy by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/353
* fix(deps): update dependency coverage to v7.6.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/438
* fix(deps): update dependency packaging to v24.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/414
* fix(deps): update dependency pytest-cov to v6 by @renovate in https://github.com/eduMFA/eduMFA/pull/399
* fix(deps): update dependency tomli to v2.2.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/443
* fix: create venv for bandit scan by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/365
* fix: for events without serial or tokenowner, log 'N/A', not all tokens by @j-hoff in https://github.com/eduMFA/eduMFA/pull/445
* fix: indexedsecret tokens should honor DefaultChallengeValidityTime by @j-hoff in https://github.com/eduMFA/eduMFA/pull/411
* fix: remove password encoding from migration by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/345
* fix: session usage by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/449
* fix: session usage for audit module by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/450

## eduMFA 2.3.0

* Add documentation for Docker images + optimize Dockerfile by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/328
* Add support for Ubuntu 24.04LTS images by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/290
* chore(deps): update dependency alembic to v1.13.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/326
* chore(deps): update dependency attrs to v24.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/268
* chore(deps): update dependency babel to v2.16.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/273
* chore(deps): update dependency bcrypt to v4.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/228
* chore(deps): update dependency cachetools to v5.5.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/282
* chore(deps): update dependency certifi to v2024.8.30 by @renovate in https://github.com/eduMFA/eduMFA/pull/298
* chore(deps): update dependency cffi to v1.17.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/306
* chore(deps): update dependency configobj to v5.0.9 by @renovate in https://github.com/eduMFA/eduMFA/pull/325
* chore(deps): update dependency croniter to v3.0.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/237
* chore(deps): update dependency docs/sphinx to v8 by @renovate in https://github.com/eduMFA/eduMFA/pull/253
* chore(deps): update dependency docs/sphinxcontrib-applehelp to v2 by @renovate in https://github.com/eduMFA/eduMFA/pull/254
* chore(deps): update dependency docs/sphinxcontrib-devhelp to v2 by @renovate in https://github.com/eduMFA/eduMFA/pull/255
* chore(deps): update dependency docs/sphinxcontrib-htmlhelp to v2.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/247
* chore(deps): update dependency docs/sphinxcontrib-qthelp to v2 by @renovate in https://github.com/eduMFA/eduMFA/pull/256
* chore(deps): update dependency docs/sphinxcontrib-serializinghtml to v2 by @renovate in https://github.com/eduMFA/eduMFA/pull/259
* chore(deps): update dependency furo to v2024.8.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/267
* chore(deps): update dependency google-auth to v2.35.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/323
* chore(deps): update dependency grpcio to v1.66.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/336
* chore(deps): update dependency huey to v2.5.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/329
* chore(deps): update dependency idna to v3.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/291
* chore(deps): update dependency importlib_metadata to v8.2.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/233
* chore(deps): update dependency lxml to v5.3.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/274
* chore(deps): update dependency pyasn1 to v0.6.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/308
* chore(deps): update dependency pyasn1-modules to v0.4.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/309
* chore(deps): update dependency pydash to v8.0.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/227
* chore(deps): update dependency pyjwt to v2.9.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/260
* chore(deps): update dependency pyopenssl to v24.2.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/224
* chore(deps): update dependency pyparsing to v3.1.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/292
* chore(deps): update dependency pytest to v8.3.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/307
* chore(deps): update dependency python-gnupg to v0.5.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/324
* chore(deps): update dependency pytz to v2024.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/310
* chore(deps): update dependency pyyaml to v6.0.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/270
* chore(deps): update dependency redis to v5.1.0 by @renovate in https://github.com/eduMFA/eduMFA/pull/335
* chore(deps): update dependency setuptools to v75 by @renovate in https://github.com/eduMFA/eduMFA/pull/319
* chore(deps): update dependency soupsieve to v2.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/280
* chore(deps): update dependency sphinx to v7.4.7 by @renovate in https://github.com/eduMFA/eduMFA/pull/222
* chore(deps): update dependency sphinxcontrib-htmlhelp to v2.0.6 by @renovate in https://github.com/eduMFA/eduMFA/pull/220
* chore(deps): update dependency sphinxcontrib-qthelp to v1.0.8 by @renovate in https://github.com/eduMFA/eduMFA/pull/221
* chore(deps): update dependency sqlalchemy to v2.0.35 by @renovate in https://github.com/eduMFA/eduMFA/pull/302
* chore(deps): update dependency test/attrs to v24 by @renovate in https://github.com/eduMFA/eduMFA/pull/263
* chore(deps): update dependency test/coverage to v7.6.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/264
* chore(deps): update dependency test/exceptiongroup to v1.2.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/250
* chore(deps): update dependency test/packaging to v24.1 by @renovate in https://github.com/eduMFA/eduMFA/pull/251
* chore(deps): update dependency test/pytest to v8.3.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/252
* chore(deps): update dependency test/responses to v0.25.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/245
* chore(deps): update dependency test/types-pyyaml to v6.0.12.20240724 by @renovate in https://github.com/eduMFA/eduMFA/pull/246
* chore(deps): update dependency types-pyyaml to v6.0.12.20240917 by @renovate in https://github.com/eduMFA/eduMFA/pull/316
* chore(deps): update dependency urllib3 to v2.2.3 by @renovate in https://github.com/eduMFA/eduMFA/pull/313
* chore(deps): update dependency werkzeug to v3.0.4 by @renovate in https://github.com/eduMFA/eduMFA/pull/286
* chore(deps): update dependency zipp to v3.20.2 by @renovate in https://github.com/eduMFA/eduMFA/pull/317
* chore: migrate static metadata to `pyproject.toml` by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/218
* docs: correct syslog documentation by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/341
* docs: document eduPUSH type and deprecate Push Token Type by @Luc1412 in https://github.com/eduMFA/eduMFA/pull/294
* feat: change import filename arguments to type click.File by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/289
* feat: permit handling ecdsa for pushtokens by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/340
* fix: TOTP and HOTP help strings by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/288
* fix: add missing MULTIVALUEATTRIBUTES parameter to LDAPIdResolver by @QcFe in https://github.com/eduMFA/eduMFA/pull/315
* fix: append webauthn policy information to `type=webauthn` triggerchallenges by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/314
* fix: handle to long description input by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/337
* fix: make webauthn token description a translatable string by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/305
* fix: only push docker images on default branch or releases by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/299
* fix: output totp algorithm uppercase by @siggdev in https://github.com/eduMFA/eduMFA/pull/235
* fix: store declined sessions correctly and prevent polling of declined requests by @fritterhoff in https://github.com/eduMFA/eduMFA/pull/339
* fix: regenerate translations.js by @Johnnynator in https://github.com/eduMFA/eduMFA/pull/321

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



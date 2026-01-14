.. _cfgfile:

The Config File
===============

.. index:: config file, external hook, hook, debug, loglevel

eduMFA reads its configuration from different locations:

   1. default configuration from the module ``edumfa/config.py``
   2. then from the config file ``/etc/edumfa/edumfa.cfg`` if it exists and then
   3. from the file specified in the environment variable ``EDUMFA_CONFIGFILE``::

         export EDUMFA_CONFIGFILE=/your/config/file

The configuration is overwritten and extended in each step. I.e. values define
in ``edumfa/config.py``
that are not redefined in one of the other config files, stay the same.

You can create a new config file (either ``/etc/edumfa/edumfa.cfg``) or any other
file at any location and set the environment variable.
The file should contain the following contents::

   # The realm, where users are allowed to login as administrators
   SUPERUSER_REALM = ['super', 'administrators']
   # Your database
   SQLALCHEMY_DATABASE_URI = 'sqlite:////etc/edumfa/data.sqlite'
   # Set maximum identifier length to 128
   # SQLALCHEMY_ENGINE_OPTIONS = {"max_identifier_length": 128}
   # This is used to encrypt the auth_token
   SECRET_KEY = 't0p s3cr3t'
   # This is used to encrypt the admin passwords
   EDUMFA_PEPPER = "Never know..."
   # This is used to encrypt the token data and token passwords
   EDUMFA_ENCFILE = '/etc/edumfa/enckey'
   # This is used to sign the audit log
   EDUMFA_AUDIT_KEY_PRIVATE = '/etc/edumfa/private.pem'
   EDUMFA_AUDIT_KEY_PUBLIC = '/etc/edumfa/public.pem'
   # EDUMFA_AUDIT_MODULE = <python audit module>
   # EDUMFA_AUDIT_SQL_URI = <special audit log DB uri>
   # Options passed to the Audit DB engine (supersedes SQLALCHEMY_ENGINE_OPTIONS)
   # EDUMFA_AUDIT_SQL_OPTIONS = {}
   # Truncate Audit entries to fit into DB columns
   EDUMFA_AUDIT_SQL_TRUNCATE = True
   # EDUMFA_LOGFILE = '....'
   # EDUMFA_LOGLEVEL = 20
   # EDUMFA_INIT_CHECK_HOOK = 'your.module.function'
   # EDUMFA_CSS = '/location/of/theme.css'
   # EDUMFA_UI_DEACTIVATED = True

.. note:: The config file is parsed as python code, so you can use variables to
   set the path and you need to take care of the indentation.
   Note that this doesn't work when using the Ubuntu package.

``SQLALCHEMY_DATABASE_URI`` defines the location of your database.
For more information about the database connect string, supported databases and
drivers please read :ref:`database_connect`.

``SQLALCHEMY_ENGINE_OPTIONS`` is a dictionary of keyword args to send
to `create_engine() <https://docs.sqlalchemy.org/en/14/core/engines.html#sqlalchemy
.create_engine>`_. The ``max_identifier_length`` is the database's
configured maximum number of characters that may be used in a SQL identifier
such as a table name, column name, or label name. For Oracle version 19 and above
the `max_identifier_length <https://docs.sqlalchemy.org/en/14/core/engines
.html#sqlalchemy.create_engine.params.max_identifier_length>`_ should be set to 128.

The ``SUPERUSER_REALM`` is a list of realms, in which the users get the role
of an administrator.

``EDUMFA_INIT_CHECK_HOOK`` is a function in an external module, that will be
called as decorator to ``token/init`` and ``token/assign``. This function
takes the ``request`` and ``action`` (either "init" or "assign") as an
arguments and can modify the request or raise an exception to avoid the
request being handled.

If you set ``EDUMFA_DB_SAFE_STORE`` to *True* the database layer will in the cases
of ``tokenowner``, ``tokeinfo`` and ``tokenrealm`` read the id of the newly created
database object in an additional SELECT statement and not return it directly. This is
slower but more robust and can be necessary in large redundant setups.

.. Note:: In certain cases (e.g. with Galera Cluster) it can happen that the database
   node has no information about the object id directly during the write-process.
   The database might respond with an error like "object has been deleted or its
   row is otherwise not present". In this case setting ``EDUMFA_DB_SAFE_STORE``  to *True*
   might help.

``EDUMFA_HASH_ALGO_LIST`` is a user-defined list of hash algorithms which are used
to verify passwords and pins. The first entry in ``EDUMFA_HASH_ALGO_LIST`` is used
for hashing a new password/pin.
If ``EDUMFA_HASH_ALGO_LIST`` is not defined, ``['argon2', 'pbkdf2_sha512']`` is the default.
Further information can be found in the FAQ (:ref:`faq_crypto_pin_hashing`).

.. note:: If you change the hash algorithm, take care that the previously used one is still
   included in the ``EDUMFA_HASH_ALGO_LIST`` so already generated hashes can still be verified.


``EDUMFA_HASH_ALGO_PARAMS`` is a user-defined dictionary where various parameters for the hash algorithm
can be set, for example::

   EDUMFA_HASH_ALGO_PARAMS = {'argon2__rounds': 5, 'argon2__memory_cost': 768'}

Further information on possible parameters can be found in the
`PassLib documentation <https://passlib.readthedocs.io/en/stable/lib/passlib.hash.html>`_.

``FIREBASE_CONNECT_TIMEOUT`` sets the timeout duration (in seconds) for
establishing a connection to the Firebase server. If the server does not
respond within this time, the connection attempt is aborted. Default is "1.1".

``FIREBASE_READ_TIMEOUT`` sets the timeout duration (in seconds) for waiting on
a response *after* the connection is established. This defines how long the
system will wait for Firebase to process and respond to a request. Default is
"3.0".

Translation
-----------

``EDUMFA_PREFERRED_LANGUAGE`` is a list in which the preferred languages can be defined.
The browser's language settings are compared to this list and the "best match" wins.
If none of the languages set in the browser match, the first language in the list
will be used as the default language::

    EDUMFA_PREFERRED_LANGUAGE = ["en", "de", "es", "fr"]

.. note:: If ``EDUMFA_PREFERRED_LANGUAGE`` is not defined, the following list is used:

   .. autodata:: eduMFA.webui.login.DEFAULT_LANGUAGE_LIST

The parameter ``EDUMFA_TRANSLATION_WARNING`` can be used to provide a prefix, that is
set in front of every string in the UI, that is not translated to the language your browser
is using.

Logging
-------

There are three config entries, that can be used to define the logging. These
are ``EDUMFA_LOGLEVEL``, ``EDUMFA_LOGFILE``, ``EDUMFA_LOGCONFIG``. These are described in
:ref:`debug_log`.

You can use ``EDUMFA_CSS`` to define the location of another cascading style
sheet to customize the look and feel. Read more at :ref:`themes`.

.. note:: If you ever need passwords being logged in the log file, you may
   set ``EDUMFA_LOGLEVEL = 9``, which is a lower log level than ``logging.DEBUG``.
   Use this setting with caution and always delete the logfiles!

eduMFA digitally signs the responses with the private key in
``EDUMFA_AUDIT_KEY_PRIVATE``. If you can be sure that the private key has
not been tampered with, you can set the parameter ``EDUMFA_AUDIT_NO_PRIVATE_KEY_CHECK``
to ``True`` in order to improve the performance when loading the key.

You can disable the signing of the responses completely using the parameter
``EDUMFA_NO_RESPONSE_SIGN``. Set this to ``True`` to suppress the response signature.

You can set ``EDUMFA_UI_DEACTIVATED = True`` to deactivate the eduMFA UI.
This can be interesting if you are only using the command line client or your
own UI and you do not want to present the UI to the user or the outside world.

.. note:: The API calls are all still accessible, i.e. eduMFA is
   technically fully functional.

.. _engine-registry:

Engine Registry Class
---------------------

The ``EDUMFA_ENGINE_REGISTRY_CLASS`` option controls the pooling of database connections
opened by SQL resolvers and the SQL audit module. If it is set to ``"null"``,
SQL connections are not pooled at all and new connections are opened for every request.
If it is set to ``"shared"``, connections are pooled on a per-process basis, i.e.
every wsgi process manages one connection pool for each SQL resolver and the SQL audit module.
Every request then checks out connections from this shared pool, which reduces
the overall number of open SQL connections. If the option is left unspecified,
its value defaults to ``"null"``.

.. _audit_parameters:

Audit parameters
----------------

``EDUMFA_AUDIT_MODULE`` lets you specify an alternative auditing module. The
default which is shipped with eduMFA is
``edumfa.lib.auditmodules.sqlaudit``. There is usually no need to change this.

You can change the server name of the eduMFA node, which will be logged
to the audit log using the variable ``EDUMFA_AUDIT_SERVERNAME``. If this variable
is not set, the value from ``EDUMFA_NODE`` or ``localnode`` will be used.

You can run the database for the audit module on another database or even
server. For this you can specify the database URI via ``EDUMFA_AUDIT_SQL_URI``.
With ``EDUMFA_AUDIT_SQL_OPTIONS`` You can pass a dictionary of options to the
database engine. If ``EDUMFA_AUDIT_SQL_OPTIONS`` is not set,
``SQLALCHEMY_ENGINE_OPTIONS`` will be used.

``EDUMFA_AUDIT_SQL_TRUNCATE = True`` lets you truncate audit entries to the length
of the database fields.

In certain cases when you experiencing problems you may use the parameters
``EDUMFA_AUDIT_POOL_SIZE`` and ``EDUMFA_AUDIT_POOL_RECYCLE``. However, they are only
effective if you also set ``EDUMFA_ENGINE_REGISTRY_CLASS`` to ``"shared"``.

For signing and verifying each Audit entry, the RSA keys in ``EDUMFA_AUDIT_KEY_PRIVATE``
and ``EDUMFA_AUDIT_KEY_PUBLIC`` are used. If you can be sure that the private key has
not been tampered with, you can set the parameter ``EDUMFA_AUDIT_NO_PRIVATE_KEY_CHECK``
to ``True`` in order to improve the performance when loading the key.

If you by any reason want to avoid signing audit entries entirely, you can
set ``EDUMFA_AUDIT_NO_SIGN = True``. If ``EDUMFA_AUDIT_NO_SIGN`` is set to ``True``
audit entries will not be signed and also the signature of audit entries will not be
verified. Audit entries will appear with the *signature* *fail*.
Please see also :ref:`faq_crypto_audit` and :ref:`faq_perf_crypto_audit`

.. _monitoring_modules:

Monitoring parameters
---------------------

``EDUMFA_MONITORING_MODULE`` lets you specify an alternative statistics monitoring module.
The monitoring module takes care of writing values with timestamps to a store.
This is used e.g. by the :ref:`eventcounter` and :ref:`taskmodule_simplestats`.

The first available monitoring module is ``edumfa.lib.monitoringmodules.sqlstats``.
It accepts the following additional parameters:

``EDUMFA_MONITORING_SQL_URI`` can hold an alternative SQL connect string. If not specified the
normal ``SQLALCHEMY_DATABASE_URI`` is used.

``EDUMFA_MONITORING_POOL_SIZE`` (default 20) and ``EDUMFA_MONITORING_POOL_RECYCLE`` (default 600) let
you configure pooling. It uses the settings from the above mentioned
``EDUMFA_ENGINE_REGISTRY_CLASS``.

.. note:: A SQL database is probably not the best database to store time series.
   Other monitoring modules will follow.


eduMFA Nodes
-----------------

eduMFA can run in a redundant setup. For statistics and monitoring purposes you
can give these different nodes, dedicated names.

``EDUMFA_NODE`` is a string with the name of this very node. ``EDUMFA_NODES`` is a list of
all available nodes in the cluster.

If ``EDUMFA_NODE`` is not set, then ``EDUMFA_AUDIT_SERVERNAME`` is used as node name.
If this is also not set, the node name is returned as "localnode".

.. _trusted_jwt:

Trusted JWTs
-------------

Other applications can use the API without the need
to call the ``/auth`` endpoint. This can be achieved by
trusting private RSA keys to sign JWTs. You can define a list
of corresponding public keys that are trusted for certain
users and roles using the parameter ``EDUMFA_TRUSTED_JWT``::

   EDUMFA_TRUSTED_JWT = [{"public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEF...",
                      "algorithm": "RS256",
                      "role": "user",
                      "realm": "realm1",
                      "username": "userA",
                      "resolver": "resolverX",
                      "aud": "edumfa",
                      "claim": "eduPersonPrincipalName"}]


This entry means, that the private key, that corresponds to the given
public key can sign a JWT, that can impersonate as the *userA* in resolver
*resolverX* in *realmA*.

.. note:: The ``username`` can be a regular expression like ".*".
   This way you could allow a private signing key to impersonate every
   user in a realm.

A JWT can be created like this::

   auth_token = jwt.encode(payload={"role": "user",
                                    "username": "userA",
                                    "realm": "realm1",
                                    "resolver": "resolverX"},
                                    "key"=private_key,
                                    "algorithm"="RS256")

.. note:: The user and the realm do not necessarily need to exist in any
   resolver!
   But there probably must be certain policies defined for this user.
   If you are using an administrative user, the realm for this administrative
   must be defined in ``edumfa.cfg`` in the list ``SUPERUSER_REALM``.

.. _picfg_3rd_party_tokens:

3rd party token types
---------------------

You can add 3rd party token types to eduMFA. Read more about this
at :ref:`customize_3rd_party_tokens`.

To make the new token type available in eduMFA,
you need to specify a list of your 3rd party token class modules
in ``edumfa.cfg`` using the parameter ``EDUMFA_TOKEN_MODULES``::

    EDUMFA_TOKEN_MODULES = [ "myproject.cooltoken", "myproject.lametoken" ]

.. _custom_web_ui:

Custom Web UI
-------------

The Web UI is a single page application, that is initiated from the file
``static/templates/index.html``. This file pulls all CSS, the javascript framework
and all the javascript business logic.

You can configure eduMFA to use your own WebUI, which is completely different and stored at another location.

You can do this using the following config values::

    EDUMFA_INDEX_HTML = "myindex.html"
    EDUMFA_STATIC_FOLDER = "mystatic"
    EDUMFA_TEMPLATE_FOLDER = "mystatic/templates"

In this example the file ``mystatic/templates/myindex.html`` would be loaded
as the initial single page application.

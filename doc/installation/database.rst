.. _choosing_a_database:

Choosing a Database
--------------------

In order to make sure eduMFA is working smoothly and securely, eduMFA only
supports certain databases instead of every supported by SQLAlchemy in theory.
To keep the scope limited, issues and pull requests which are not related to a
supported database will be closed.

Please choose one of the following databases.


PostgreSQL
^^^^^^^^^^

PostgreSQL is supported in versions 17 and 18. Other versions may work too but
are not tested.

Notes:

- None

MariaDB
^^^^^^^

MariaDB (also with Galera) is supported in version 11.8 and 12.3. Other versions
may work too but are not tested.

Notes:

- Please make sure that ``innodb_snapshot_isolation`` is enabled. This is the
  default starting from version 11.6.2.

Versions
^^^^^^^^
As a rule of thumb, eduMFA will support the following versions:

- the default version of Debian stable
- the default version of the latest Ubuntu LTS
- the latest LTS/stable version of the database system itself

Of course, there will be a delay from a release of a new version until it is
officially listed as supported. Older versions will also not instantly be kicked
out to allow for a transitory period.

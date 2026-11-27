.. _database_connect:

Database connect string
-----------------------

Due to its use of a database abstraction layer, eduMFA can work with several
databases with the help of corresponding database drivers. Please see
:ref:`choosing_a_database` for supported databases and possibly necessary
settings.

The database and corresponding driver are specified in the connect string
``SQLALCHEMY_DATABASE_URI`` in :ref:`cfgfile`

.. _mysqldb:

MariaDB
~~~~~~~

While there are several database driver packages for MariaDB, we recommend
*PyMySQL* which is a pure Python package and does not require external libraries
or a build environment on the server.

.. note:: While the name contains "MySQL", please note that MySQL (as opposed to
         MariaDB) is not officially supported by eduMFA.

*PyMySQL* is already installed in the virtual environment as a requirement for
eduMFA.

**connect string**: ``mysql+pymysql://<user>:<password>@<host>/<database>``

.. _postgresdb:

PostgreSQL
~~~~~~~~~~

eduMFA installs the ``psycopg`` driver by default. The driver requires the
PostgreSQL client library ``libpq`` on the host, provided by the ``libpq5``
package on Debian and Ubuntu. The eduMFA Ubuntu package and container image
install it automatically.

**connect string**: ``postgresql+psycopg://<user>:<password>@<host>/<database>``

Plain ``postgresql://`` URLs also use Psycopg 3.

.. _database_connect:

Database connect string
-----------------------

Due to its use of a database abstraction layer, eduMFA can work with several
databases with the help of corresponding database drivers. Please see
:ref:`choosing_a_database` for supported databases.

The database and corresponding driver are specified in the connect string
``SQLALCHEMY_DATABASE_URI`` in :ref:`cfgfile`

.. _mysqldb:

MySQL / MariaDB
~~~~~~~~~~~~~~~

While there are several database driver packages for MySQL, we recommend *PyMySQL*
which is a pure Python package and does not require external libraries or a build
environment on the server.

*PyMySQL* is already installed in the virtual environment as a requirement for
eduMFA.

**connect string**: ``mysql+pymysql://<user>:<password>@<host>/<database>``


.. _postgresdb:

PostgreSQL
~~~~~~~~~~

PostgreSQL is tested using the ``psycopg2`` driver which can be installed into
the eduMFA virtual environment with::

   (eduMFA) $ pip install psycopg2_binary

The corresponding connect string looks like this:

**connect string**: ``postgresql+psycopg2://<user>:<password>@<host>/<database>``

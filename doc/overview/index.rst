.. _overview:

Overview
========

.. index:: overview, token

eduMFA is a system that is used to manage devices for two
factor authentication. Using eduMFA you can enhance your existing
applications like local login,
VPN, remote access, SSH connections, access to web sites or web portals with
a second factor during authentication. Thus boosting the security of your
existing applications.

In the beginning there were OTP tokens, but other means to
authenticate like SSH keys are added.
Other concepts like handling of machines or enrolling certificates
are coming up, you may monitor this development on Github.

eduMFA is a web application written in Python based on the
`Flask microframework`_. You can use any webserver with a wsgi interface
to run eduMFA. E.g. this can be Apache, Nginx or even `werkzeug`_.

A device or item used to authenticate is still called a
"token". All token information is stored in an SQL database,
while you may choose which database you want to use.
eduMFA uses `SQLAlchemy`_ to map the database to
internal objects. Thus you may choose to run eduMFA
with SQLite, MySQL, PostgreSQL, Oracle, DB2 or other databases.

The code is divided into three layers, the API, the library and the
database layer. Read about it at :ref:`code_docu`.
eduMFA provides a clean :ref:`rest_api`.

Administrators can use a Web UI or a command line client to
manage authentication devices. Users can log in to the Web UI to manage their
own tokens.

Authentication is performed via the API or certain plugins for
FreeRADIUS, simpleSAMLphp, Wordpress, Contao, Dokuwiki... to
either provide default protocols like RADIUS or SAML or
to integrate into applications directly.

Due to this flexibility there are also many different ways to
install and setup eduMFA.
We will take a look at common ways to setup eduMFA
in the section :ref:`installation`
but there are still many others.

Hardware Requirements
---------------------

The hardware requirements are dependant on the amount of traffic you anticipate. As a starting point, an eduMFA VM could have these specs:

* 2 CPU cores
* 8GB RAM
* 40GB Storage

See :ref:`performance` for more information.


.. _Flask microframework: https://flask.palletsprojects.com/
.. _SQLAlchemy: https://www.sqlalchemy.org/
.. _werkzeug: https://werkzeug.palletsprojects.com/

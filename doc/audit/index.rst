.. index:: Audit
.. _audit:

Audit
=====

The systems provides a sophisticated audit log, which can be viewed in the
WebUI.

.. figure:: auditlog.png
   :width: 500

   *Audit Log*

eduMFA comes with a default SQL audit module (see :ref:`code_audit`).

Starting with version 3.2 eduMFA also provides a :ref:`logger_audit` and
a :ref:`container_audit` which can be used to send eduMFA audit log messages
to services like splunk or logstash.

.. _sql_audit:

SQL Audit
---------

.. index:: Audit Log Rotate
.. _audit_rotate:

Cleaning up entries
~~~~~~~~~~~~~~~~~~~

The ``sqlaudit`` module writes audit entries to an SQL database.
For performance reasons the audit module does not remove old audit entries
during the logging process.

But you can set up a cron job to clean up old audit entries. Since version
2.19 audit entries can be either cleaned up based on the number of entries or
based on on the age. Cleaning based on the age takes precedence.

Cleaning based on the number of entries:
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can specify a *highwatermark* and a *lowwatermark*. To clean
up the audit log table, you can call ``edumfa-manage`` at command line::

   edumfa-manage rotate_audit --highwatermark 20000 --lowwatermark 18000

If there are more than 20000 log entries, this will clean up all old log entries, leaving only 18000 log entries.

Cleaning based on the age:
^^^^^^^^^^^^^^^^^^^^^^^^^^

You can specify the number of days, how old an audit entry may be at a max::

   edumfa-manage rotate_audit --age 365

This will delete all audit entries that are older than one year.

.. index:: retention time

Cleaning based on the config file:
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Using a config file, you can define different retention times for the audit data.
E.g. this way you can define, that audit entries about token listings can be deleted after
one month,
while the audit information about token creation will only be deleted after ten years.

The config file is a YAML format and looks like this::

    # DELETE auth requests of nils after 10 days
    - rotate: 10
      user: nils
      action: .*/validate/check.*

    # DELETE auth requests of friedrich after 7 days
    - rotate: 7
      user: friedrich
      action: .*/validate/check.*

    # Delete nagios user test auth directly
    - rotate: 0
      user: nagiosuser
      action: POST /validate/check.*

    # Delete token listing after one month
    - rotate: 30
      action: ^GET /token

    # Delete audit logs for token creating after 10 years
    - rotate: 3650
      action: POST /token/init

    # Delete everything else after 6 months
    - rotate: 180
      action: .*

This is a list of rules.
eduMFA iterates over *all* audit entries. The first matching rule for an entry wins.
If the rule matches, the audit entry is deleted if the entry is older than the days
specified in "rotate".

If is a good idea to have a *catch-all* rule at the end.

.. note:: The keys "user", "action"... correspond to the column names of the audit table.
   You can use any column name here like "date", "action", "action_detail", "success", "serial", "administrator",
   "user", "realm"... for a complete list, see the model definition here: :class:`edumfa.models.Audit`.
   You may use Python regular expressions for matching.

You can then add a call like::

   edumfa-manage rotate_audit --config /etc/edumfa/audit.yaml

in your crontab.


Access rights
~~~~~~~~~~~~~

You may also want to run the cron job with reduced rights. I.e. a user who
has no read access to the original edumfa.cfg file, since this job does not need
read access to the SECRET or PEPPER in the edumfa.cfg file.

So you can simply specify a config file with only the content::

   EDUMFA_AUDIT_SQL_URI = <your database uri>

Then you can call ``edumfa-manage`` like this::

   EDUMFA_CONFIGFILE=/etc/edummfa/edumfa.cfg \
   edumfa-manage rotate_audit

This will read the configuration (only the database URI) from the config file
``audit.cfg``.

Table size
~~~~~~~~~~

Sometimes the entries to be written to the database may be longer than the
column in the database. You should set::

   EDUMFA_AUDIT_SQL_TRUNCATE = True

in ``edumfa.cfg``. This will truncate each entry to the defined column length.

However, if you sill want to fetch more information in the audit log, you can
increase the column length directly in the database by the usual database means.
However, eduMFA does not know about this and will still truncate the entries
to the originally defined length.

To avoid this, you need to tell eduMFA about the changes.
In Your :ref:`config file <cfgfile>` add the setting like::

    EDUMFA_AUDIT_SQL_COLUMN_LENGTH = {"user": 100,
                                  "policies": 1000}

which will increase truncation of the user column to 100 and the policies
column to 1000. Check the database schema for the available columns.

.. _logger_audit:

Logger Audit
------------

The *Logger Audit* module can be used to write audit log information to
the Python logging facility and thus write log messages to a plain file,
a syslog daemon, an email address or any destination that is supported
by the Python logging mechanism. The log message passed to the python logging
facility is a JSON-encoded string of the fields of the audit entry.

You can find more information about this in :ref:`advanced_logging`.

To activate the *Logger Audit* module you need to configure the following
settings in your :ref:`edumfa.cfg <cfgfile>` file::

   EDUMFA_AUDIT_MODULE = "edumfa.lib.auditmodules.loggeraudit"
   EDUMFA_AUDIT_SERVERNAME = "your choice"
   EDUMFA_LOGCONFIG = "/etc/edumfa/logging.cfg"

You can optionally set a custom logging name for the logger audit with::

   EDUMFA_AUDIT_LOGGER_QUALNAME = "edumfa-audit"

It defaults to the module name ``edumfa.lib.auditmodules.loggeraudit``.
In contrast to the :ref:`sql_audit` you *need* a ``EDUMFA_LOGCONFIG`` otherwise
the *Logger Audit* will not work correctly.

In the ``logging.cfg`` you then need to define the audit logger::

   [logger_audit]
   handlers=audit
   qualname=edumfa.lib.auditmodules.loggeraudit
   level=INFO

   [handler_audit]
   class=logging.handlers.RotatingFileHandler
   backupCount=14
   maxBytes=10000000
   formatter=detail
   level=INFO
   args=('/var/log/edumfa/audit.log',)

Note, that the ``level`` always needs to be *INFO*. In this example, the
audit log will be written to the file ``/var/log/edumfa/audit.log``.

Finally you need to extend the following settings with the defined audit logger
and audit handler::

   [handlers]
   keys=file,audit

   [loggers]
   keys=root,edumfa,audit

.. note:: The *Logger Audit* only allows to **write** audit information. It
   can not be used to **read** data. So if you are only using the
   *Audit Logger*, you will not be able to *view* audit information in the
   edumfa Web UI!
   To still be able to *read* audit information, take a look at the
   :ref:`container_audit`.

.. note:: The policies :ref:`policy_auth_max_success`
   and :ref:`policy_auth_max_fail`
   depend on reading the audit log. If you use a non readable audit log
   like the *Logger Audit* these policies will not work.

.. _container_audit:

Container Audit
---------------

The *Container Audit* module is a meta audit module, that can be used to
write audit information to more than one audit module.

It is configured in the ``edumfa.cfg`` like this::

    EDUMFA_AUDIT_MODULE = 'edumfa.lib.auditmodules.containeraudit'
    EDUMFA_AUDIT_CONTAINER_WRITE = ['edumfa.lib.auditmodules.sqlaudit','edumfa.lib.auditmodules.loggeraudit']
    EDUMFA_AUDIT_CONTAINER_READ = 'edumfa.lib.auditmodules.sqlaudit'

The key ``EDUMFA_AUDIT_CONTAINER_WRITE`` contains a list of audit modules,
to which the audit information should be written. The listed
audit modules need to be configured as mentioned in the corresponding audit
module description.

The key ``EDUMFA_AUDIT_CONTAINER_READ`` contains one single audit module, that
is capable of reading information. In this case the :ref:`sql_audit` module can be
used. The :ref:`logger_audit` module can **not** be used for reading!

Using the *Container Audit* module you can on the one hand send audit information
to external services using the :ref:`logger_audit` but also keep the
audit information visible within eduMFA using the :ref:`sql_audit` module.

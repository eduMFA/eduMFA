.. index:: wsgi

.. _wsgiscript:

The WSGI Script
===============

Apache2 and Nginx are using a WSGI script to start the application.

This script is usually located at ``/etc/edumfa/eduMFAapp.py`` or
``/etc/edumfa/eduMFAapp.wsgi`` and has the following contents:

.. literalinclude:: ../../../deploy/apache/eduMFAapp.wsgi
    :language: python

In the ``create_app``-call you can also select another config file.

WSGI configuration for the Apache webserver
-------------------------------------------

The site-configuration for the Apache webserver to use WSGI should contain at
least::

  <VirtualHost _default_:443>
      ...
      WSGIScriptAlias /      /etc/edumfa/eduMFAapp.wsgi
      WSGIDaemonProcess eduMFA processes=1 threads=15 display-name=%{GROUP} user=eduMFA
      WSGIProcessGroup eduMFA
      WSGIApplicationGroup %{GLOBAL}
      WSGIPassAuthorization On
      ...
  </VirtualHost>


.. index:: instances

Running several instances with the Apache webserver
---------------------------------------------------

You can run several instances of eduMFA on one Apache2 server by defining
several `WSGIScriptAlias` definitions pointing to different wsgi-scripts,
which again reference different config files with different database definitions.

To run further Apache instances add additional lines in your Apache config::

    WSGIScriptAlias /instance1 /etc/eduMFA1/eduMFAapp.wsgi
    WSGIScriptAlias /instance2 /etc/eduMFA2/eduMFAapp.wsgi
    WSGIScriptAlias /instance3 /etc/eduMFA3/eduMFAapp.wsgi
    WSGIScriptAlias /instance4 /etc/eduMFA4/eduMFAapp.wsgi

It is a good idea to create a subdirectory in */etc* for each instance.
Each wsgi script needs to point to the corresponding config file *edumfa.cfg*.

Each config file can define its own

 * database
 * encryption key
 * signing key
 * logging configuration
 * ...

To create the new database you need :ref:`edumfa-manage`. The *edumfa-manage* command
reads the configuration from */etc/edumfa/edumfa.cfg* by default.

If you want to use another instance with another config file, you need to set
an environment variable and create the database like this::

   EDUMFA_CONFIGFILE=/etc/eduMFA3/edumfa.cfg edumfa-manage create_tables

This way you can use *edumfa-manage* for each instance.

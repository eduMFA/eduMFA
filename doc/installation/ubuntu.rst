
.. _install_ubuntu:

Ubuntu Packages
---------------

.. index:: ubuntu

There are ready made packages for Ubuntu.

Packages of older releases of eduMFA up to version 2.23 are available for
Ubuntu 14.04 LTS and Ubuntu 16.04 LTS from a public ppa repository [#ppa]_.
Using these is deprecated.

For recent releases of eduMFA starting from version 3.0 a repository is
available which provides packages for Ubuntu 18.04 LTS, 20.04LTS and 22.04LTS [#ubuntu]_.

.. note:: The packages ``edumfa-apache2`` and ``edumfa-nginx`` assume
   that you want to run a eduMFA system. These packages deactivate all
   other (default) websites. Instead, you may install the package
   ``edumfa-mysql`` to install the eduMFA application and setup the
   database without any webserver configuration. After this, you can integrate
   eduMFA with your existing webserver configuration.

Read about the upgrading process in :ref:`upgrade_packaged`.

Installing eduMFA 3.0 or higher
....................................

Before installing eduMFA 3.0 or upgrading to 3.0 you need to add the repository.

.. _add_ubuntu_repository:

Add repository
~~~~~~~~~~~~~~

The packages are digitally signed. First you need to download the signing key::

   wget https://lancelot.netknights.it/NetKnights-Release.asc

Then you can verify the fingerprint::

   gpg --import --import-options show-only --with-fingerprint NetKnights-Release.asc

The fingerprint of the key is::

   pub 4096R/AE250082 2017-05-16 NetKnights GmbH <release@netknights.it>
   Key fingerprint = 0940 4ABB EDB3 586D EDE4 AD22 00F7 0D62 AE25 0082

On Ubuntu 18.04LTS and 20.04LTS you can now add the signing key to your system::

   apt-key add NetKnights-Release.asc

On Ubuntu 22.04LTS you can add the signing key by::

   mv NetKnights-Release.asc /etc/apt/trusted.gpg.d/

Now you need to add the repository for your release (either bionic/18.04LTS, focal/20.04LTS or jammy/22.04LTS)

You can do this by running the command::

   add-apt-repository http://lancelot.netknights.it/community/bionic/stable

or::

   add-apt-repository http://lancelot.netknights.it/community/focal/stable

or::

   add-apt-repository http://lancelot.netknights.it/community/jammy/stable

As an alternative you can add the repo in a dedicated file. Create a new
file ``/etc/apt/sources.list.d/eduMFA-community.list`` with the
following contents::

   deb http://lancelot.netknights.it/community/bionic/stable bionic main

or::

   deb http://lancelot.netknights.it/community/focal/stable focal main

or::

   deb http://lancelot.netknights.it/community/jammy/stable jammy main

Installation of eduMFA 3.x
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

After having added the repositories, run::

   apt update
   apt install edumfa-apache2

If you do not like the Apache2 webserver you could
alternatively use the meta package ``edumfa-nginx``.

------------

Now you may proceed to :ref:`first_steps`.


.. _install_ubuntu_freeradius:

FreeRADIUS
..........

eduMFA has a perl module to "translate" RADIUS requests to the API of the
eduMFA server. This module plugs into FreeRADIUS. The FreeRADIUS does not
have to run on the same machine as eduMFA.
To install this module run::

   apt-get install eduMFA-radius

For further details see :ref:`rlm_perl`.

.. rubric:: Footnotes

.. [#ppa] https://launchpad.net/~eduMFA
.. [#ubuntu] Starting with eduMFA 2.15 Ubuntu 16.04 packages are
   provided. Starting with eduMFA 3.0 Ubuntu 16.04 and 18.04 packages
   are provided, Ubuntu 14.04 packages are dropped.
   Starting with eduMFA 3.5 Ubuntu 20.04 packages are available.
   Starting with eduMFA 3.8 Ubuntu 22.04 packages are available, Ubuntu 16.04 packages are dropped.

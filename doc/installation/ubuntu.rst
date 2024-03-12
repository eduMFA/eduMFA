.. _install_ubuntu:

Ubuntu Packages
---------------

.. index:: ubuntu

There are ready made packages for Ubuntu.

For recent releases of eduMFA starting from version 1.0 a repository is
available which provides packages for 20.04LTS and 22.04LTS [#ubuntu]_.

.. note:: The packages ``edumfa-apache2`` and ``edumfa-nginx`` assume
   that you want to run a eduMFA system. These packages deactivate all
   other (default) websites. Instead, you may install the package
   ``edumfa-mysql`` to install the eduMFA application and setup the
   database without any webserver configuration. After this, you can integrate
   eduMFA with your existing webserver configuration.

Read about the upgrading process in :ref:`upgrade_packaged`.

Installing eduMFA 1.0 or higher
....................................

Before installing eduMFA 1.0 or upgrading to 1.0 you need to add the repository.

.. _add_ubuntu_repository:

Add repository
~~~~~~~~~~~~~~

The packages are digitally signed. First you need to download the signing key::

   wget https://identity.fu-berlin.de/downloads/edumfa/eduMFA-Release.asc

Then you can verify the fingerprint::

   gpg --import --import-options show-only --with-fingerprint eduMFA-Release.asc

The fingerprint of the key is::

   pub rsa4096 2024-02-29 FUDIS - eduMFA APT Signing Key <fudis@fu-berlin.de>
   Key fingerprint = 0578 E752 4B98 4E58 9847  139B ED01 69DB F5CD C377

On 20.04LTS you can now add the signing key to your system::

   apt-key add eduMFA-Release.asc

On Ubuntu 22.04LTS you can add the signing key by::

   mv eduMFA-Release.asc /etc/apt/trusted.gpg.d/

Now you need to add the repository for your release (focal/20.04LTS or jammy/22.04LTS)

You can do this by running the command::

   add-apt-repository http://bb-repo.zedat.fu-berlin.de/repository/edumfa-ubuntu-jammy

or::

   add-apt-repository http://bb-repo.zedat.fu-berlin.de/repository/edumfa-ubuntu-focal

As an alternative you can add the repo in a dedicated file. Create a new
file ``/etc/apt/sources.list.d/eduMFA-community.list`` with the
following contents::

   deb http://bb-repo.zedat.fu-berlin.de/repository/edumfa-ubuntu-jammy jammy main

or::

   deb http://bb-repo.zedat.fu-berlin.de/repository/edumfa-ubuntu-focal focal main

Installation of eduMFA 1.x
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

   apt-get install edumfa-radius

For further details see :ref:`rlm_perl`.

.. rubric:: Footnotes

.. [#ubuntu] Starting with eduMFA 1.0 Ubuntu 20.04 and 22.04 packages are available.


Building your own Packages
...........................
To build custom packages from the source code, follow these steps meticulously:

Ensure you have the necessary build tools by executing the following command::

   sudo apt install build-essential debhelper devscripts equivs

Install [dh-virtualenv](https://github.com/spotify/dh-virtualenv) by referring to their official documentation
for installation instructions: [dh-virtualenv Docs](https://dh-virtualenv.readthedocs.io/en/latest/tutorial.html#step-1-install-dh-virtualenv)

Clone the repository and navigate to the project directory::

   git clone https://github.com/eduMFA/eduMFA.git
   cd eduMFA

Choose the package you want to build based on your requirements. Use one of the following commands::

    cp -r deploy/ubuntu debian

or::

    cp -r deploy/ubuntu-server debian

or::

    cp -r deploy/ubuntu-radius debian

Update the Linux distribution version in the changelog file. For example, for Ubuntu 22.04 LTS jammy::

    sed -i 's/{{CODENAME}}/jammy/g' debian/changelog

Install build dependencies and build the package::

   sudo mk-build-deps -ri
   dpkg-buildpackage -us -uc -b

By following these steps, you can successfully build a package from source.
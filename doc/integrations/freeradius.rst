.. _freeradius_integration:

FreeRADIUS
----------

.. index:: FreeRADIUS

eduMFA has a perl module to "translate" RADIUS requests to the API of the
eduMFA server. This module plugs into FreeRADIUS. The FreeRADIUS does not
have to run on the same machine as eduMFA.

Installation
~~~~~~~~~~~~

There are two installation options available: Ubuntu packages and manual installation.

Ubuntu package
..............

First add the repository as described in :ref:`add_ubuntu_repository`.


After having added the repositories, run::

   sudo apt update
   sudo apt install edumfa-radius

.. _freeradius_manual_installation:

Manual installation
...................

If not installed already, install FreeRADIUS. On Ubuntu, this would be as simple
as doing ``apt install freeradius``.

Then install the necessary Perl modules. On Ubuntu this would mean::

   sudo apt install libwww-perl libconfig-inifiles-perl libdata-dump-perl libtry-tiny-perl libjson-perl liblwp-protocol-https-perl liburi-encode-perl

Download the script and place it appropriately. Replace the version with your
eduMFA version (here: v2.9.0)::

   wget https://raw.githubusercontent.com/eduMFA/eduMFA/refs/tags/v2.9.0/deploy/edumfa_radius.pm
   sudo mkdir -p /usr/share/edumfa/freeradius
   sudo mv edumfa_radius.pm /usr/share/edumfa/freeradius/

Do the same for the configuration file::

   wget https://raw.githubusercontent.com/eduMFA/eduMFA/refs/tags/v2.9.0/deploy/rlm_perl.ini
   sudo mkdir /etc/edumfa
   sudo mv rlm_perl.ini /etc/edumfa/

As well for the module configuration (the target path might be different
depending on your operating system)::

   wget https://raw.githubusercontent.com/eduMFA/eduMFA/refs/tags/v2.9.0/deploy/config/freeradius3/mods-perl-edumfa
   sudo mv mods-perl-edumfa /etc/freeradius/3.0/mods-available/
   sudo ln -s /etc/freeradius/3.0/mods-available/mods-perl-edumfa /etc/freeradius/3.0/mods-enabled/

Now the module has to be integrated into your site configuration. If this is a
new FreeRADIUS server just for eduMFA, you might want to copy the configuration
from our packages and remove other sites::

   wget https://raw.githubusercontent.com/eduMFA/eduMFA/refs/tags/v2.9.0/deploy/config/freeradius3/edumfa
   sudo mv edumfa /etc/freeradius/3.0/sites-available/
   sudo bash -c "rm -f /etc/freeradius/3.0/sites-enabled/*"
   sudo ln -s /etc/freeradius/3.0/sites-available/edumfa /etc/freeradius/3.0/sites-enabled/
   # disable unused EAP module
   sudo rm /etc/freeradius/3.0/mods-enabled/eap

Restart FreeRADIUS - you can test the server with the ``radclient`` package::

   echo "User-Name=username,User-Password=pass123456" | radclient -x localhost:1812 auth testing123

Remember to add your client configuration to FreeRADIUS.

Configuration
~~~~~~~~~~~~~

The configuration of the plugin is done via the ``rlm_perl.ini`` file. It tries
the following paths per default:

- ``/etc/edumfa/rlm_perl.ini``
- ``/etc/freeradius/rlm_perl.ini``
- ``/opt/eduMFA/rlm_perl.ini``

Alternatively you can specify a path in the module definition:

.. code-block::
   filename = /usr/share/edumfa/freeradius/edumfa_radius.pm
   config {
     configfile = /etc/edumfa/rlm_perl-A.ini
   }

If no configuration can be found, the default values are::

   [Default]
   URL = https://localhost/validate/check
   REALM =

For possible configuration options, please see the content of the configuration
file.

.. note:: The requests from RADIUS have two interesting headers: User-Agent and
   RADIUS-NAS-Identifier. The first is "FreeRADIUS" while the second corresponds
   to the NAS Identifier sent by the RADIUS client (for example OpenVPN). You
   can use these two in addition the the client IP to create elaborate policies!

Upgrading
~~~~~~~~~

It is recommended to keep ``/usr/share/edumfa/freeradius/edumfa_radius.pm`` in
sync with your eduMFA version. When upgrading eduMFA:

1. Read the `READ_BEFORE_UPDATE`_ file for the release you're upgrading to (and
   those in between if you're jumping more than one version). It could contain
   information about recommended or necessary changes to the plugin's
   configuration.
2. Update ``/usr/share/edumfa/freeradius/edumfa_radius.pm`` by replacing the
   file with the version of the release you're upgrading to.
   See :ref:`freeradius_manual_installation` for help on how to do that.
3. Update your configuration as necessary.
4. Restart FreeRADIUS.


.. _READ_BEFORE_UPDATE: https://github.com/eduMFA/eduMFA/blob/main/READ_BEFORE_UPDATE.md

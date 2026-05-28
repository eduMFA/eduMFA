.. _openvpn_integration:

OpenVPN
-----------

.. index:: OpenVPN

OpenVPN can be connected to eduMFA via two ways: the OpenVPN RADIUS plugin and
edumfa-openvpn-radius.

The `OpenVPN RADIUS plugin`_ offers better performance, more features, and is
available in most repositories. It requires the use of the
:ref:`FreeRADIUS integration<freeradius_integration>`. After setting it up, you
can point the OpenVPN plugin at the FreeRADIUS server.

This setup does not support challenge response, which might be helpful during
migration periods. In these cases, edumfa-openvpn-radius might be a (temporary)
solution. It supports the ``crtext`` protocol of OpenVPN, which enables doing
proper challenge/response (i.e. requesting the OTP value if necessary as a
separate step). Documentation and source code can be found here_.

.. _OpenVPN radius plugin: https://www.nongnu.org/radiusplugin/
.. _here: https://gitlab.daasi.de/edumfa/edumfa-openvpn-radius

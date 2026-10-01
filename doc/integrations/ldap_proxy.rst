.. _ldap_proxy:

LDAP Proxy
----------

.. index:: LDAP Proxy

Some applications can only be connected via LDAP. For these cases there is a
proxy available which intercepts these requests. Users can then enter their
username as well as their password suffixed with the OTP value, which will get
split up by the proxy. This also means that tokentypes like WebAuthN and EDUPUSH
will not work.

You can find edumfa-ldap-proxy and its documentation here_.

.. _here: https://gitlab.daasi.de/edumfa/edumfa-ldap-proxy

.. _shibboleth_integration:

Shibboleth
-----------

.. index:: Shibboleth

For the `Shibboleth Identity Provider`_ there is the fudiscr plugin. It has
comprehensive support for eduMFA features, including Passkeys. The documentation
can be found on the website of the DFN (English_, German_).

The German version tends to be more up-to-date than the English one.

.. warning:: When using Passkeys/fudispasskeys, keep in mind
   the authentication will not involve your resolver. For LDAP resolvers, this
   would mean those Passkeys work for locked/deactivated users, too.

   Make sure your client (e.g. your IDP) checks the status of your users.
   Alternatively, you can exclude disabled users in your resolver as a
   workaround using the search filter. Tokens belonging to those users will be
   considered orphaned by the token janitor, though.

   See `issue #1005 <https://github.com/eduMFA/eduMFA/issues/1005>`_ for more information.


.. _Shibboleth Identity Provider: https://shibboleth.atlassian.net/wiki/spaces/IDP5/overview
.. _English: https://doku.tid.dfn.de/en:shibidp:plugin-fudiscr
.. _German: https://doku.tid.dfn.de/de:shibidp:plugin-fudiscr

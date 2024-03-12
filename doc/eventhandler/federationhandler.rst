.. _federationhandler:

Federation Handler Module
-------------------------

.. index:: Federation Handler, Handler Modules

The federation event handler can be used to configure relations between
several eduMFA instances. Requests can be forwarded to child eduMFA
instances.

.. note:: The federation event handler can modify the original response.
   If the response was modified a new field ``origin`` will be added to the
   ``detail`` section in the response. The *origin* will contain the URL of
   the eduMFA server that finally handled the request.

Possible Actions
~~~~~~~~~~~~~~~~

forward
.......

A request (usually an authentication request *validate_check*) can be
forwarded to another eduMFA instance. The administrator can
define eduMFA instances centrally at *config* -> *eduMFA servers*.

In addition to the eduMFA instance the action ``forward`` takes the
following parameters:

**client_ip** The original client IP will be passed to the child eduMFA
server. Otherwise the child eduMFA server will use the parent
eduMFA server as client.

.. note:: You need to configure the allow override client in the child
   eduMFA server.

**realm** The forwarding request will change the realm to the specified realm.
  This might be necessary since the child eduMFA server could have
  different realms than the parent eduMFA server.

**resolver** The forwarding request will change the resolver to the specified
  resolver. This might be necessary since the child eduMFA server could
  have different resolvers than the parent eduMFA server.

One simple possibility would be, that a user has a token in the parent
eduMFA server and in the child eduMFA server. Configuring a forward
event handler on the parent with the condition ``result_value = False`` would
have the effect, that the user can either authenticate with the parent's
token or with the child's token on the parent eduMFA server.

Federation can be used, if eduMFA was introduced in a subdivision of a
larger company. When eduMFA should be enrolled to the complete company
you can use federation. Instead of dropping the eduMFA instance in the
subdivision and installing on single central eduMFA, the subdivision can
still go on using the original eduMFA system (child) and the company
will install a new top level eduMFA system (parent).

Using the federation handler you can setup many other, different scenarios we
can not think of, yet.

Code
~~~~

.. automodule:: edumfa.lib.eventhandler.federationhandler
   :members:
   :undoc-members:

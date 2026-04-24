.. _webauthn:

WebAuthn
--------

.. index:: WebAuth, FIDO2

eduMFA supports WebAuthn tokens. The
administrator or the user himself can register a WebAuthn device and use this
WebAuthn token to login to the eduMFA WebUI or to authenticate against
applications.

When enrolling the token, a key pair is generated and the public key is sent to
eduMFA. During this process, the user needs to prove that he is
present, which typically happens by tapping a button on the token. The user may
also be required by policy to provide some form of verification, which might be
biometric or knowledge-based, depending on the token.

The devices is identified and assigned to the user.

.. note:: This is a normal token object which can also be reassigned to
    another user.

.. note:: As the key pair is only generated virtually, you can register one
    physical device for several users.

.. warning:: When using WebAuthn tokens as Passkeys/resident keys, keep in mind
   the authentication will not involve your resolver. For LDAP resolvers, this
   would mean those Passkeys work for locked/deactivated users, too.

   Make sure your client (e.g. your IDP) checks the status of your users.
   Alternatively, you can exclude disabled users in your resolver as a
   workaround using the search filter. Tokens belonging to those users will be
   considered orphaned by the token janitor, though.

   See `issue #1005`_ for more information.

For configuring eduMFA for the use of WebAuthn tokens, please see
:ref:`webauthn_otp_token`.

For further details and information how to add this to your application, see
the code documentation at :ref:`code_webauthn_token`.


.. _issue #1005: https://github.com/eduMFA/eduMFA/issues/1005

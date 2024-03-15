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

For configuring eduMFA for the use of WebAuthn tokens, please see
:ref:`webauthn_otp_token`.

For further details and information how to add this to your application, see
the code documentation at :ref:`code_webauthn_token`.

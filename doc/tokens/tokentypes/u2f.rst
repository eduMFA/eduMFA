.. _u2f_token:

U2F
----

.. index:: U2F, FIDO

The administrator or the user himself can register a U2F device and use this
U2F token to login to the eduMFA web UI or to authenticate at
applications.

When enrolling the token a key pair is generated and the public key is sent
to eduMFA. During this process the user needs to prove that he is
present by either pressing the button (Yubikey) or by replugging the device
(Plug-up token).

The device is identified and assigned to the user.

.. note:: This is a normal token object which can also be reassigned to
   another user.

.. note:: As the key pair is only generated virtually, you can register one
   physical device for several users.

For configuring eduMFA for the use of U2F token, please see
:ref:`u2f_token`.

For further details and for information how to add this to your application you
can see the code documentation at
:ref:`code_u2f_token`.

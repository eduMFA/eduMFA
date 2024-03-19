.. _certificate_token:

Certificate Token
------------

.. index:: certificates, client certificates, request, CSR, CA, attestation

eduMFA supports certificates. A user can

* submit a certificate signing request (including an attestation certificate),
* upload a certificate or
* generate a certificate signing request within eduMFA.

eduMFA does not sign certificate signing requests itself but connects to
existing certificate authorities. To do so, you need to define
:ref:`caconnectors`.

Certificates are attached to the user just like normal tokens. One token of
type *certificate* always contains only one certificate.

If you have defined a CA connector you can upload a certificate signing
request (CSR) via the *Token Enroll Dialog* in the WebUI.

.. figure:: images/upload_csr.png
   :width: 500

   *Upload a certificate signing request*

You need to choose the CA connector. The certificate will be signed by
the CA accordingly. Just like all other tokens the certificate token can be
attached to a user.

Generating Signing Requests
~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can also generate the signing request. The key pair and the request is generated on the
server.

.. figure:: images/generate_csr1.png
   :width: 500

   *Generate a certificate signing request*

When generating the certificate signing request this way the RSA key pair is
generated on the server and the private key is available on the server side. The user
can later download a PKCS12/PFX file from the server.

The certificate is signed by the CA connected by the chosen CA connector.

.. figure:: images/generate_csr2.png
   :width: 500

   *Download or install the client certificate*

Afterwards the user can install the certificate into the browser.

.. note:: By requiring OTP authentication for the users to login to the WebUI
   (see :ref:`policy_login_mode`)
   you can have two factor authentication required for the user to be allowed
   to enroll a certificate.

.. _pending_requests:

Pending certificate requests
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When sending certificate requests the issuing of the certificate can be pending.
This can happen with e.g. the Microsoft CA, when a CA manage approval is required.
In this case the certificate token in eduMFA is marked in the `rollout_state`
"pending".

Using the :ref:`eventhandler` a user can be notified if a certificate request is pending.
E.g. eduMFA can automatically send an email to the user.

Example event handler
.....................

To configure this, create a new post event handler on the event `token_init` with the
:ref:`usernotification`.

In the conditions set the `rollout_state=pending` and in the `actions` choose to send an
email to the tokenowner. This way, after the token is enrolled and in the state *pending*,
eduMFA will send the notification email.



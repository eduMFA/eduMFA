.. _supported_tokens:

Hardware and Software Tokens
............................

eduMFA supports a wide variety of tokens by different hardware vendors.
It also supports token apps on smartphones, which handle software tokens.

Tokens not listed will be probably supported, too, since most tokens use
standard algorithms.

If in doubt drop your question on the mailing list.

Hardware Tokens
~~~~~~~~~~~~~~~

.. index:: Hardware Tokens

The following hardware tokens are known to work well.

**Yubikey**. The Yubikey is supported in all modes:
AES (:ref:`yubikey_token`),
:ref:`hotp_token`
and :ref:`yubico_token` Cloud.
You can initialize the Yubikey yourself, so that the secret key is not known
to the vendor. The process is described in :ref:`yubikey_enrollment_tools`.

**eToken Pass**. The eToken Pass is a push button token by SafeNet. It can be
initialized with a special hardware device. Or you get a seed file, that you
need to import to eduMFA.
The eToken Pass can run as :ref:`hotp_token` or :ref:`totp_token` token.

**eToken NG OTP**. The eToken NG OTP is a push button token by SafeNet. As it
has a USB connector, you can initialize the token via the USB connector. Thus
the hardware vendor does not know the secret key.

**DaPlug**. The DaPlug token is similar to the Yubikey and can be initialized
via the USB connector. The secret key is not known to the hardware vendor.

**Smartdisplayer OTP Card**. This is a push button card. It features an eInk
display, that can be read very good in all light condition at all angles.
The Smartdisplayer OTP card is initialized at the factory and you get a seed
file, that you need to import to eduMFA.

**Feitian**. The C100 and C200 tokens are classical, reasonably priced push
button tokens. The C100 is an :ref:`hotp_token` token and the C200 a
:ref:`totp_token` token. These
tokens are initialized at the factory and you get a seed file, that you need
to import to eduMFA.

**Passkeys**. Yubikeys are known to work well with eduMFA, but token
compatibility depends on the implementation of the surrounding software. On
some Android devices, passkey logins with certain hardware tokens can fail.
This is outside of eduMFA's control. We recommend testing tokens before buying
them in bulk, e.g. using one of the available `testing websites`_. See
:ref:`webauthn` for more information on WebAuthN.

Smartphone Apps
~~~~~~~~~~~~~~~

.. index:: Software Tokens

**Aegis Authenticator**. An open source :ref:`totp_token` and :ref:`hotp_token`
app for Android.

**FreeOTP**. eduMFA is known to work well with the FreeOTP app. The
FreeOTP app supports only :ref:`totp_token`. So if you scan the QR Code of an
HOTP token, the OTP will not validate. It also has a version for iOS.

**Google Authenticator**. The Google Authenticator is working well in
:ref:`HOTP <hotp_token>` and :ref:`totp_token` mode.

**mOTP**. Several mOTP Apps like "Potato", "Token2" or "DroidOTP" are supported.

.. _privacyidea_authenticator:

**privacyIDEA Authenticator (unsupported)**. privacyIDEA Authenticator is based
on the concept of the Google Authenticator and works with the usual QR Code
enrollment. But on top it also allows for a two step enrollment process (See
:ref:`2step_enrollment`).
It can be used for :ref:`hotp_token` and :ref:`totp_token`.


.. _testing websites: https://www.passkeys.io/

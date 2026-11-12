.. _tiqr_token:

TiQR
----

.. note::
   This token type is planned for archival in eduMFA 3.0.0. It will remain
   available with coverage limited to existing unit tests. Report problems
   through GitHub issues or pull requests.

.. index:: TiQR, OCRA

The TiQR token is a smartphone token, that can be used to login by only
scanning a QR code.

The TiQR token implements the
:ref:`outofband authentication mode <authentication_mode_outofband>`.
The configuration is described in :ref:`tiqr_token_config`.

The token is also enrolled by scanning a QR code.

.. figure:: images/enroll_tiqr_1.png
   :width: 500

   *Choose a user for the TiQR token*

You can only enroll a TiQR token, when a user is selected.

.. note:: You can not enroll a TiQR token without assign the token to a user.

.. figure:: images/enroll_tiqr_2.png

For more technical information about the TiQR token please see
:ref:`code_tiqr_token`.

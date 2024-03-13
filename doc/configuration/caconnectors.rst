.. _caconnectors:

CA Connectors
-------------

.. index:: caconnectors, CA, Certificate Authority, certificate token

You can use eduMFA to enroll certificates and assign certificates to users.

You can define connections to Certificate Authorities, that are used when
enrolling certificates.

.. _fig_caconnector:

.. figure:: images/CA-connectors.png
   :width: 500

   *A local CA definition*

When you enroll a Token of type *certificate* the Certificate Signing Request
gets signed by one of the CAs attached to eduMFA by the CA connectors.

The first CA connector that ships with eduMFA is a connector to a local
openSSL based Certificate Authority as shown in figure :ref:`fig_caconnector`.

When enrolling a certificate token you can choose, which CA should sign the
certificate request.

.. figure:: images/enroll-cert.png
   :width: 500

   *Enrolling a certificate token*

.. _local_caconnector:

Local CA Connector
~~~~~~~~~~~~~~~~~~

.. index:: openssl

The local CA connector calls a local openSSL configuration.

.. note:: This description is meant to be as an example. When setting up a productive CA, you
   should ask a PKI consultant for assistance.

Setup
.....

You can use the :ref:`edumfa-manage` tool to setup a new CA like this::

   edumfa-manage ca create myCA

This will ask you for all necessary parameters for the CA and then automatically

1. Create the files for this new CA and
2. Create the CA connector in eduMFA.

Management
..........

There are different ways to enroll a certificate token. See :ref:`certificate_token`.

When an administrator *revokes* a certificate token, the certificate is
revoked and a CRL is created.

.. note:: eduMFA does not create the CRL regularly. The CRL usually has a
   validity period of 30 days. I.e. you need to create the CRL on a regular
   basis. You can use openssl to do so or the edumfa-manage command.


    edumfa-manage ca list

lists all configured *CA connectors*. You can use the ``-v`` switch to get more
information.

You can create a new CRL with the command::

    edumfa-manage ca create_crl <CA name>

This command will check the *overlap period* and only create a new CRL if it
is necessary. If you want to force the creation of the CRL, you can use the
switch *-f*.

For more information on edumfa-manage see :ref:`edumfa-manage`.

Templates
.........

.. index:: Certificate Templates

The *local CA* supports a kind of certificate templates. These "templates"
are predefined combinations of *extensions* and *validity days*, as they are
passed to openSSL via the parameters ``-extensions`` and ``-days``.

This way the administrator can define certificate templates with certain
X.509 extensions like keyUsage, extendedKeyUsage, CDPs or AIAs and
certificate validity periods.

The extensions are defined in YAML file and the location of this file is
added to the CA connector definition.

The file can look like this, defining three templates "user", "webserver" and
"template3"::

    user:
        days: 365
        extensions: "user"
    webserver:
        days: 750
        extensions: "server"
    template3:
        days: 10
        extensions: "user"


.. _msca_caconnector:

Microsoft CA Connector
~~~~~~~~~~~~~~~~~~~~~~

This CA connector communicates to the eduMFA MS CA worker, that is installed
on a Windows server in the Windows Domain. Through this worker, eduMFA can connect
potentially to all Microsoft CAs in the Windows Domain.

The Microsoft CA Connector has the following options.

**Hostname**

The hostname (FQDN) or IP address where the eduMFA MS CA worker is running.

.. note:: If you configure `Use SSL`, you need to provide the correct hostname as it is
   contained in the server certificate.

**Port**

The port on which the worker listens.

**Connect via Proxy**

Whether the worker is situated behind a HTTP proxy.

**Domain CA**

The worker will provide a list of available CAs in the domain. This is the
actual CA to which eduMFA shall communicate. After providing the initial
connection information `hostname` and `Port`, eduMFA can fetch the available
CAs in the Windows Domain. The CA is identified by the hostname where the Microsoft CA is
running and the name of the CA like `<hostname>\\<name of CA>`.

**Use SSL**

This is a boolean parameter. If it is checked, then eduMFA will communicate to
the CA worker via TLS. Depending on the worker configuration it will also be required,
to provide a client certificate for authentication.

.. note:: In productive use SSL should always be activated and a client certificate must
   be used for authentication.

**CA certificate**

This is the location of the file, that contains the CA certificate, that issued the
CA worker server certificate. This file is located on the eduMFA server in PEM format.

**Client certificate**

This is the file location of the certificate that eduMFA uses to authenticate against the CA worker.
It is in PEM format.

.. note:: The subject of this certificate must match the name of the eduMFA server as
   seen by the CA worker. It is a good idea to request the client certificate from the
   CA on the domain where the CA worker is actually running at.

**Client private key**

This is the location of the file containing the private key that belongs to the `Client certificate`.
It is in PEM format and can either be password protected (encrypted) or not.

The key can be provided in PKCS1 or PKCS8 format.

.. note:: The PCKCS1 format will start with ``-----BEGIN RSA PRIVATE KEY-----``, the PKCS8 format
   will start with ``-----BEGIN PRIVATE KEY-----``.

To convert between PKCS1 and PKCS8 format you can use::

    openssl pkcs8 -in private-p1.pem -topk8 -out private-p8.pem -nocrypt
    openssl pkcs8 -in private-p1.pem -topk8 -out private-p8-encrypted.pem

    openssl rsa -in private-p8.pem -out private-p1.pem

**Password of client certificate**

This is the password of the encrypted client private key.

.. note:: We strongly recommend to protect the file with a password. As encrypted key files
   we only support PKCS8!



Basic setup from the command line
.................................

Of course the MS CA Connector can be configured in the eduMFA Web UI.
For quick setup, you can also configure a connector at the command line using
:ref:`edumfa-manage` like this::

    edumfa-manage ca create -t microsoft <name-of-connector>

It will ask you all relevant questions and setup a connector in eduMFA.

.. _upgrade:

Upgrading
---------

In any case before upgrading a major version read the document
`READ_BEFORE_UPDATE`_
which is continuously updated in the Github repository.
Note, that when you are upgrading over several major versions, read all the comments
for all versions.

If you installed eduMFA via DEB repository you can use the normal
system ways of *apt-get* or *aptitude* to upgrade eduMFA to the
current version.


Different upgrade processes
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Depending on the way eduMFA was installed, there are different recommended update procedures.
The following section describes the process for pip installations.
Instructions for packaged versions on Ubuntu are found in :ref:`upgrade_packaged`.

Upgrading a pip installation
............................

If you install eduMFA into a python virtualenv like */opt/edumfa*,
you can follow this basic upgrade process.

First you might want to backup your program directory:

.. code-block:: bash

   tar -zcf edumfa-old.tgz /opt/edumfa

and your database:

.. code-block:: bash

   source /opt/edumfa/bin/activate
   edumfa-manage backup create

Running upgrade
^^^^^^^^^^^^^^^

The script ``edumfa-pip-update`` performs the
update of the python virtualenv and the DB schema.

Just enter your python virtualenv (you already did so, when running the
backup) and run the command:

   edumfa-pip-update

The following parameters are allowed:

``-f`` or ``--force`` skips the safety question, if you really want to update.

``-s`` or ``--skipstamp`` skips the version stamping during schema update.

``-n`` or ``--noschema`` completely skips the schema update and only updates the code.


Manual upgrade
^^^^^^^^^^^^^^

Now you can upgrade the installation:

.. code-block:: bash

   source /opt/edumfa/bin/activate
   pip install --upgrade edumfa

Usually you will need to upgrade/migrate the database:

.. code-block:: bash

   edumfa-schema-upgrade /opt/edumfa/lib/edumfa/migrations

Now you need to restart your webserver for the new code to take effect.

.. _upgrade_packaged:

Upgrading a packaged installation
.................................

In general, the upgrade of a packaged version of eduMFA should be done using the
default tools (e.g. apt and yum). In any case, read the
`READ_BEFORE_UPDATE`_
file. It is also a good idea to backup your system before upgrading.

Ubuntu upgrade
^^^^^^^^^^^^^^

If you use the Ubuntu packages in a default setup, the upgrade can should be done
using::

   apt update
   apt dist-upgrade



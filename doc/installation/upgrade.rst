.. _upgrade:

Upgrading
---------

In any case before upgrading a major version read the
:ref:`release_changelog` and relevant :ref:`migration_guides`.
Note, that when you are upgrading over several major versions, read all the comments
for all versions.

Different upgrade processes
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Depending on the way eduMFA was installed, there are different recommended update procedures.
The following section describes the process for pip installations.

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

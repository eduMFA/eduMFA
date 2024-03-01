.. _add_admin:

Add an administrator
--------------------

eduMFA does not come with a pre-defined administrator user.
If you just installed eduMFA, you need to create a new one
by running::

   edumfa-manage admin add admin -e admin@localhost

To configure eduMFA, continue with :ref:`login_webui`.

.. note:: Administrator accounts are used for various purposes in eduMFA.
   Once you need another administrator user, you should consider adding an
   admin policy to set up the permissions correctly. This is described in
   :ref:`admin_policies`.

   You may also read :ref:`faq_admins`.

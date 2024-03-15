.. _user_attributes:

Additional user attributes
--------------------------

.. index:: User Attributes, Additional User Attributes

eduMFA allows to manage additional internal attributes for users read from resolvers.
These additional attributes are stored and managed within eduMFA.
Administrators can manage attributes of users (see policies :ref:`admin_set_custom_user_attributes`
and :ref:`admin_delete_custom_user_attributes`) and users can manage their attributes themselves
(see policies :ref:`user_set_custom_user_attributes` and :ref:`user_delete_custom_user_attributes`).

The additional attributes are added to the user object, whenever a user is used.
The attributes are also added in the response of an authentication request. Thus these attributes
could be used to pass additional attributes via the RADIUS protocol.

The user attributes can also be used as additional conditions in policies
(see :ref:`policy_conditions`) in the userinfo section.
This way the additional attributes can be used to
group users together within eduMFA and assign distinct policies to these groups,
without the need to rely on information from the user store.

The policy condition uses attributes (userinfo) from the user store and additional user
attributes managed in eduMFA at the same time.

.. note:: If the user already has a certain key in the userinfo that is fetched from the
   resolver, the *additional user attributes* can also be used to *overwrite* the value
   from the user store!
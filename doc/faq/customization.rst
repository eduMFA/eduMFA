.. _customize:


Customization
-------------

There are several different ways to customize the UI of eduMFA.

.. _customize_templates:

Templates
~~~~~~~~~

.. index:: customize, templates, HTML views

You can change the HTML templates of the web UI as follows.
You can create a copy of the original templates, modify them and use rewrite rules of your webserver
to call your new, modified templates.

This way updates will not affect your modifications.

All HTML views are contained in::

    static/components/<component>/views/<view>.html

You can find them on `GitHub <https://github.com/eduMFA/eduMFA/tree/main/edumfa/static>`_
or at the according location in your installation.

Follow these basic steps:

1. Create a new location, where you will keep your modifications safe from updates.
   You should create a directory like
   */etc/edumfa/customization/* and put your modified views in there.

2. Activate the rewrite rules in your web server.
   E.g. in the Apache configuration you can add entries like::

    RewriteEngine On
    RewriteRule "/static/components/login/views/login.html"  \
         "/etc/edumfa/customization/mylogin.html"

   and apply all required changes to the file *mylogin.html*.

   .. note:: In this case you need to create a ``RewriteRule`` for each file, you
       want to modify.
       Alternatively the following configuration only rewrites the URL if the
       template file exists in the customization tree::

        RewriteEngine on
        RewriteCond /etc/edumfa/customization/%{REQUEST_URI} -f
        RewriteRule "^(.*)$" "/etc/edumfa/customization/%{REQUEST_URI}"

3. Now activate ``mod_rewrite`` and reload apache2.

.. warning:: Of course - if there are functional enhancements or bug fixes in the
   original templates - your template will also not be affected by these.

Templates (Docker)
..................

In the Docker image, you can modify templates by mounting them over their
original paths. To change the *login.html* template, you would:

1. Copy and modify the file at */edumfa/static/components/login/views/login.html*
2. Mount that file at */opt/edumfa/edumfa-package/static/components/login/views/login.html*

In a compose file, it could look like this:

.. code-block:: yaml

   services:
     [...]
     edumfa:
       [...]
       volumes:
         [...]
         - ./your-login.html:/opt/edumfa/edumfa-package/static/components/login/views/login.html

.. warning:: If there are functional enhancements or bug fixes in the
   original templates, remember to update your customized copy, too!

Translating templates
.....................

The translation in eduMFA is very flexible (see :ref:`translation`).
But if you change the templates the normal translation with PO files can
get a bit tricky.

You can use the scope variable
``browserLanguage`` in your custom templates.

You can print the browser language like this ``{{ browserLanguage }}``.

And you can display text in different languages in ``divs`` like this::

    <div ng-show="browserLanguage === 'de'">
        Das ist ein deutscher Text.
    </div>
    <div ng-show="browserLanguage === 'en'">
        This is an English text.
    </div>


.. _themes:

Themes
~~~~~~

.. index:: themes, CSS, customize

You can adapt the style and colors by changing CSS.

Providing your own stylesheet in the config file
................................................

You can create your own CSS file to adapt the look and feel of the Web UI.
The Web UI is built with `Mantine <https://mantine.dev>`_; its components use
CSS variables (``--mantine-color-...``, ``--mantine-spacing-...``) that your
stylesheet can override. Using ``EDUMFA_CSS`` in ``edumfa.cfg`` you can specify
the URL of an additional CSS file, which is loaded after the client's own
stylesheet.

The CSS you specify here adds to the already existing styles. Thus a convenient way for
using this setting is to help you distinguish different eduMFA instances like "testing", "acceptances"
and "production" or different nodes in a redundant setup.

You can create a simple CSS file *[..]/edumfa/static/custom/css/testing.css* like::

    body {
        background-color: green;
    }

and then set in the edumfa.cfg::

    EDUMFA_CSS = "/static/custom/css/testing.css"

This way your testing instance will be immediately distinguishable due to the green background.

Alternatively set ``EDUMFA_CUSTOM_CSS = True`` and place a file ``css/custom.css``
in the customization directory (``EDUMFA_CUSTOMIZATION``, see
``edumfa/static/customize/README.rst``).

Use web server substitute module
................................

You can also use the substitute module of the Apache webserver.
It is not clear how much performance impact you get, since this
module can scan and replace any text that is delivered by the web server.

If you for example want to replace the title of the webpages, you could
do it like this::

       <Location "/">
           AddOutputFilterByType SUBSTITUTE text/html
           Substitute "s/>eduMFA Authentication System</>My own 2FA system</ni"
       </Location>


.. _customize_logo:

Logo
~~~~

The default logo is located at ``edumfa/static/css/eduMFA1.png``.
If you want to use your own logo, you can put your file "mylogo.png" just
in the same folder and set

   EDUMFA_LOGO = "mylogo.png"

in the ``edumfa.cfg`` config file.

.. _customize_menu:

Page title
~~~~~~~~~~

You can configure the page title by setting ``EDUMFA_PAGE_TITLE`` in the
``edumfa.cfg`` file.

Menu, headers and footers
~~~~~~~~~~~~~~~~~~~~~~~~~

The navigation and the footer are part of the React client
(``edumfa/static/react-src/features/shell``). The former web UI policies
``custom_menu`` and ``custom_baseline``, which replaced AngularJS templates,
no longer exist. Use ``EDUMFA_CSS`` or a web server substitute rule to adapt
them, or change the client sources and rebuild ``react-dist``.

.. _customize_tokenwizard:

Tokenwizard
~~~~~~~~~~~

You can add additional HTML elements above and underneath the enrollment wizard pages.
Read the :ref:`enrollment_wizard` and :ref:`policy_token_wizard`
to learn more about those code snippets.

Token customization
~~~~~~~~~~~~~~~~~~~

Some tokens allow a special customization.

The paper token allows you to add CSS for styling the printed output and
add additional headers and footers. Read more about it at the
paper token :ref:`paper_token_customize`.

.. _customize_3rd_party_tokens:

New token classes
~~~~~~~~~~~~~~~~~

You can add new token types to eduMFA by writing your own Python token class.
A token class in eduMFA is
inherited from ``edumfa.lib.tokenclass.TokenClass``. You can either inherit from
this base class directly or from another token class. E.g. the *TOTP* token class is inherited from
*HOTP*. Take a look in the directory *edumfa/lib/tokens/* to get an idea of token classes.

A token class can have many different methods which you can find in the base class ``TokenClass``.
Depending on the token type you are going to implement, you will need to implement several of these.
Probably the most important methods are ``check_otp``, which validates the 2nd factor and the
method ``update``, which is called during the initialization process of the token and
gathers and writes all token specific attributes.

You should only add one token class per Python module.

You can install your new Python module, wherever you want to like ``myproject.cooltoken``.

If these tokens need additional enrollment data in the UI, you can specify
two templates, that are displayed during enrollment and after the token
is enrolled. These HTML templates need to be located at
``edumfa/static/components/token/views/token.enroll.<tokentype>.html``
and
``edumfa/static/components/token/views/token.enrolled.<tokentype>.html``.

.. Note:: In this example the python module ``myproject.cooltoken`` should
   contain a class ``CoolTokenClass``. The tokentype of this token, should
   be named "cool". And thus the HTML templates included by eduMFA
   are ``token.enroll.cool.html`` and ``token.enrolled.cool.html``.

The list of the token modules you want to add, must be specified in ``edumfa.cfg``.
See :ref:`picfg_3rd_party_tokens`.

Custom Web UI
~~~~~~~~~~~~~

You can also write your complete new WebUI.
To do so you need to specify files and folders in ``edumfa.cfg``.
Read more about this at :ref:`custom_web_ui`.

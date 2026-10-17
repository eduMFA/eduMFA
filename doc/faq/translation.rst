.. _translation:

Setup translation
-----------------

The web UI can be translated into different languages. The system determines
the preferred language of your browser and translates the web UI and server
responses accordingly.

This is the most important part you can do: Add words and sentences in your language!

Translations into German are provided by eduMFA while all other languages
are community translated with a fallback to English.

The Web UI uses `Lingui <https://lingui.dev>`_ catalogs in
``edumfa/static/react-src/locales/<language>/messages.po``. New strings are
extracted with ``bun run intl:extract`` in ``edumfa/static`` and compiled into
the client with ``bun run react:build``.

By default, all untranslated strings fall back to English.

The React client currently includes English and German. Check completeness with
``bun run intl:extract`` and ``bun run intl:compile --strict``. Keep interpolation
placeholders such as ``{name}`` and rich-text markers such as ``<0>`` unchanged
when translating. Ship the rebuilt ``react-dist`` assets with catalog changes.

The separately selectable legacy interface continues to use the catalogs in
``edumfa/static/translations`` and the Angular gettext compilation task.

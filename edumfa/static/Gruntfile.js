module.exports = function(grunt) {
grunt.loadNpmTasks('grunt-angular-gettext');
grunt.initConfig({
  nggettext_extract: {
    pot: {
      files: {
        "po/template.pot": [
          "edumfa/static/components/*/views/*.html",
          "edumfa/static/templates/*.html",
          "edumfa/static/components/*/controllers/*.js",
          "edumfa/static/components/*/factories/*.js",
          "edumfa/static/*.js",
        ],
      },
    },
  },
  nggettext_compile: {
    all: {
      files: {
        "edumfa/static/components/translation/translations.js": ["po/*.po"],
      },
    },
  },
});
};

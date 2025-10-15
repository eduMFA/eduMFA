module.exports = function(grunt) {
grunt.loadNpmTasks('grunt-angular-gettext');
grunt.initConfig({
  nggettext_extract: {
    pot: {
      files: {
        "locale/template.pot": [
          "components/*/views/*.html",
          "templates/*.html",
          "components/*/controllers/*.js",
          "components/*/factories/*.js",
          "*.js",
        ],
      },
    },
  },
  nggettext_compile: {
    all: {
      files: {
        "components/translation/translations.js": ["locale/*.po"],
      },
    },
  },
});
};

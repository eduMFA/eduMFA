module.exports = function (grunt) {
  grunt.loadNpmTasks("grunt-angular-gettext");
  grunt.initConfig({
    nggettext_extract: {
      pot: {
        files: {
          "translations/template.pot": [
            "components/*/views/*.html",
            "templates/*.html",
            "components/*/controllers/*.js",
            "components/*/factories/*.js",
            "*.js",
          ],
        },
        options: {
          lineNumbers: false,
        },
      },
    },
    nggettext_compile: {
      all: {
        files: {
          "components/translation/translations.js": ["translations/*.po"],
        },
      },
    },
  });
}

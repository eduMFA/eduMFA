"""
This testfile tests the basic app functionality of the privacyIDEA app
"""

import inspect
import io
import logging
import os
import tempfile
import unittest
from unittest import mock

import flask
from testfixtures import Comparison, compare

from edumfa.app import PiResponseClass, create_app
from edumfa.config import TestingConfig, config

dirname = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.logger = logging.getLogger()
        self.orig_handlers = self.logger.handlers
        self.logger.handlers = []
        self.level = self.logger.level

    def tearDown(self):
        self.logger.handlers = self.orig_handlers
        self.logger.level = self.level

    def test_01_create_default_app(self):
        # This will create the app with the 'development' configuration
        app = create_app()
        self.assertIsInstance(app, flask.app.Flask, app)
        self.assertTrue(app.debug, app)
        self.assertFalse(app.testing, app)
        self.assertEqual(app.import_name, "edumfa.app", app)
        self.assertEqual(app.name, "edumfa.app", app)
        self.assertTrue(app.response_class == PiResponseClass, app)
        blueprints = [
            "validate_blueprint",
            "token_blueprint",
            "system_blueprint",
            "resolver_blueprint",
            "realm_blueprint",
            "defaultrealm_blueprint",
            "policy_blueprint",
            "login_blueprint",
            "jwtauth",
            "user_blueprint",
            "audit_blueprint",
            "machineresolver_blueprint",
            "machine_blueprint",
            "application_blueprint",
            "caconnector_blueprint",
            "cert_blueprint",
            "ttype_blueprint",
            "register_blueprint",
            "smtpserver_blueprint",
            "recover_blueprint",
            "radiusserver_blueprint",
            "periodictask_blueprint",
            "edumfaserver_blueprint",
            "eventhandling_blueprint",
            "smsgateway_blueprint",
            "client_blueprint",
            "monitoring_blueprint",
        ]
        self.assertTrue(all(k in app.before_request_funcs for k in blueprints), app)
        self.assertTrue(all(k in app.blueprints for k in blueprints), app)
        extensions = ["sqlalchemy", "migrate", "babel"]
        self.assertTrue(all(k in extensions for k in app.extensions), app)
        self.assertEqual(app.secret_key, "t0p s3cr3t", app)
        # TODO: check url_map and view_functions
        # check that the configuration was loaded successfully
        # the default configuration is 'development'
        dc = config["development"]()
        members = inspect.getmembers(dc, lambda a: not (inspect.isroutine(a)))
        conf = [
            m for m in members if not (m[0].startswith("__") and m[0].endswith("__"))
        ]
        self.assertTrue(all(app.config[k] == v for k, v in conf), app)
        # check the correct initialization of the logging
        logger = logging.getLogger("edumfa")
        self.assertEqual(logger.level, logging.DEBUG, logger)
        compare(
            [
                Comparison(
                    "logging.handlers.RotatingFileHandler",
                    baseFilename=os.path.join(dirname, "edumfa.log"),
                    formatter=Comparison(
                        "edumfa.lib.log.SecureFormatter",
                        _fmt="[%(asctime)s][%(process)d]"
                        "[%(thread)d][%(levelname)s]"
                        "[%(name)s:%(lineno)d] "
                        "%(message)s",
                        partial=True,
                    ),
                    level=logging.DEBUG,
                    partial=True,
                )
            ],
            logger.handlers,
        )

    def test_02_create_production_app(self):
        app = create_app(config_name="production")
        dc = config["production"]()
        members = inspect.getmembers(dc, lambda a: not (inspect.isroutine(a)))
        conf = [
            m for m in members if not (m[0].startswith("__") and m[0].endswith("__"))
        ]
        self.assertTrue(all(app.config[k] == v for k, v in conf), app)

    def test_02a_config_file_from_env_is_parsed(self):
        with tempfile.NamedTemporaryFile("w", suffix=".py") as config_file:
            config_file.write('EDUMFA_LOGFILE = "env-config.log"\n')
            config_file.write('EDUMFA_CUSTOM_CSS = "env-custom.css"\n')
            config_file.flush()

            with mock.patch.dict(os.environ, {"EDUMFA_CONFIGFILE": config_file.name}):
                app = create_app(config_name="testing", silent=True)

        self.assertEqual(app.config["EDUMFA_LOGFILE"], "env-config.log")
        self.assertEqual(app.config["EDUMFA_CUSTOM_CSS"], "env-custom.css")

    def test_02b_invalid_config_file_from_env_raises(self):
        with tempfile.NamedTemporaryFile("w", suffix=".py") as config_file:
            config_file.write("this is not valid python config\n")
            config_file.flush()

            stderr = io.StringIO()
            with mock.patch.dict(os.environ, {"EDUMFA_CONFIGFILE": config_file.name}):
                with mock.patch("sys.stderr", stderr):
                    with self.assertRaises(SyntaxError):
                        create_app(config_name="testing", silent=True)

        output = stderr.getvalue()
        self.assertIn("ERROR: edumfa create_app could not read", output)
        self.assertIn(config_file.name, output)
        self.assertIn("Reason: invalid syntax", output)

    def test_02c_missing_config_file_from_env_raises_verbose(self):
        with tempfile.TemporaryDirectory() as config_dir:
            missing_config_file = os.path.join(config_dir, "missing-edumfa.cfg")
            stdout = io.StringIO()
            stderr = io.StringIO()

            with mock.patch.dict(os.environ, {"EDUMFA_CONFIGFILE": missing_config_file}):
                with mock.patch("sys.stdout", stdout), mock.patch("sys.stderr", stderr):
                    with self.assertRaises(OSError) as cm:
                        create_app(config_name="testing")

        self.assertIn("Unable to load configuration file", str(cm.exception))
        self.assertIn(missing_config_file, str(cm.exception))
        self.assertIn("The configuration name is: testing", stdout.getvalue())
        self.assertIn(
            f"Additional configuration will be read from the file {missing_config_file}",
            stdout.getvalue(),
        )
        self.assertIn("WARNING: edumfa create_app has no access", stderr.getvalue())
        self.assertIn(missing_config_file, stderr.getvalue())

    def test_02d_missing_explicit_config_file_raises(self):
        with tempfile.TemporaryDirectory() as config_dir:
            missing_config_file = os.path.join(
                config_dir, "missing-explicit-edumfa.cfg"
            )
            stderr = io.StringIO()

            with mock.patch("sys.stderr", stderr):
                with self.assertRaises(OSError) as cm:
                    create_app(
                        config_name="testing",
                        config_file=missing_config_file,
                        silent=True,
                    )

        self.assertIn("Unable to load configuration file", str(cm.exception))
        self.assertIn(missing_config_file, str(cm.exception))
        self.assertIn("WARNING: edumfa create_app has no access", stderr.getvalue())
        self.assertIn(missing_config_file, stderr.getvalue())

    def test_03_logging_config_file(self):
        class Config(TestingConfig):
            EDUMFA_LOGCONFIG = "tests/testdata/logging.cfg"

        with mock.patch.dict("edumfa.config.config", {"testing": Config}):
            app = create_app(config_name="testing")
            # check the correct initialization of the logging from config file
            logger = logging.getLogger("edumfa")
            self.assertEqual(logger.level, logging.DEBUG, logger)
            compare(
                [
                    Comparison(
                        "logging.handlers.RotatingFileHandler",
                        baseFilename=os.path.join(dirname, "edumfa.log"),
                        formatter=Comparison(
                            "edumfa.lib.log.SecureFormatter",
                            _fmt="[%(asctime)s][%(process)d]"
                            "[%(thread)d][%(levelname)s]"
                            "[%(name)s:%(lineno)d] "
                            "%(message)s",
                            partial=True,
                        ),
                        level=logging.DEBUG,
                        partial=True,
                    )
                ],
                logger.handlers,
            )
            logger = logging.getLogger("edumfa.lib.auditmodules.loggeraudit")
            self.assertEqual(logger.level, logging.INFO, logger)
            compare(
                [
                    Comparison(
                        "logging.handlers.RotatingFileHandler",
                        baseFilename=os.path.join(dirname, "audit.log"),
                        formatter=Comparison(
                            "edumfa.lib.log.SecureFormatter",
                            _fmt="[%(asctime)s][%(process)d]"
                            "[%(thread)d][%(levelname)s]"
                            "[%(name)s:%(lineno)d] "
                            "%(message)s",
                            partial=True,
                        ),
                        level=logging.INFO,
                        partial=True,
                    )
                ],
                logger.handlers,
            )

    def test_04_logging_config_yaml(self):
        class Config(TestingConfig):
            EDUMFA_LOGCONFIG = "tests/testdata/logging.yml"

        with mock.patch.dict("edumfa.config.config", {"testing": Config}):
            app = create_app(config_name="testing")
            # check the correct initialization of the logging from config file
            logger = logging.getLogger("edumfa")
            self.assertEqual(logger.level, logging.INFO, logger)
            compare(
                [
                    Comparison(
                        "logging.handlers.RotatingFileHandler",
                        baseFilename=os.path.join(dirname, "edumfa.log"),
                        formatter=Comparison(
                            "edumfa.lib.log.SecureFormatter",
                            _fmt="[%(asctime)s][%(process)d]"
                            "[%(thread)d][%(levelname)s]"
                            "[%(name)s:%(lineno)d] "
                            "%(message)s",
                            partial=True,
                        ),
                        backupCount=5,
                        level=logging.DEBUG,
                        partial=True,
                    )
                ],
                logger.handlers,
            )
            logger = logging.getLogger("audit")
            self.assertEqual(logger.level, logging.INFO, logger)
            compare(
                [
                    Comparison(
                        "logging.handlers.RotatingFileHandler",
                        backupCount=14,
                        baseFilename=os.path.join(dirname, "audit.log"),
                        level=logging.INFO,
                        formatter=None,
                        partial=True,
                    )
                ],
                logger.handlers,
            )

    def test_05_logging_config_broken_yaml(self):
        class Config(TestingConfig):
            EDUMFA_LOGCONFIG = "tests/testdata/logging_broken.yaml"

        with mock.patch.dict("edumfa.config.config", {"testing": Config}):
            app = create_app(config_name="testing")
            # check the correct initialization of the logging with the default
            # values since the yaml file is broken
            logger = logging.getLogger("edumfa")
            self.assertEqual(logger.level, logging.INFO, logger)
            compare(
                [
                    Comparison(
                        "logging.handlers.RotatingFileHandler",
                        baseFilename=os.path.join(dirname, "edumfa.log"),
                        formatter=Comparison(
                            "edumfa.lib.log.SecureFormatter",
                            _fmt="[%(asctime)s][%(process)d]"
                            "[%(thread)d][%(levelname)s]"
                            "[%(name)s:%(lineno)d] "
                            "%(message)s",
                            partial=True,
                        ),
                        level=logging.INFO,
                        partial=True,
                    )
                ],
                logger.handlers,
            )

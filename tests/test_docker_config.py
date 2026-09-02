import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType
from unittest import mock


class DockerEnvConfigTestCase(unittest.TestCase):
    """Test cases for the configuration parsing functions"""

    def setUp(self):
        """Clean up the module cache before each test"""
        # Remove the module from cache to force fresh import
        if "edumfa_config" in sys.modules:
            del sys.modules["edumfa_config"]

    def _get_required_env(self) -> dict:
        """Get the required environment variables for module import"""
        return {
            "DB_DRIVER": "sqlite",
            "DB_USER": "user",
            "DB_PASSWORD": "pass",
            "DB_HOSTNAME": "host",
            "DB_DATABASE": "db",
            "SECRET_KEY": "secret",
            "EDUMFA_PEPPER": "pepper",
        }

    def _import_config_with_env(self, env_vars: dict = {}) -> ModuleType:
        """Helper to import the config module with specific environment variables"""
        # Always include the required DB_* variables to prevent module import errors
        required_vars = self._get_required_env()
        # Merge with provided env_vars (provided vars take precedence)
        merged_vars = {**required_vars, **env_vars}

        # Add the deploy/docker directory to the Python path to avoid conflict with docker package
        docker_dir = str((Path(__file__).parent.parent / "deploy" / "docker").resolve())
        if docker_dir not in sys.path:
            sys.path.insert(0, docker_dir)

        # Create a context manager that will keep the environment variables set
        patcher = mock.patch.dict(os.environ, merged_vars, clear=True)
        patcher.start()

        # Import the module fresh
        import edumfa_config as config_module

        # Store the patcher so we can stop it later
        self._patcher = patcher
        return config_module

    def tearDown(self):
        """Clean up the environment mock after each test"""
        if hasattr(self, "_patcher") and self._patcher is not None:
            self._patcher.stop()
            self._patcher = None

        # Remove the docker directory from sys.path
        docker_dir = str((Path(__file__).parent.parent / "deploy" / "docker").resolve())
        if docker_dir in sys.path:
            sys.path.remove(docker_dir)

    def test_get_var_from_env(self):
        """Test get_var returns value from environment variable"""
        config = self._import_config_with_env({"TEST_VAR": "env_value"})
        result = config.get_var("TEST_VAR")
        self.assertEqual(result, "env_value")

    def test_get_var_from_file(self):
        """Test get_var reads from file when _FILE suffix is present"""
        with tempfile.NamedTemporaryFile(mode="w") as f:
            f.write("file_content")
            f.flush()

            config = self._import_config_with_env({"TEST_VAR_FILE": f.name})
            result = config.get_var("TEST_VAR")
            self.assertEqual(result, "file_content")

    def test_get_var_file_takes_precedence(self):
        """Test that _FILE suffix takes precedence over regular env var"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode="w") as f:
            f.write("file_content")
            f.flush()

            config = self._import_config_with_env(
                {"TEST_VAR": "env_value", "TEST_VAR_FILE": f.name}
            )
            result = config.get_var("TEST_VAR")
            self.assertEqual(result, "file_content")

    def test_get_var_missing_no_default(self):
        """Test get_var raises ValueError when var is missing and no default"""
        config = self._import_config_with_env({})
        with self.assertRaises(ValueError) as context:
            config.get_var("MISSING_VAR")
        self.assertIn(
            "Environment variable 'MISSING_VAR' not set", str(context.exception)
        )

    def test_get_var_with_default(self):
        """Test get_var returns default when var is not set"""
        config = self._import_config_with_env({})
        result = config.get_var("MISSING_VAR", "default_value")
        self.assertEqual(result, "default_value")

    def test_dict_conversion_malformed(self):
        """Test str_to_dict with malformed input"""
        config = self._import_config_with_env({})
        with self.assertRaises(ValueError):
            config.str_to_dict("{'invalid': syntax}")

    def test_dict_conversion_non_dict(self):
        """Test str_to_dict with non-dict input"""
        config = self._import_config_with_env({})
        with self.assertRaises(ValueError):
            config.str_to_dict("['list', 'of', 'values']")

    @mock.patch("socket.gethostname", return_value="test-node")
    def test_defaults(self, mock_gethostname):
        """Test default values"""
        config = self._import_config_with_env({})
        self.assertEqual(config.EDUMFA_AUDIT_KEY_PRIVATE, "/etc/edumfa/private.pem")
        self.assertEqual(config.EDUMFA_AUDIT_KEY_PUBLIC, "/etc/edumfa/public.pem")
        self.assertEqual(config.EDUMFA_ENCFILE, "/etc/edumfa/enckey")
        self.assertEqual(config.EDUMFA_LOGCONFIG, "/opt/edumfa/logging.yml")
        self.assertEqual(config.EDUMFA_NODE, "test-node")
        self.assertEqual(config.SUPERUSER_REALM, ["super", "administrators"])
        self.assertFalse(config.EDUMFA_UI_DEACTIVATED)
        self.assertTrue(config.EDUMFA_AUDIT_SQL_TRUNCATE)

    def test_config(self):
        """Test SQLALCHEMY_DATABASE_URI construction"""
        config = self._import_config_with_env(
            {
                "DB_DATABASE": "testdb",
                "DB_DRIVER": "postgresql",
                "DB_HOSTNAME": "localhost",
                "DB_PASSWORD": "testpass",
                "DB_USER": "testuser",
                "EDUMFA_AUDIT_KEY_PRIVATE": "/custom/private.pem",
                "EDUMFA_AUDIT_KEY_PUBLIC": "/custom/public.pem",
                "EDUMFA_AUDIT_SQL_OPTIONS": "{'pool_size': 10, 'max_overflow': 20}",
                "EDUMFA_CSS": "custom.css",
                "EDUMFA_ENCFILE": "/custom/enckey",
                "EDUMFA_LOGCONFIG": "/custom/logging.yml",
                "EDUMFA_LOGO": "logo123.png",
                "EDUMFA_PAGE_TITLE": "University of MFA",
                "EDUMFA_PEPPER": "my_pepper",
                "EDUMFA_UI_DEACTIVATED": "True",
                "SECRET_KEY": "my_secret",
                "SQLALCHEMY_ENGINE_OPTIONS": "{'pool_pre_ping': True, 'pool_recycle': 3600}",
                "SUPERUSER_REALM": "admins,helpdesk",
            }
        )
        self.assertEqual(config.EDUMFA_AUDIT_KEY_PRIVATE, "/custom/private.pem")
        self.assertEqual(config.EDUMFA_AUDIT_KEY_PUBLIC, "/custom/public.pem")
        self.assertEqual(
            config.EDUMFA_AUDIT_SQL_OPTIONS, {"pool_size": 10, "max_overflow": 20}
        )
        self.assertEqual(config.EDUMFA_CSS, "custom.css")
        self.assertEqual(config.EDUMFA_ENCFILE, "/custom/enckey")
        self.assertEqual(config.EDUMFA_LOGCONFIG, "/custom/logging.yml")
        self.assertEqual(config.EDUMFA_LOGO, "logo123.png")
        self.assertEqual(config.EDUMFA_PAGE_TITLE, "University of MFA")
        self.assertEqual(config.EDUMFA_PEPPER, "my_pepper")
        self.assertEqual(config.SECRET_KEY, "my_secret")
        self.assertEqual(
            config.SQLALCHEMY_DATABASE_URI,
            "postgresql://testuser:testpass@localhost/testdb",
        )
        self.assertEqual(
            config.SQLALCHEMY_ENGINE_OPTIONS,
            {"pool_pre_ping": True, "pool_recycle": 3600},
        )
        self.assertEqual(config.SUPERUSER_REALM, ["admins", "helpdesk"])
        self.assertTrue(config.EDUMFA_UI_DEACTIVATED)

    def test_config_optional_are_not_set(self):
        """Test optional values are not available as attributes if unset"""
        config = self._import_config_with_env({})
        self.assertFalse(hasattr(config, "EDUMFA_AUDIT_SQL_OPTIONS"))
        self.assertFalse(hasattr(config, "EDUMFA_CSS"))
        self.assertFalse(hasattr(config, "EDUMFA_LOGO"))
        self.assertFalse(hasattr(config, "EDUMFA_PAGE_TITLE"))
        self.assertFalse(hasattr(config, "SQLALCHEMY_ENGINE_OPTIONS"))

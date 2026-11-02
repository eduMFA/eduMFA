import json
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory

from flask import Response

from edumfa.lib.policy import ACTION, SCOPE, delete_policy, set_policy
from edumfa.lib.realm import delete_realm, set_realm
from edumfa.lib.resolver import delete_resolver, save_resolver
from edumfa.lib.user import User, create_user

from .base import MyApiTestCase


class UserWriteIdentityTestCase(MyApiTestCase):
    def setUp(self) -> None:
        super().setUp()
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        for name in ("writeA", "writeB"):
            database = Path(directory.name) / f"{name}.sqlite"
            with sqlite3.connect(database) as connection:
                connection.execute(
                    "CREATE TABLE users (id INTEGER PRIMARY KEY, "
                    "username TEXT UNIQUE, email TEXT, password TEXT)"
                )
            save_resolver(
                {
                    "resolver": name,
                    "type": "sqlresolver",
                    "Driver": "sqlite",
                    "Database": str(database),
                    "Table": "users",
                    "Map": json.dumps(
                        {
                            "username": "username",
                            "userid": "id",
                            "email": "email",
                            "password": "password",
                        }
                    ),
                }
            )
            self.addCleanup(delete_resolver, name)
            set_realm(name.lower(), [name])
            self.addCleanup(delete_realm, name.lower())
            create_user(
                name,
                {"username": "alice", "email": f"{name}@example.test"},
                password=f"{name}-password",
            )
        create_user(
            "writeA",
            {"username": "victim", "email": "victim@example.test"},
            password="victim-password",
        )
        self._policy("write_user_update", SCOPE.USER, ACTION.UPDATEUSER)
        self._policy(
            "write_user_delete", SCOPE.USER, f"{ACTION.DELETE_USER_ATTRIBUTES}=hello"
        )
        login = self._request(
            "/auth",
            "POST",
            "",
            {"username": "alice@writea", "password": "writeA-password"},
        )
        self.assertEqual(200, login.status_code, login.data)
        self.token: str = login.json["result"]["value"]["token"]

    def _policy(self, name: str, scope: str, action: str, resolver: str = "") -> None:
        set_policy(name, scope=scope, action=action, resolver=resolver)
        self.addCleanup(delete_policy, name)

    def _request(
        self, path: str, method: str, token: str, data: dict[str, str]
    ) -> Response:
        with self.app.test_request_context(
            path, method=method, data=data, headers={"Authorization": token}
        ):
            return self.app.full_dispatch_request()

    def test_update_ignores_other_user_and_resolver(self) -> None:
        response = self._request(
            "/user/",
            "PUT",
            self.token,
            {
                "user": "victim",
                "realm": "writeb",
                "resolver": "writeB",
                "userid": str(User("victim", "writea").uid),
                "email": "updated@example.test",
                "password": "changed",
            },
        )
        self.assertEqual(200, response.status_code, response.data)
        self.assertTrue(response.json["result"]["value"], response.data)
        self.assertEqual("updated@example.test", User("alice", "writea").info["email"])
        self.assertEqual("victim@example.test", User("victim", "writea").info["email"])
        self.assertEqual("writeB@example.test", User("alice", "writeb").info["email"])
        for password, expected_status in (("writeB-password", 200), ("changed", 401)):
            login = self._request(
                "/auth",
                "POST",
                "",
                {"username": "alice@writeb", "password": password},
            )
            self.assertEqual(expected_status, login.status_code, login.data)
        login = self._request(
            "/auth", "POST", "", {"username": "alice@writea", "password": "changed"}
        )
        self.assertEqual(200, login.status_code, login.data)

    def test_update_policy_uses_authenticated_resolver(self) -> None:
        set_policy(
            "write_user_update",
            scope=SCOPE.USER,
            action=ACTION.UPDATEUSER,
            resolver="writeB",
        )
        response = self._request(
            "/user/",
            "PUT",
            self.token,
            {"resolver": "writeB", "email": "updated@example.test"},
        )
        self.assertEqual(403, response.status_code, response.data)
        self.assertEqual("writeA@example.test", User("alice", "writea").info["email"])
        self.assertEqual("writeB@example.test", User("alice", "writeb").info["email"])

    def test_delete_ignores_other_user_and_resolver(self) -> None:
        for login, realm in (
            ("alice", "writea"),
            ("alice", "writeb"),
            ("victim", "writea"),
        ):
            user = User(login, realm)
            user.set_attribute("hello", "one")
            self.addCleanup(user.delete_attribute, "hello")
        response = self._request(
            "/user/attribute/hello/victim/writea",
            "DELETE",
            self.token,
            {"resolver": "writeB"},
        )
        self.assertEqual(200, response.status_code, response.data)
        self.assertEqual(1, response.json["result"]["value"])
        self.assertNotIn("hello", User("alice", "writea").attributes)
        self.assertEqual("one", User("alice", "writeb").attributes["hello"])
        self.assertEqual("one", User("victim", "writea").attributes["hello"])

    def test_admin_can_update_by_userid_and_delete_another_users_attribute(
        self,
    ) -> None:
        self._policy("write_admin_update", SCOPE.ADMIN, ACTION.UPDATEUSER)
        self._policy(
            "write_admin_delete", SCOPE.ADMIN, f"{ACTION.DELETE_USER_ATTRIBUTES}=hello"
        )
        target = User("alice", "writeb")
        response = self._request(
            "/user/",
            "PUT",
            self.at,
            {
                "user": "alice",
                "resolver": "writeB",
                "userid": str(target.uid),
                "email": "admin@example.test",
            },
        )
        self.assertEqual(200, response.status_code, response.data)
        self.assertTrue(response.json["result"]["value"], response.data)
        self.assertEqual("admin@example.test", target.info["email"])
        self.assertEqual(target.uid, User("alice", "writeb").uid)
        self.assertEqual("writeA@example.test", User("alice", "writea").info["email"])
        target.set_attribute("hello", "one")
        self.addCleanup(target.delete_attribute, "hello")
        response = self._request(
            "/user/attribute/hello/alice/writeb", "DELETE", self.at, {}
        )
        self.assertEqual(200, response.status_code, response.data)
        self.assertEqual(1, response.json["result"]["value"])
        self.assertNotIn("hello", target.attributes)

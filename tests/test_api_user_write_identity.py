import json
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask import Response

from edumfa.lib.error import UserError
from edumfa.lib.policy import ACTION, SCOPE, delete_policy, set_policy
from edumfa.lib.realm import delete_realm, set_realm
from edumfa.lib.resolver import delete_resolver, save_resolver
from edumfa.lib.token import init_token, remove_token
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
                    "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, email TEXT, password TEXT)"
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
            "/auth", "POST", "", username="alice@writea", password="writeA-password"
        )
        self.token: str = login.json["result"]["value"]["token"]

    def _policy(self, name: str, scope: str, action: str, **filters: str) -> None:
        set_policy(name, scope=scope, action=action, **filters)
        self.addCleanup(delete_policy, name)

    def _request(
        self,
        path: str,
        method: str,
        token: str | None = None,
        *,
        status: int = 200,
        **data: str,
    ) -> Response:
        with self.app.test_request_context(
            path,
            method=method,
            data=data,
            headers={"Authorization": self.token if token is None else token},
        ):
            response = self.app.full_dispatch_request()
        self.assertEqual(status, response.status_code, response.data)
        return response

    def _attribute(self, user: User, key: str, value: str) -> None:
        user.set_attribute(key, value)
        self.addCleanup(user.delete_attribute, key)

    def _share_realm(self) -> None:
        set_realm("writea", ["writeA", "writeB"], priority={"writeA": 1, "writeB": 2})
        self.addCleanup(set_realm, "writea", ["writeA"])

    def test_update_ignores_other_user_and_resolver(self) -> None:
        response = self._request(
            "/user/",
            "PUT",
            user="victim",
            realm="writeb",
            resolver="writeB",
            userid=str(User("victim", "writea").uid),
            email="updated@example.test",
            password="changed",
        )
        self.assertTrue(response.json["result"]["value"], response.data)
        self.assertEqual("updated@example.test", User("alice", "writea").info["email"])
        self.assertEqual("victim@example.test", User("victim", "writea").info["email"])
        self.assertEqual("writeB@example.test", User("alice", "writeb").info["email"])
        for password, expected_status in (("writeB-password", 200), ("changed", 401)):
            self._request(
                "/auth",
                "POST",
                "",
                username="alice@writeb",
                password=password,
                status=expected_status,
            )
        self._request("/auth", "POST", "", username="alice@writea", password="changed")

    def test_update_policy_uses_authenticated_resolver(self) -> None:
        set_policy(
            "write_user_update",
            scope=SCOPE.USER,
            action=ACTION.UPDATEUSER,
            resolver="writeB",
        )
        self._request(
            "/user/", "PUT", resolver="writeB", email="updated@example.test", status=403
        )
        self.assertEqual("writeA@example.test", User("alice", "writea").info["email"])
        self.assertEqual("writeB@example.test", User("alice", "writeb").info["email"])

    def test_set_attribute_ignores_other_resolver(self) -> None:
        self._share_realm()
        self._policy(
            "write_user_set", SCOPE.USER, f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *"
        )
        owner = User("alice", "writea")
        target = User("alice", "writea", resolver="writeB")
        self.assertEqual("writeA", owner.resolver)
        self._attribute(target, "hello", "original")
        self.addCleanup(owner.delete_attribute, "hello")
        response = self._request(
            "/user/attribute", "POST", resolver="writeB", key="hello", value="updated"
        )
        self.assertTrue(response.json["result"]["status"], response.data)
        self.assertEqual("original", target.attributes.get("hello"))
        self.assertEqual("updated", owner.attributes.get("hello"))

    def test_set_attribute_policy_uses_authenticated_resolver(self) -> None:
        self._policy(
            "write_other_resolver_set",
            SCOPE.USER,
            f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *",
            resolver="writeB",
        )
        owner = User("alice", "writea")
        target = User("alice", "writea", resolver="writeB")
        self.addCleanup(owner.delete_attribute, "hello")
        self.addCleanup(target.delete_attribute, "hello")
        self._request(
            "/user/attribute",
            "POST",
            resolver="writeB",
            key="hello",
            value="updated",
            status=403,
        )
        self.assertNotIn("hello", owner.attributes)
        self.assertNotIn("hello", target.attributes)

    def test_delete_ignores_other_user_and_resolver(self) -> None:
        for login, realm in (
            ("alice", "writea"),
            ("alice", "writeb"),
            ("victim", "writea"),
        ):
            user = User(login, realm)
            self._attribute(user, "hello", "one")
        response = self._request(
            "/user/attribute/hello/victim/writea", "DELETE", resolver="writeB"
        )
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
            user="alice",
            resolver="writeB",
            userid=str(target.uid),
            email="admin@example.test",
        )
        self.assertTrue(response.json["result"]["value"], response.data)
        self.assertEqual("admin@example.test", target.info["email"])
        self.assertEqual(target.uid, User("alice", "writeb").uid)
        self.assertEqual("writeA@example.test", User("alice", "writea").info["email"])
        self._attribute(target, "hello", "one")
        response = self._request(
            "/user/attribute/hello/alice/writeb", "DELETE", self.at
        )
        self.assertEqual(1, response.json["result"]["value"])
        self.assertNotIn("hello", target.attributes)

    def test_attribute_reads_ignore_other_resolver(self) -> None:
        self._share_realm()
        owner = User("alice", "writea")
        target = User("alice", "writea", resolver="writeB")
        self._attribute(owner, "private", "own-value")
        self._attribute(target, "private", "victim-secret")
        for data, expected in (
            ({"resolver": "writeB", "key": "private"}, "own-value"),
            ({"resolver": "writeB"}, {"private": "own-value"}),
        ):
            response = self._request("/user/attribute", "GET", **data)
            self.assertEqual(expected, response.json["result"]["value"])

    def test_user_list_returns_only_authenticated_account(self) -> None:
        self._share_realm()
        self._policy("write_user_list", SCOPE.USER, ACTION.USERLIST)
        owner = User("alice", "writea")
        target = User("alice", "writea", resolver="writeB")
        self._attribute(owner, "hello", "own-value")
        self._attribute(target, "hello", "victim-secret")
        for data in ({}, {"resolver": "writeB"}):
            response = self._request("/user/", "GET", **data)
            users = response.json["result"]["value"]
            self.assertEqual(1, len(users))
            self.assertEqual("writeA", users[0]["resolver"])
            self.assertEqual("alice", users[0]["username"])
            self.assertEqual("own-value", users[0]["hello"])

    def test_admin_update_authorizes_userid_target(self) -> None:
        self._policy(
            "write_limited_admin",
            SCOPE.ADMIN,
            ACTION.UPDATEUSER,
            user="alice",
            resolver="writeA",
            realm="writea",
        )
        victim = User("victim", "writea")
        self._request(
            "/user/",
            "PUT",
            self.at,
            user="victim",
            resolver="writeA",
            realm="writea",
            email="direct@example.test",
            status=403,
        )
        self._request(
            "/user/",
            "PUT",
            self.at,
            user="alice",
            username="victim",
            resolver="writeA",
            realm="writea",
            userid=str(victim.uid),
            password="hijacked",
            email="changed@example.test",
            status=403,
        )
        self.assertEqual("victim@example.test", victim.info["email"])
        for password, expected_status in (("victim-password", 200), ("hijacked", 401)):
            self._request(
                "/auth",
                "POST",
                "",
                username="victim@writea",
                password=password,
                status=expected_status,
            )
        own = User("alice", "writea")
        self._request(
            "/user/",
            "PUT",
            self.at,
            user="alice",
            resolver="writeA",
            realm="writea",
            userid=str(own.uid),
            email="allowed@example.test",
        )
        self.assertEqual("allowed@example.test", own.info["email"])

    def test_admin_attribute_deletion_authorizes_url_target(self) -> None:
        self._policy(
            "write_limited_admin_delete",
            SCOPE.ADMIN,
            f"{ACTION.DELETE_USER_ATTRIBUTES}=hello",
            user="alice",
            resolver="writeA",
            realm="writea",
        )
        victim = User("victim", "writea")
        owner = User("alice", "writea")
        for target in (victim, owner):
            self._attribute(target, "hello", "original")
        for data in ({}, {"user": "alice", "resolver": "writeA"}):
            self._request(
                "/user/attribute/hello/victim/writea",
                "DELETE",
                self.at,
                status=403,
                **data,
            )
            self.assertEqual("original", victim.attributes.get("hello"))
        allowed = self._request(
            "/user/attribute/hello/alice/writea",
            "DELETE",
            self.at,
            user="victim",
            resolver="writeB",
        )
        self.assertEqual(1, allowed.json["result"]["value"])
        self.assertNotIn("hello", owner.attributes)

    def test_creation_ignores_unchecked_username(self) -> None:
        self._policy(
            "write_limited_create",
            SCOPE.ADMIN,
            ACTION.ADDUSER,
            user="allowednew",
            resolver="writeA",
            realm="writea",
        )
        self._request(
            "/user/",
            "POST",
            self.at,
            user="disallowednew",
            resolver="writeA",
            realm="writea",
            password="new-password",
            status=403,
        )
        self._request(
            "/user/",
            "POST",
            self.at,
            user="allowednew",
            username="disallowednew",
            resolver="writeA",
            realm="writea",
            password="new-password",
        )
        self.assertTrue(User("allowednew", "writea").uid)
        self.assertFalse(User("disallowednew", "writea").uid)

    def test_admin_attribute_deletion_preserves_literal_username(self) -> None:
        self._policy(
            "write_admin_delete", SCOPE.ADMIN, f"{ACTION.DELETE_USER_ATTRIBUTES}=hello"
        )
        create_user("writeA", {"username": "alice@writeb"}, password="literal-password")
        literal = User("alice@writeb", "writea", resolver="writeA")
        other = User("alice", "writea")
        for target in (literal, other):
            self._attribute(target, "hello", "original")
        response = self._request(
            "/user/attribute/hello/alice@writeb/writea", "DELETE", self.at
        )
        self.assertEqual(1, response.json["result"]["value"])
        self.assertNotIn("hello", literal.attributes)
        self.assertEqual("original", other.attributes.get("hello"))

    def test_admin_list_cannot_escape_permitted_realm(self) -> None:
        self._policy("write_admin_list", SCOPE.ADMIN, ACTION.USERLIST, realm="writea")
        self._request("/user/", "GET", self.at, realm="writeb", status=403)
        response = self._request(
            "/user/", "GET", self.at, realm="writea", resolver="writeB"
        )
        users = response.json["result"]["value"]
        self.assertEqual({"writeA"}, {user["resolver"] for user in users})
        self.assertEqual({"alice", "victim"}, {user["username"] for user in users})

    def test_admin_list_enforces_user_and_resolver_filters(self) -> None:
        self._share_realm()
        self._policy(
            "write_admin_list",
            SCOPE.ADMIN,
            ACTION.USERLIST,
            resolver="writeA",
            user="alice",
        )
        target = User("alice", "writea", resolver="writeB")
        self._attribute(target, "resolver", "writeA")
        self._attribute(target, "username", "alice")
        for data in ({}, {"realm": "writea"}):
            response = self._request("/user/", "GET", self.at, **data)
            users = response.json["result"]["value"]
            self.assertEqual(1, len(users))
            self.assertEqual("writeA", users[0]["resolver"])
            self.assertEqual("alice", users[0]["username"])

    def test_users_cannot_create_or_delete_accounts(self) -> None:
        self._request(
            "/user/",
            "POST",
            user="created",
            resolver="writeA",
            password="new-password",
            status=401,
        )
        self._request("/user/writeA/victim", "DELETE", status=401)
        self.assertEqual("victim@example.test", User("victim", "writea").info["email"])

    def test_admin_create_checks_actual_resolver_realm(self) -> None:
        self._policy("write_realm_create", SCOPE.ADMIN, ACTION.ADDUSER, realm="writea")
        for realm in ("writeb", "writea", ""):
            data = {"user": "realm-created", "resolver": "writeB", "password": "secret"}
            if realm:
                data["realm"] = realm
            self._request("/user/", "POST", self.at, status=403, **data)
            self.assertFalse(User("realm-created", "writeb").uid)
        self._request(
            "/user/",
            "POST",
            self.at,
            user="realm-created",
            resolver="writeA",
            realm="writea",
            password="secret",
        )
        self.assertTrue(User("realm-created", "writea").uid)

    def test_admin_delete_checks_url_target_and_actual_realm(self) -> None:
        self._policy(
            "write_realm_delete", SCOPE.ADMIN, ACTION.DELETEUSER, realm="writea"
        )
        for realm in ("writeb", "writea", ""):
            data = {"user": "alice", "resolver": "writeB"}
            if realm:
                data["realm"] = realm
            response = self._request(
                "/user/writeB/alice", "DELETE", self.at, status=403, **data
            )
            self.assertTrue(User("alice", "writeb").uid)
        response = self._request(
            "/user/writeA/victim",
            "DELETE",
            self.at,
            user="alice",
            resolver="writeB",
            realm="writea",
        )
        self.assertTrue(response.json["result"]["value"], response.data)
        self.assertFalse(User("victim", "writea").uid)
        self.assertTrue(User("alice", "writea").uid)
        self.assertTrue(User("alice", "writeb").uid)

    def test_scoped_admin_attribute_reads_check_actual_target(self) -> None:
        self._policy(
            "write_realm_attributes",
            SCOPE.ADMIN,
            f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *",
            realm="writea",
        )
        owner = User("alice", "writea")
        target = User("alice", "writeb")
        self._attribute(owner, "hello", "own-value")
        self._attribute(target, "hello", "other-value")
        for path in ("/user/attribute", "/user/editable_attributes/"):
            for realm in ("writeb", "writea"):
                self._request(
                    path,
                    "GET",
                    self.at,
                    user="alice",
                    resolver="writeB",
                    realm=realm,
                    status=403,
                )
            self._request(
                path, "GET", self.at, user="alice", resolver="writeA", realm="writea"
            )

    def test_admin_attribute_set_rejects_invalid_realm_resolver_pair(self) -> None:
        self._policy(
            "write_realm_attributes",
            SCOPE.ADMIN,
            f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *",
            realm="writea",
        )
        target = User("alice", "writea", resolver="writeB")
        self.addCleanup(target.delete_attribute, "hello")
        self._request(
            "/user/attribute",
            "POST",
            self.at,
            user="alice",
            resolver="writeB",
            realm="writea",
            key="hello",
            value="forged",
            status=403,
        )
        self.assertNotIn("hello", target.attributes)

    def test_resolution_failure_cannot_switch_to_token_owner(self) -> None:
        self._policy(
            "write_user_set", SCOPE.USER, f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *"
        )
        self._policy(
            "write_admin_set", SCOPE.ADMIN, f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *"
        )
        target = User("victim", "writea")
        self._attribute(target, "hello", "original")
        serial = "WRITE-IDENTITY-TEST-TOKEN"
        init_token(
            {
                "serial": serial,
                "type": "hotp",
                "otpkey": "3132333435363738393031323334353637383930",
            },
            user=target,
        )
        self.addCleanup(remove_token, serial)
        for token, expected_status in ((self.token, 401), (self.at, 403)):
            with patch(
                "edumfa.api.before_after.get_user_from_param",
                side_effect=UserError("resolver unavailable"),
            ):
                self._request(
                    "/user/attribute",
                    "POST",
                    token,
                    user="alice",
                    serial=serial,
                    key="hello",
                    value="forged",
                    status=expected_status,
                )
            self.assertEqual("original", target.attributes.get("hello"))

    def test_session_for_deleted_user_cannot_write_attributes(self) -> None:
        self._policy(
            "write_user_set", SCOPE.USER, f"{ACTION.SET_USER_ATTRIBUTES}=:hello: *"
        )
        owner = User("alice", "writea")
        owner.delete()
        self._request(
            "/user/attribute", "POST", key="hello", value="orphaned", status=401
        )

    def test_admin_target_check_normalizes_realm_case(self) -> None:
        response = self._request(
            "/user/",
            "PUT",
            self.at,
            user="alice",
            resolver="writeA",
            realm="WRITEA",
            email="updated@example.test",
        )
        self.assertTrue(response.json["result"]["value"], response.data)
        self.assertEqual("updated@example.test", User("alice", "writea").info["email"])

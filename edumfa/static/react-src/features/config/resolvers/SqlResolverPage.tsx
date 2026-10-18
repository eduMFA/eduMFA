import { Trans } from "@lingui/react/macro";

import { ResolverConnectionPage } from "./ResolverConnectionPage";
import type { ResolverField, ResolverPreset } from "./resolverFields";

const fields: ResolverField[] = [
  {
    key: "Driver",
    label: <Trans>Driver</Trans>,
    required: true,
    placeholder: "mysql+pymysql"
  },
  {
    key: "Server",
    label: <Trans>Server</Trans>,
    required: true,
    placeholder: "127.0.0.1"
  },
  { key: "Port", label: <Trans>Port</Trans>, placeholder: "3306" },
  { key: "Database", label: <Trans>Database</Trans> },
  { key: "User", label: <Trans>User</Trans> },
  { key: "Password", label: <Trans>Password</Trans>, kind: "password" },
  { key: "Editable", label: <Trans>Edit user store</Trans>, kind: "checkbox" },
  {
    key: "Password_Hash_Type",
    label: <Trans>Password Hash for editable users</Trans>,
    options: [
      "PHPASS",
      "SHA",
      "SSHA",
      "SSHA256",
      "SSHA512",
      "OTRS",
      "SHA512CRYPT",
      "MD5CRYPT"
    ],
    showWhen: (values) => values.Editable === true
  },
  { key: "Table", label: <Trans>Table</Trans>, required: true },
  { key: "Limit", label: <Trans>Limit</Trans>, required: true, placeholder: "500" },
  { key: "Map", label: <Trans>Mapping</Trans>, kind: "textarea", required: true },
  { key: "Where", label: <Trans>Where statement</Trans> },
  { key: "Encoding", label: <Trans>Database Encoding</Trans> },
  { key: "conParams", label: <Trans>Connection Parameters</Trans> },
  { key: "poolSize", label: <Trans>Pool size</Trans> },
  { key: "poolTimeout", label: <Trans>Pool timeout</Trans> },
  { key: "poolRecycle", label: <Trans>Pool recycle timeout</Trans> }
];

const presets: ResolverPreset[] = [
  {
    label: "Wordpress",
    values: {
      Table: "wp_users",
      Map: JSON.stringify({
        userid: "ID",
        username: "user_login",
        email: "user_email",
        givenname: "display_name",
        password: "user_pass"
      })
    }
  },
  {
    label: "OTRS",
    values: {
      Table: "users",
      Map: JSON.stringify({
        userid: "id",
        username: "login",
        givenname: "first_name",
        surname: "last_name",
        password: "pw"
      })
    }
  },
  {
    label: "Tine 2.0",
    values: {
      Table: "tine20_accounts",
      Map: JSON.stringify({
        userid: "id",
        username: "login_name",
        email: "email",
        givenname: "first_name",
        surname: "last_name",
        password: "password"
      })
    }
  },
  {
    label: "Owncloud",
    values: {
      Table: "oc_users",
      Map: JSON.stringify({
        userid: "uid",
        username: "uid",
        givenname: "displayname",
        password: "password"
      })
    }
  },
  {
    label: "Typo3",
    values: {
      Table: "be_users",
      Map: JSON.stringify({
        userid: "uid",
        username: "username",
        givenname: "realName",
        password: "password",
        email: "email"
      })
    }
  },
  {
    label: "Drupal",
    values: {
      Table: "user",
      Map: JSON.stringify({
        userid: "uid",
        username: "name",
        email: "mail",
        password: "pass"
      })
    }
  }
];

export function SqlResolverPage() {
  return (
    <ResolverConnectionPage
      fields={fields}
      label="SQL"
      presets={presets}
      type="sqlresolver"
    />
  );
}

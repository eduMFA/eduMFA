import { Trans } from "@lingui/react/macro";

import { ResolverConnectionPage } from "./ResolverConnectionPage";
import type { ResolverField, ResolverPreset, ResolverValues } from "./resolverFields";

const usesTls = (values: ResolverValues) =>
  String(values.LDAPURI).toLowerCase().startsWith("ldaps:") ||
  values.START_TLS === true;
const fields: ResolverField[] = [
  {
    key: "LDAPURI",
    label: <Trans>Server URI</Trans>,
    required: true,
    placeholder: "ldap://server1, ldap://server2"
  },
  {
    key: "SERVERPOOL_STRATEGY",
    label: <Trans>Pooling strategy</Trans>,
    options: ["ROUND_ROBIN", "FIRST", "RANDOM"],
    showWhen: (values) => String(values.LDAPURI).includes(",")
  },
  {
    key: "START_TLS",
    label: <Trans>STARTTLS</Trans>,
    kind: "checkbox",
    showWhen: (values) => String(values.LDAPURI).toLowerCase().startsWith("ldap:")
  },
  {
    key: "TLS_VERSION",
    label: <Trans>TLS Version</Trans>,
    options: [
      { value: "3", label: "TLS v1.0" },
      { value: "4", label: "TLS v1.1" },
      { value: "5", label: "TLS v1.2" },
      { value: "2", label: "TLS v1.3" }
    ],
    showWhen: usesTls
  },
  {
    key: "TLS_VERIFY",
    label: <Trans>Verify TLS</Trans>,
    kind: "checkbox",
    showWhen: usesTls
  },
  {
    key: "TLS_CA_FILE",
    label: (
      <Trans>
        The file containing the CA certificate which signed the LDAP TLS certificate.
      </Trans>
    ),
    showWhen: (values) => usesTls(values) && values.TLS_VERIFY === true
  },
  {
    key: "LDAPBASE",
    label: <Trans>Base DN</Trans>,
    required: true,
    placeholder: "ou=users,dc=domain,dc=tld"
  },
  { key: "SCOPE", label: <Trans>Scope</Trans>, options: ["SUBTREE", "BASE", "LEVEL"] },
  {
    key: "AUTHTYPE",
    label: <Trans>Bind Type</Trans>,
    options: ["Anonymous", "Simple", "SASL Digest-MD5", "NTLM", "SASL Kerberos"]
  },
  {
    key: "BINDDN",
    label: <Trans>Bind DN</Trans>,
    showWhen: (values) => values.AUTHTYPE !== "Anonymous"
  },
  {
    key: "BINDPW",
    label: <Trans>Bind Password</Trans>,
    kind: "password",
    showWhen: (values) =>
      values.AUTHTYPE !== "Anonymous" && values.AUTHTYPE !== "SASL Kerberos"
  },
  {
    key: "KEYTABFILE",
    label: <Trans>Keyfile Path</Trans>,
    showWhen: (values) => values.AUTHTYPE === "SASL Kerberos"
  },
  { key: "TIMEOUT", label: <Trans>Timeout (seconds)</Trans>, required: true },
  {
    key: "CACHE_TIMEOUT",
    label: <Trans>Cache Timeout (seconds)</Trans>,
    required: true
  },
  { key: "SIZELIMIT", label: <Trans>Size Limit</Trans>, required: true },
  { key: "SERVERPOOL_ROUNDS", label: <Trans>Server pool retry rounds</Trans> },
  { key: "SERVERPOOL_SKIP", label: <Trans>Server pool skip timeout (seconds)</Trans> },
  {
    key: "SERVERPOOL_PERSISTENT",
    label: <Trans>Per-process server pool</Trans>,
    kind: "checkbox"
  },
  { key: "EDITABLE", label: <Trans>Edit user store</Trans>, kind: "checkbox" },
  {
    key: "OBJECT_CLASSES",
    label: <Trans>Object classes of a new created user object</Trans>,
    showWhen: (values) => values.EDITABLE === true
  },
  {
    key: "DN_TEMPLATE",
    label: <Trans>DN of a new created user object</Trans>,
    showWhen: (values) => values.EDITABLE === true
  },
  {
    key: "LOGINNAMEATTRIBUTE",
    label: <Trans>Loginname Attribute</Trans>,
    required: true
  },
  { key: "LDAPSEARCHFILTER", label: <Trans>Search Filter</Trans>, required: true },
  {
    key: "USERINFO",
    label: <Trans>Attribute mapping</Trans>,
    kind: "textarea",
    required: true
  },
  {
    key: "MULTIVALUEATTRIBUTES",
    label: <Trans>Multivalue Attributes</Trans>,
    placeholder: '["mobile"]'
  },
  { key: "UIDTYPE", label: <Trans>UID Type</Trans>, required: true },
  {
    key: "NOREFERRALS",
    label: <Trans>No anonymous referral chasing</Trans>,
    kind: "checkbox"
  },
  {
    key: "NOSCHEMAS",
    label: <Trans>No retrieval of schema information</Trans>,
    kind: "checkbox"
  }
];

const defaults: ResolverValues = {
  SIZELIMIT: "500",
  TIMEOUT: "5",
  UIDTYPE: "DN",
  AUTHTYPE: "Simple",
  SCOPE: "SUBTREE",
  CACHE_TIMEOUT: "120",
  NOSCHEMAS: false,
  TLS_VERIFY: true,
  TLS_VERSION: "2",
  START_TLS: true,
  SERVERPOOL_ROUNDS: "2",
  SERVERPOOL_STRATEGY: "ROUND_ROBIN",
  SERVERPOOL_SKIP: "30"
};
const commonPreset = {
  USERINFO: JSON.stringify({
    phone: "telephoneNumber",
    mobile: "mobile",
    email: "mail",
    surname: "sn",
    givenname: "givenName"
  }),
  NOREFERRALS: true,
  EDITABLE: false
};
const presets: ResolverPreset[] = [
  {
    label: <Trans>Preset OpenLDAP</Trans>,
    values: {
      ...commonPreset,
      LOGINNAMEATTRIBUTE: "uid",
      LDAPSEARCHFILTER: "(uid=*)(objectClass=inetOrgPerson)",
      UIDTYPE: "entryUUID"
    }
  },
  {
    label: <Trans>Preset Active Directory</Trans>,
    values: {
      ...commonPreset,
      LOGINNAMEATTRIBUTE: "sAMAccountName",
      LDAPSEARCHFILTER: "(sAMAccountName=*)(objectCategory=person)",
      UIDTYPE: "objectGUID"
    }
  }
];

export function LdapResolverPage() {
  return (
    <ResolverConnectionPage
      defaults={defaults}
      fields={fields}
      label="LDAP"
      presets={presets}
      type="ldapresolver"
    />
  );
}

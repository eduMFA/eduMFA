import { readText } from "./machineResolverFields";
import { isConfigEnabled } from "@/api/config";
import type { MachineResolverRequest } from "@/api/machineResolvers";

/** The bind types of the legacy `authtypes` list. */
export const ldapAuthTypes = ["Simple", "SASL Digest-MD5"];

/** The form fields, named like the keys the backend stores. */
export interface LdapMachineResolverFormValues {
  AUTHTYPE: string;
  BINDDN: string;
  BINDPW: string;
  HOSTNAMEATTRIBUTE: string;
  IDATTRIBUTE: string;
  IPATTRIBUTE: string;
  LDAPBASE: string;
  LDAPURI: string;
  NOREFERRALS: boolean;
  SEARCHFILTER: string;
  SIZELIMIT: string;
  START_TLS: boolean;
  TIMEOUT: string;
  TLS_CA_FILE: string;
  TLS_VERIFY: boolean;
  resolvername: string;
}

/** The presets of `ldapMachineResolverController` for a new resolver. */
export const defaultLdapMachineResolverValues: LdapMachineResolverFormValues = {
  AUTHTYPE: "Simple",
  BINDDN: "",
  BINDPW: "",
  HOSTNAMEATTRIBUTE: "",
  IDATTRIBUTE: "",
  IPATTRIBUTE: "",
  LDAPBASE: "",
  LDAPURI: "",
  NOREFERRALS: false,
  SEARCHFILTER: "",
  SIZELIMIT: "",
  START_TLS: true,
  TIMEOUT: "",
  TLS_CA_FILE: "",
  TLS_VERIFY: true,
  resolvername: ""
};

/** Port of the legacy `presetAD`. */
export const activeDirectoryPreset = {
  HOSTNAMEATTRIBUTE: "dNSHostName",
  IDATTRIBUTE: "DN",
  IPATTRIBUTE: "",
  NOREFERRALS: true,
  SEARCHFILTER: "(objectClass=computer)"
} as const;

/**
 * Form values of a stored resolver. The flags come back as strings and go
 * through the legacy `isTrue` normalisation.
 */
export function toLdapMachineResolverFormValues(
  resolverName: string,
  data: Record<string, unknown>
): LdapMachineResolverFormValues {
  return {
    AUTHTYPE: readText(data.AUTHTYPE) || defaultLdapMachineResolverValues.AUTHTYPE,
    BINDDN: readText(data.BINDDN),
    BINDPW: readText(data.BINDPW),
    HOSTNAMEATTRIBUTE: readText(data.HOSTNAMEATTRIBUTE),
    IDATTRIBUTE: readText(data.IDATTRIBUTE),
    IPATTRIBUTE: readText(data.IPATTRIBUTE),
    LDAPBASE: readText(data.LDAPBASE),
    LDAPURI: readText(data.LDAPURI),
    NOREFERRALS: isConfigEnabled(data.NOREFERRALS),
    SEARCHFILTER: readText(data.SEARCHFILTER),
    SIZELIMIT: readText(data.SIZELIMIT),
    START_TLS: isConfigEnabled(data.START_TLS),
    TIMEOUT: readText(data.TIMEOUT),
    TLS_CA_FILE: readText(data.TLS_CA_FILE),
    TLS_VERIFY: isConfigEnabled(data.TLS_VERIFY),
    resolvername: resolverName
  };
}

/**
 * The body of `POST /machineresolver/<name>` and `POST /machineresolver/test`.
 * Stored keys the form does not know are sent back unchanged, like the
 * legacy `$scope.params` that started from the stored data.
 */
export function toLdapMachineResolverRequest(
  values: LdapMachineResolverFormValues,
  storedData: Record<string, unknown>
): MachineResolverRequest {
  return {
    ...storedData,
    AUTHTYPE: values.AUTHTYPE,
    BINDDN: values.BINDDN,
    BINDPW: values.BINDPW,
    HOSTNAMEATTRIBUTE: values.HOSTNAMEATTRIBUTE,
    IDATTRIBUTE: values.IDATTRIBUTE,
    IPATTRIBUTE: values.IPATTRIBUTE,
    LDAPBASE: values.LDAPBASE,
    LDAPURI: values.LDAPURI,
    NOREFERRALS: values.NOREFERRALS,
    SEARCHFILTER: values.SEARCHFILTER,
    SIZELIMIT: values.SIZELIMIT,
    START_TLS: values.START_TLS,
    TIMEOUT: values.TIMEOUT,
    TLS_CA_FILE: values.TLS_CA_FILE,
    TLS_VERIFY: values.TLS_VERIFY,
    type: "ldap"
  };
}

/** STARTTLS is only offered on a plain `ldap:` URI. */
export function offersStartTls(ldapUri: string): boolean {
  return ldapUri.toLowerCase().startsWith("ldap:");
}

/** TLS verification applies to `ldaps` URIs and to STARTTLS connections. */
export function offersTlsVerify(ldapUri: string, startTls: boolean): boolean {
  return ldapUri.toLowerCase().startsWith("ldaps") || startTls;
}

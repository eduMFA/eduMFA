import { Trans } from "@lingui/react/macro";

import { ResolverConnectionPage, type ResolverField } from "./ResolverConnectionPage";

const fields: ResolverField[] = [
  {
    key: "Authserver",
    label: <Trans>Authentication Server URI</Trans>,
    required: true,
    placeholder: "http://localhost:8080/osiam-auth-server"
  },
  {
    key: "Resourceserver",
    label: <Trans>Resource Server URI</Trans>,
    required: true,
    placeholder: "http://localhost:8080/osiam-resource-server"
  },
  { key: "Client", label: <Trans>Client</Trans>, required: true },
  { key: "Secret", label: <Trans>Secret</Trans>, kind: "password", required: true }
];

export function ScimResolverPage() {
  return <ResolverConnectionPage fields={fields} label="SCIM" type="scimresolver" />;
}

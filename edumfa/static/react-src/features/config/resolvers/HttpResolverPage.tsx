import { Trans } from "@lingui/react/macro";

import { ResolverConnectionPage, type ResolverField } from "./ResolverConnectionPage";

const fields: ResolverField[] = [
  {
    key: "endpoint",
    label: <Trans>Endpoint (URL)</Trans>,
    kind: "url",
    required: true,
    placeholder: "https://example.com/users/:userid"
  },
  {
    key: "method",
    label: <Trans>Method</Trans>,
    required: true,
    options: [
      { label: "GET", value: "get" },
      { label: "POST", value: "post" }
    ]
  },
  {
    key: "requestMapping",
    label: <Trans>Request Mapping (JSON format)</Trans>,
    kind: "json",
    required: true,
    placeholder: '{"customerid": "{userid}"}'
  },
  {
    key: "headers",
    label: <Trans>Headers (JSON format)</Trans>,
    kind: "json",
    required: true,
    placeholder: '{"Content-Type": "application/json"}'
  },
  {
    key: "responseMapping",
    label: <Trans>Response Mapping (JSON format)</Trans>,
    kind: "json",
    required: true,
    placeholder: '{"username": "{Username}", "email": "{Email}"}'
  },
  {
    key: "hasSpecialErrorHandler",
    label: <Trans>Special Error Handling</Trans>,
    kind: "checkbox"
  },
  {
    key: "errorResponse",
    label: <Trans>Response contains (JSON format):</Trans>,
    kind: "json",
    required: true,
    showWhen: (values) => values.hasSpecialErrorHandler === true
  },
  { key: "testUser", label: <Trans>Test user</Trans>, placeholder: "foo@bar.com" }
];

export function HttpResolverPage() {
  return <ResolverConnectionPage fields={fields} label="HTTP" type="httpresolver" />;
}

import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Checkbox,
  Group,
  NativeSelect,
  Stack,
  Textarea,
  TextInput
} from "@mantine/core";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import { ResolverEditorLayout } from "./ResolverEditorLayout";
import { ResolverNameField } from "./ResolverNameField";
import { ResolverTestResultAlert } from "./ResolverTestResultAlert";
import { buildResolverPayload, isResolverNameValid, toText } from "./resolverTypes";
import {
  useResolverTester,
  useSaveResolver,
  useStoredResolver
} from "./useResolverEditor";
import {
  isResolverFlagSet,
  type ResolverTestRequest,
  type ResolverType
} from "@/api/resolvers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { pushFlash } from "@/lib/flash";

export type ResolverValues = Record<string, boolean | string>;

export interface ResolverField {
  key: string;
  label: ReactNode;
  kind?: "checkbox" | "password" | "textarea" | "json" | "url";
  options?: (string | { label: string; value: string })[];
  placeholder?: string;
  required?: boolean;
  showWhen?: (values: ResolverValues) => boolean;
}

export interface ResolverPreset {
  label: ReactNode;
  values: ResolverValues;
}

interface ResolverConnectionPageProps {
  defaults?: ResolverValues;
  fields: ResolverField[];
  label: string;
  presets?: ResolverPreset[];
  type: ResolverType;
}

/** Shared load, validation, test and save flow for the connection-based resolvers. */
export function ResolverConnectionPage(props: ResolverConnectionPageProps) {
  const { resolvername = "" } = useParams();
  const stored = useStoredResolver(resolvername);
  const { label } = props;

  return (
    <ResolverEditorLayout
      resolverName={resolvername}
      resolverType={props.type}
      stored={stored}
      title={
        resolvername ? (
          <Trans>
            Edit {label} Resolver {resolvername}
          </Trans>
        ) : (
          <Trans>Create a new {label} Resolver</Trans>
        )
      }
    >
      <ResolverConnectionForm
        {...props}
        key={`${props.type}:${resolvername}`}
        resolverName={resolvername}
        storedData={stored.data}
      />
    </ResolverEditorLayout>
  );
}

function ResolverConnectionForm({
  defaults = {},
  fields,
  label,
  presets = [],
  resolverName,
  storedData,
  type
}: ResolverConnectionPageProps & {
  resolverName: string;
  storedData: Record<string, unknown> | null;
}) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "resolverwrite");
  const [name, setName] = useState(resolverName);
  const [values, setValues] = useState<ResolverValues>(() =>
    Object.fromEntries(
      fields.map((field) => {
        const value = storedData ? storedData[field.key] : defaults[field.key];
        return [
          field.key,
          field.kind === "checkbox" ? isResolverFlagSet(value) : toText(value)
        ];
      })
    )
  );
  const tester = useResolverTester();
  const saveMutation = useSaveResolver({
    onSaved: () => {
      if (type === "ldapresolver") {
        pushFlash(
          t`Please remember to restart eduMFA when modifying an existing LDAP resolver.`,
          "warning"
        );
      }
    }
  });
  const visibleFields = fields.filter(
    (field) => !field.showWhen || field.showWhen(values)
  );
  const valid =
    isResolverNameValid(name) &&
    visibleFields.every((field) => !fieldError(field, values[field.key]));
  const busy = tester.isPending || saveMutation.isPending;
  const request = () =>
    buildResolverPayload(
      type,
      {
        ...values,
        // HTTP parses this field even when special error handling is disabled.
        ...(type === "httpresolver" && !values.hasSpecialErrorHandler
          ? { errorResponse: "{}" }
          : {})
      },
      storedData
    );
  const update = (changes: ResolverValues) => {
    setValues((previous) => ({ ...previous, ...changes }));
    tester.dismiss();
  };
  const test = (quick = false) => {
    if (!canWrite || !valid || busy) return;
    const payload: ResolverTestRequest = {
      ...request(),
      ...(resolverName ? { resolver: resolverName } : {})
    };
    if (type === "ldapresolver") {
      payload.SIZELIMIT = quick ? 1 : 0;
      if (payload.AUTHTYPE === "Anonymous") {
        payload.AUTHTYPE = "Simple";
        payload.BINDDN = "";
        payload.BINDPW = "";
      }
    }
    tester.test(payload);
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (canWrite && valid && !busy)
          saveMutation.mutate({ resolverName: name, request: request() });
      }}
    >
      <ErrorAlert error={saveMutation.error} />
      <ErrorAlert error={tester.error} />
      <ResolverTestResultAlert onDismiss={tester.dismiss} outcome={tester.outcome} />
      <Card
        footer={
          canWrite ? (
            <Group justify="center">
              {type === "ldapresolver" ? (
                <Button
                  disabled={!valid || busy}
                  onClick={() => {
                    test(true);
                  }}
                  type="button"
                  variant="light"
                >
                  <Trans>Quick Resolver Test</Trans>
                </Button>
              ) : null}
              <Button
                disabled={!valid || busy}
                loading={tester.isPending}
                onClick={() => {
                  test();
                }}
                type="button"
                variant="light"
              >
                <Trans>Test {label} Resolver</Trans>
              </Button>
              <Button
                disabled={!valid || busy}
                loading={saveMutation.isPending}
                type="submit"
              >
                <Trans>Save resolver</Trans>
              </Button>
            </Group>
          ) : null
        }
      >
        <Stack>
          <ResolverNameField onChange={setName} value={name} />
          {presets.length ? (
            <Group>
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    update(preset.values);
                  }}
                  type="button"
                  variant="default"
                >
                  {preset.label}
                </Button>
              ))}
            </Group>
          ) : null}
          {visibleFields.map((field) => {
            const value = toText(values[field.key]);
            const error = value ? fieldError(field, values[field.key]) : null;
            const props = {
              id: `resolver-${field.key}`,
              label: field.label,
              required: field.required ?? false,
              value,
              onChange: (
                event: ChangeEvent<
                  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                >
              ) => {
                update({ [field.key]: event.currentTarget.value });
              },
              ...(field.placeholder ? { placeholder: field.placeholder } : {}),
              error:
                error === "json"
                  ? t`Enter a valid JSON object.`
                  : error === "url"
                    ? t`Enter an HTTP or HTTPS URL.`
                    : undefined
            };
            if (field.kind === "checkbox")
              return (
                <Checkbox
                  key={field.key}
                  checked={values[field.key] === true}
                  label={field.label}
                  onChange={(event) => {
                    update({ [field.key]: event.currentTarget.checked });
                  }}
                />
              );
            if (field.options) {
              const known = field.options.some(
                (option) =>
                  (typeof option === "string" ? option : option.value) === value
              );
              return (
                <NativeSelect
                  {...props}
                  data={known ? field.options : [value, ...field.options]}
                  key={field.key}
                />
              );
            }
            if (field.kind === "textarea" || field.kind === "json")
              return <Textarea {...props} rows={3} key={field.key} />;
            return (
              <TextInput
                {...props}
                autoComplete={field.kind === "password" ? "new-password" : "off"}
                key={field.key}
                type={field.kind === "password" ? "password" : "text"}
              />
            );
          })}
        </Stack>
      </Card>
    </form>
  );
}

function fieldError(
  field: ResolverField,
  value: boolean | string | undefined
): "required" | "json" | "url" | null {
  const text = toText(value).trim();
  if (!text) return field.required ? "required" : null;
  if (field.kind === "json") {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "json";
    } catch {
      return "json";
    }
  }
  if (field.kind === "url") {
    try {
      if (!["http:", "https:"].includes(new URL(text).protocol)) return "url";
    } catch {
      return "url";
    }
  }
  return null;
}

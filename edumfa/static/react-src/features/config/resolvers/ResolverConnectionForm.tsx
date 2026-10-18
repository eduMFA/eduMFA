import { Stack } from "@mantine/core";

import { ResolverConnectionActions } from "./ResolverConnectionActions";
import { ResolverFieldInput } from "./ResolverFieldInput";
import type { ResolverConnectionConfig } from "./resolverFields";
import { ResolverNameField } from "./ResolverNameField";
import { ResolverPresetButtons } from "./ResolverPresetButtons";
import { ResolverTestResultAlert } from "./ResolverTestResultAlert";
import { useResolverConnectionForm } from "./useResolverConnectionForm";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

export interface ResolverConnectionFormProps extends ResolverConnectionConfig {
  resolverName: string;
  storedData: Record<string, unknown> | null;
}

/** The editor of a connection-based resolver: name, presets, fields, test and save. */
export function ResolverConnectionForm({
  defaults = {},
  fields,
  label,
  presets = [],
  resolverName,
  storedData,
  type
}: ResolverConnectionFormProps) {
  const form = useResolverConnectionForm({
    defaults,
    fields,
    resolverName,
    storedData,
    type
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.save();
      }}
    >
      <ErrorAlert error={form.saveMutation.error} />
      <ErrorAlert error={form.tester.error} />
      <ResolverTestResultAlert
        onDismiss={form.tester.dismiss}
        outcome={form.tester.outcome}
      />
      <Card
        footer={
          form.canWrite ? (
            <ResolverConnectionActions
              disabled={!form.valid || form.busy}
              isSaving={form.saveMutation.isPending}
              isTesting={form.tester.isPending}
              label={label}
              onQuickTest={() => {
                form.test(true);
              }}
              onTest={() => {
                form.test();
              }}
              showQuickTest={type === "ldapresolver"}
            />
          ) : null
        }
      >
        <Stack>
          <ResolverNameField onChange={form.setName} value={form.name} />
          {presets.length ? (
            <ResolverPresetButtons onSelect={form.update} presets={presets} />
          ) : null}
          {form.visibleFields.map((field) => (
            <ResolverFieldInput
              field={field}
              key={field.key}
              onChange={(value) => {
                form.update({ [field.key]: value });
              }}
              value={form.values[field.key]}
            />
          ))}
        </Stack>
      </Card>
    </form>
  );
}

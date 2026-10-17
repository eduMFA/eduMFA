import { Trans } from "@lingui/react/macro";
import { Button, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { ResolverEditorLayout } from "./ResolverEditorLayout";
import { ResolverNameField } from "./ResolverNameField";
import { buildResolverPayload, isResolverNameValid, toText } from "./resolverTypes";
import { useSaveResolver, useStoredResolver } from "./useResolverEditor";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

/** Port of `config.resolvers.passwd.html` and `PasswdResolverController`. */
export function PasswdResolverPage() {
  const { resolvername = "" } = useParams();
  const stored = useStoredResolver(resolvername);

  return (
    <ResolverEditorLayout
      resolverName={resolvername}
      resolverType="passwdresolver"
      stored={stored}
      title={
        resolvername ? (
          <Trans>Edit Passwd Resolver {resolvername}</Trans>
        ) : (
          <Trans>Create a new Passwd Resolver</Trans>
        )
      }
    >
      <PasswdResolverForm
        key={resolvername}
        resolverName={resolvername}
        storedData={stored.data}
      />
    </ResolverEditorLayout>
  );
}

interface PasswdFormState {
  fileName: string;
  resolvername: string;
}

interface PasswdResolverFormProps {
  resolverName: string;
  storedData: Record<string, unknown> | null;
}

function PasswdResolverForm({ resolverName, storedData }: PasswdResolverFormProps) {
  const { rights } = useAuth();
  const [form, setForm] = useState<PasswdFormState>(() => ({
    fileName: storedData ? toText(storedData.fileName) : "/etc/passwd",
    resolvername: resolverName
  }));
  const saveMutation = useSaveResolver();
  const isValid = isResolverNameValid(form.resolvername) && form.fileName.trim() !== "";

  const save = () => {
    saveMutation.mutate({
      request: buildResolverPayload(
        "passwdresolver",
        { fileName: form.fileName },
        storedData
      ),
      resolverName: form.resolvername
    });
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid && hasRight(rights, "resolverwrite") && !saveMutation.isPending) {
          save();
        }
      }}
    >
      <ErrorAlert error={saveMutation.error} />
      <Card
        footer={
          hasRight(rights, "resolverwrite") ? (
            <Button
              disabled={!isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveMutation.isPending}
              type="submit"
            >
              <Trans>Save resolver</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <ResolverNameField
          onChange={(value) => {
            setForm((previous) => ({ ...previous, resolvername: value }));
          }}
          value={form.resolvername}
        />
        <TextInput
          id="resolverfile"
          label={<Trans>File name</Trans>}
          name="resolverfile"
          onChange={(event) => {
            const fileName = event.currentTarget.value;

            setForm((previous) => ({ ...previous, fileName }));
          }}
          placeholder="/etc/passwd"
          required
          value={form.fileName}
        />
      </Card>
    </form>
  );
}

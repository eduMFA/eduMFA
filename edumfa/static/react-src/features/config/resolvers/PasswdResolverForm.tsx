import { useLingui } from "@lingui/react/macro";
import { Button, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";

import { ResolverNameField } from "./ResolverNameField";
import { buildResolverPayload, isResolverNameValid, toText } from "./resolverTypes";
import { useSaveResolver } from "./useResolverEditor";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

interface PasswdFormState {
  fileName: string;
  resolvername: string;
}

export interface PasswdResolverFormProps {
  resolverName: string;
  storedData: Record<string, unknown> | null;
}

/** The form of `config.resolvers.passwd.html`: the resolver name and the passwd file. */
export function PasswdResolverForm({
  resolverName,
  storedData
}: PasswdResolverFormProps) {
  const { t } = useLingui();

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
              {t`Save resolver`}
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
          label={t`File name`}
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

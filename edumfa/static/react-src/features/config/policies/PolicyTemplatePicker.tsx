import { useLingui } from "@lingui/react/macro";
import { IconDownload, IconTemplate } from "@tabler/icons-react";
import { Button, Stack, Table, Text } from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  getPolicyTemplate,
  getPolicyTemplates,
  policyQueryKeys,
  type PolicyTemplate
} from "@/api/policies";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator";

export function PolicyTemplatePicker({
  onApply,
  onBusyChange
}: {
  onApply: (template: PolicyTemplate) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { t } = useLingui();

  const [opened, setOpened] = useState(false);
  const templates = useQuery({
    enabled: opened,
    queryFn: ({ signal }) => getPolicyTemplates(signal),
    queryKey: policyQueryKeys.templates,
    retry: false
  });
  const template = useMutation({
    mutationFn: getPolicyTemplate,
    onSuccess: (value) => {
      onApply(value);
      setOpened(false);
    },
    onSettled: () => {
      onBusyChange(false);
    }
  });
  return (
    <Stack>
      <Button
        variant="light"
        leftSection={<IconTemplate aria-hidden size={16} />}
        type="button"
        onClick={() => {
          setOpened(!opened);
        }}
      >
        {opened ? t`Hide Policy templates` : t`Show Policy templates`}
      </Button>
      {opened ? (
        <>
          <Text size="sm" c="dimmed">
            {t`Load a template from the eduMFA policy template repository. Review its settings before saving.`}
          </Text>
          <ErrorAlert error={templates.error ?? template.error} />
          {templates.isLoading ? <LoadingIndicator /> : null}
          <Table>
            <Table.Tbody>
              {Object.entries(templates.data ?? {}).map(([name, description]) => (
                <Table.Tr key={name}>
                  <Table.Td>
                    <Button
                      type="button"
                      variant="subtle"
                      leftSection={<IconDownload aria-hidden size={16} />}
                      disabled={template.isPending}
                      onClick={() => {
                        onBusyChange(true);
                        template.mutate(name);
                      }}
                    >
                      {name}
                    </Button>
                  </Table.Td>
                  <Table.Td>{description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      ) : null}
    </Stack>
  );
}

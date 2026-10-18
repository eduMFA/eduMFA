import { useLingui } from "@lingui/react/macro";
import { Button, Grid, TextInput } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";

import { Card } from "@/components/layout/Card";

export interface SmtpTestEmailCardProps {
  canTest: boolean;
  isPending: boolean;
  onRecipientChange: (value: string) => void;
  onTest: () => void;
  recipient: string;
}

/** The test email row: the recipient and the send button. */
export function SmtpTestEmailCard({
  canTest,
  isPending,
  onRecipientChange,
  onTest,
  recipient
}: SmtpTestEmailCardProps) {
  const { t } = useLingui();

  return (
    <Card>
      <Grid align="flex-end">
        <Grid.Col span={{ base: 12, sm: 8 }}>
          <TextInput
            id="recipient"
            label={t`Recipient for testing`}
            onChange={(event) => {
              onRecipientChange(event.currentTarget.value);
            }}
            value={recipient}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Button
            disabled={!canTest}
            fullWidth
            leftSection={<IconSend size={16} />}
            loading={isPending}
            onClick={onTest}
            type="button"
            variant="default"
          >
            {t`Send Test Email`}
          </Button>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

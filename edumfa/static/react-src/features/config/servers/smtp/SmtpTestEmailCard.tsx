import { Trans } from "@lingui/react/macro";
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
  return (
    <Card>
      <Grid align="flex-end">
        <Grid.Col span={{ base: 12, sm: 8 }}>
          <TextInput
            id="recipient"
            label={<Trans>Recipient for testing</Trans>}
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
            <Trans>Send Test Email</Trans>
          </Button>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

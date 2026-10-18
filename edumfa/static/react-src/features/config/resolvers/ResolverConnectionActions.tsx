import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";

export interface ResolverConnectionActionsProps {
  /** The form is invalid or a request is in flight. */
  disabled: boolean;
  isSaving: boolean;
  isTesting: boolean;
  label: string;
  onQuickTest: () => void;
  onTest: () => void;
  /** LDAP offers a test limited to one entry. */
  showQuickTest: boolean;
}

/** The footer of the connection-based resolver editor: the test and save buttons. */
export function ResolverConnectionActions({
  disabled,
  isSaving,
  isTesting,
  label,
  onQuickTest,
  onTest,
  showQuickTest
}: ResolverConnectionActionsProps) {
  const { t } = useLingui();

  return (
    <Group justify="center">
      {showQuickTest ? (
        <Button disabled={disabled} onClick={onQuickTest} type="button" variant="light">
          {t`Quick Resolver Test`}
        </Button>
      ) : null}
      <Button
        disabled={disabled}
        loading={isTesting}
        onClick={onTest}
        type="button"
        variant="light"
      >
        <Trans>Test {label} Resolver</Trans>
      </Button>
      <Button disabled={disabled} loading={isSaving} type="submit">
        {t`Save resolver`}
      </Button>
    </Group>
  );
}

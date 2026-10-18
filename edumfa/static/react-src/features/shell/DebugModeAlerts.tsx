import { Trans } from "@lingui/react/macro";
import { Alert } from "@mantine/core";

export interface DebugModeAlertsProps {
  /** `log_level` of the backend; 10 is DEBUG, anything below also logs passwords. */
  logLevel: number | null;
}

/** The debug banners of the legacy main frame, shown above the page content. */
export function DebugModeAlerts({ logLevel }: DebugModeAlertsProps) {
  return (
    <>
      {logLevel === 10 ? (
        <Alert color="yellow" mt="md" role="alert" variant="light">
          <Trans>
            eduMFA is running in DEBUG mode. You can change the debug level in
            edumfa.cfg.
          </Trans>
        </Alert>
      ) : null}
      {logLevel !== null && logLevel < 10 ? (
        <Alert color="red" mt="md" role="alert" variant="light">
          <Trans>
            eduMFA is running in DEBUG mode with PASSWORDS being written to the log
            file. You can change the debug level in edumfa.cfg. Afterwards be sure to
            remove the logfile!
          </Trans>
        </Alert>
      ) : null}
    </>
  );
}

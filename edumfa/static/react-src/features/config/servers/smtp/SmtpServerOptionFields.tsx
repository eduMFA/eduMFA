import { useLingui } from "@lingui/react/macro";
import { Checkbox } from "@mantine/core";

import type { SmtpServerFieldSetter, SmtpServerFormValues } from "./smtpServerValues";
import { getUiConfig } from "@/lib/uiConfig";

export interface SmtpServerOptionFieldsProps {
  setValue: SmtpServerFieldSetter;
  values: SmtpServerFormValues;
}

/** The StartTLS and job queue switches. */
export function SmtpServerOptionFields({
  setValue,
  values
}: SmtpServerOptionFieldsProps) {
  const { t } = useLingui();

  const { hasJobQueue } = getUiConfig();
  // StartTLS does not apply to implicit TLS; the legacy form hid it for smtps:// servers.
  const showStartTls = !values.server.toLowerCase().startsWith("smtps:");

  return (
    <>
      {showStartTls ? (
        <Checkbox
          checked={values.tls}
          id="tls"
          label={t`Use StartTLS`}
          mb="sm"
          onChange={(event) => {
            setValue("tls", event.currentTarget.checked);
          }}
        />
      ) : null}
      {hasJobQueue ? (
        <Checkbox
          checked={values.enqueue_job}
          id="enqueue_job"
          label={t`Send mail from job queue`}
          mb="sm"
          onChange={(event) => {
            setValue("enqueue_job", event.currentTarget.checked);
          }}
        />
      ) : null}
    </>
  );
}

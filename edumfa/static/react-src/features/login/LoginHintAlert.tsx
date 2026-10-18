import { useLingui } from "@lingui/react/macro";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";

/** The dismissible hint above the credentials form of `login.html`. */
export function LoginHintAlert() {
  const { t } = useLingui();

  const [showHint, setShowHint] = useState(true);

  if (!showHint) {
    return null;
  }

  return (
    <Alert
      icon={<IconInfoCircle size={18} />}
      mb="md"
      onClose={() => {
        setShowHint(false);
      }}
      variant="light"
      withCloseButton
    >
      {t`Enter your username and password and click Log In to authenticate.`}
    </Alert>
  );
}

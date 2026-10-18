import { useLingui } from "@lingui/react/macro";
import { PasswordInput } from "@mantine/core";

/** PIN plus repeat, shared by the admin assignment and the user's own enrollment. */
export function PinFields({
  error,
  onPinChange,
  onPinRepeatChange,
  pin,
  pinRepeat
}: {
  error: string | undefined;
  onPinChange: (value: string) => void;
  onPinRepeatChange: (value: string) => void;
  pin: string;
  pinRepeat: string;
}) {
  const { t } = useLingui();

  return (
    <>
      <PasswordInput
        autoComplete="new-password"
        id="otppin"
        label={t`PIN/Password`}
        mb="xs"
        onChange={(event) => {
          onPinChange(event.currentTarget.value);
        }}
        placeholder={t`Type a PIN or password`}
        value={pin}
      />
      <PasswordInput
        aria-label={t`Repeat PIN or password`}
        autoComplete="new-password"
        error={error}
        id="otppin2"
        mb="sm"
        onChange={(event) => {
          onPinRepeatChange(event.currentTarget.value);
        }}
        placeholder={t`Repeat PIN or password`}
        value={pinRepeat}
      />
    </>
  );
}

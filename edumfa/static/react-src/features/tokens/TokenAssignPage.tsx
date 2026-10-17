import { Trans, useLingui } from "@lingui/react/macro";
import { Button, PasswordInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { assignToken, tokenQueryKeys, type TokenAssignRequest } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { SerialLookupField } from "@/components/forms/SerialLookupField";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { pushFlash } from "@/lib/flash";
import { fixSerial } from "@/lib/serial";

/**
 * Port of `token.assign.html`: a user connects a handed-out token to their
 * own account. Like the legacy controller, only the serial and PIN are sent;
 * the backend assigns the token to the authenticated user.
 */
export function TokenAssignPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const [serial, setSerial] = useState("");
  const [pin, setPin] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");
  const cleanSerial = fixSerial(serial);
  const pinsMatch = pin === pinRepeat;
  const canAssign = cleanSerial.length > 0 && pinsMatch;

  const assignMutation = useMutation({
    mutationFn: () => {
      const request: TokenAssignRequest = { serial: cleanSerial };

      if (pin) {
        request.pin = pin;
      }

      return assignToken(apiClient, request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
      pushFlash(t`Token assigned successfully.`, "success");
      void navigate("/token/list");
    }
  });

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="assign" />}>
      <PageHeader
        subtitle={
          <Trans>
            If you were handed a token device, you may connect this device to your
            account. Turn over the token, you may find a serial number printed on the
            token. Please enter this serial number and make up a token pin.
          </Trans>
        }
        title={<Trans>Assign a new token</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={assignMutation.error} />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (canAssign) {
            assignMutation.mutate();
          }
        }}
      >
        <Card
          footer={
            <Button
              disabled={!canAssign}
              id="assignButton"
              leftSection={<IconPlus size={16} />}
              loading={assignMutation.isPending}
              type="submit"
            >
              <Trans>Assign Token</Trans>
            </Button>
          }
          title={<Trans>Token</Trans>}
        >
          <SerialLookupField
            id="assignSerial"
            onChange={setSerial}
            placeholder={t`start typing a serial number of a token that is notassigned, yet.`}
            required
            unassignedOnly
            value={serial}
          />
          <PasswordInput
            autoComplete="new-password"
            id="assignPin"
            label={<Trans>PIN/Password</Trans>}
            mb="sm"
            onChange={(event) => {
              setPin(event.currentTarget.value);
            }}
            placeholder={t`Type a PIN or password`}
            value={pin}
          />
          <PasswordInput
            aria-label={t`Repeat PIN or password`}
            autoComplete="new-password"
            error={pinsMatch ? undefined : t`The PINs do not match.`}
            id="assignPinRepeat"
            onChange={(event) => {
              setPinRepeat(event.currentTarget.value);
            }}
            placeholder={t`Repeat PIN or password`}
            value={pinRepeat}
          />
        </Card>
      </form>
    </SidebarLayout>
  );
}

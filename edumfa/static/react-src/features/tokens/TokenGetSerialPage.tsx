import { Trans } from "@lingui/react/macro";

import { SerialLookupCountAlert } from "./serial/SerialLookupCountAlert";
import { SerialLookupForm } from "./serial/SerialLookupForm";
import { SerialLookupResultAlert } from "./serial/SerialLookupResultAlert";
import { useSerialLookup } from "./serial/useSerialLookup";
import { TokenSidebar } from "./TokenSidebar";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

/**
 * Port of `token.getserial.html`: finds the token that produced an OTP
 * value. The backend is asked for the number of candidate tokens first
 * (`count=1`), so the administrator can narrow the search before running it.
 */
export function TokenGetSerialPage() {
  const { isAuthenticated } = useAuth();
  const {
    backToForm,
    countMutation,
    editField,
    fields,
    inputsDisabled,
    result,
    searchMutation,
    searchedOtp,
    step,
    submit
  } = useSerialLookup();

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="getserial" />}>
      <PageHeader
        subtitle={
          <Trans>
            By entering an OTP value you can get the serial number of the token. You can
            also enter additional optional parameters, to narrow down the search for the
            token. So you can only search within certain token types or in assigned or
            unassigned tokens.
          </Trans>
        }
        title={<Trans>Get Serial number by OTP value</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={countMutation.error} />
      <ErrorAlert error={searchMutation.error} />

      <SerialLookupForm
        countPending={countMutation.isPending}
        fields={fields}
        inputsDisabled={inputsDisabled}
        onFieldChange={editField}
        onSubmit={submit}
        step={step}
      />

      {step === "count" ? (
        <SerialLookupCountAlert
          onCancel={backToForm}
          onRun={() => {
            searchMutation.mutate();
          }}
          result={result}
          searchPending={searchMutation.isPending}
        />
      ) : null}

      {step === "found" ? (
        <SerialLookupResultAlert
          onClose={backToForm}
          result={result}
          searchedOtp={searchedOtp}
        />
      ) : null}
    </SidebarLayout>
  );
}

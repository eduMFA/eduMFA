import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { EnrolledTokenCard } from "./EnrolledTokenCard";
import {
  initialEnrollForm,
  type EnrollFormState,
  type EnrollMode,
  type EnrollSession
} from "./enrollForm";
import { EnrollFormCard } from "./EnrollFormCard";
import { EnrollPageAlerts } from "./EnrollPageAlerts";
import { EnrollTokenLayout } from "./EnrollTokenLayout";
import { useEnrollFormModel } from "./useEnrollFormModel";
import { useEnrollSubmission } from "./useEnrollSubmission";
import { useAuth } from "@/auth/AuthProvider";
import { hasEnrollRight } from "@/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";

export interface EnrollTokenFormProps {
  mode: EnrollMode;
}

/** The enrollment form and, once `/token/init` answered, the enrolled token. */
export function EnrollTokenForm({ mode }: EnrollTokenFormProps) {
  const params = useParams();
  const [routeRealm = "", routeUser = ""] = (params["*"] ?? "").split("/");
  const rolloverSerial = params.tokenSerial ?? "";
  const rolloverType = params.tokenType ?? "";
  const { isAuthenticated, rights, user } = useAuth();
  const session: EnrollSession = {
    realm: user?.realm ?? "",
    role: user?.role ?? "",
    username: user?.username ?? ""
  };

  const [form, setForm] = useState<EnrollFormState>(() => ({
    ...initialEnrollForm,
    realm: routeRealm || null,
    user: routeUser
  }));
  const update = (patch: Partial<EnrollFormState>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  };

  const model = useEnrollFormModel({
    form,
    mode,
    rolloverType,
    routeRealm,
    routeUser,
    session
  });
  const submission = useEnrollSubmission({
    mode,
    resolved: model.resolved,
    rolloverSerial,
    session
  });
  const canSubmit =
    isAuthenticated &&
    hasEnrollRight(rights) &&
    model.resolved.type !== "" &&
    model.errors.length === 0 &&
    !submission.isSubmitting;
  const title =
    mode === "rollover" ? (
      <Trans>Rollover token {rolloverSerial}</Trans>
    ) : mode === "wizard" ? (
      <Trans>Token enrollment wizard</Trans>
    ) : (
      <Trans>Enroll a new token</Trans>
    );

  return (
    <EnrollTokenLayout mode={mode}>
      <PageHeader title={title} />
      <EnrollPageAlerts
        defaultTokenType={model.defaults.defaultTokenType}
        defaultTypeFallback={model.defaults.defaultTypeFallback}
        errors={[...model.queryErrors, ...submission.errors]}
        mode={mode}
      />
      {submission.enrolled ? (
        <EnrolledTokenCard
          detail={submission.enrolled}
          mode={mode}
          resolved={model.resolved}
          submission={submission}
          visibility={model.visibility}
        />
      ) : (
        <EnrollFormCard
          canSubmit={canSubmit}
          form={form}
          isSubmitting={submission.isSubmitting}
          mode={mode}
          model={model}
          onChange={update}
          onSubmit={submission.submit}
        />
      )}
    </EnrollTokenLayout>
  );
}

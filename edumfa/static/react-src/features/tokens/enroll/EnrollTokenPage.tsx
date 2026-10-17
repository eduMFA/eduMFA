import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Box,
  Button,
  Group,
  NativeSelect,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconEdit,
  IconLogout,
  IconRefresh
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { EnrolledTokenResult, type FidoState } from "./EnrolledTokenResult";
import { EnrollmentSummary } from "./EnrollmentSummary";
import {
  buildEnrollRequest,
  buildSessionParams,
  configString,
  getConfiguredQuestions,
  initialEnrollForm,
  pinlessTypes,
  resolveEnrollForm,
  toPhoneList,
  typeDependentFields,
  validateEnrollForm,
  type EnrollFormContext,
  type EnrollFormState,
  type EnrollMode,
  type EnrollSession
} from "./enrollForm";
import { ExtendedAttributesFields } from "./ExtendedAttributesFields";
import { PinFields } from "./PinFields";
import { TokenTypeFields, type EnrollLookups } from "./TokenTypeFields";
import { TokenTypeHelp } from "./TokenTypeHelp";
import { useRolloutState } from "./useRolloutState";
import { useTypeLookups } from "./useTypeLookups";
import { UserAssignmentFields } from "./UserAssignmentFields";
import { useApiClient } from "@/api/ApiClientProvider";
import { authQueryKeys, getAuthRights } from "@/api/auth";
import {
  configQueryKeys,
  getDefaultRealmName,
  getRealms,
  getSystemConfig
} from "@/api/config";
import {
  enrollToken,
  tokenQueryKeys,
  type TokenEnrollDetail,
  type TokenEnrollRequest
} from "@/api/tokens";
import { getUserDetails, userQueryKeys } from "@/api/users";
import { useAuth } from "@/auth/AuthProvider";
import { useFidoErrorMessage } from "@/auth/useFidoErrorMessage";
import { getRightsValue, hasEnrollRight, hasRight } from "@/auth/permissions";
import { registerU2fToken } from "@/auth/u2f";
import { registerWebAuthnCredential } from "@/auth/webauthn";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { TokenSidebar } from "@/features/tokens/TokenSidebar";
import { notify } from "@/lib/notify";
import { fixUser } from "@/lib/users";

export interface EnrollTokenPageProps {
  mode: EnrollMode;
}

/**
 * Port of `token.enroll.html` and `tokenEnrollController`, serving three
 * routes: `/token/enroll/:realm/:user` (admins and users), `/token/rollover/
 * :type/:serial` (same form with a fixed type and `rollover=1`) and
 * `/token/wizard` (users without a token; no type select, logout at the end).
 * The customizable wizard includes of the legacy template are not shipped in
 * this repository and have no counterpart here.
 */
export function EnrollTokenPage({ mode }: EnrollTokenPageProps) {
  const params = useParams();
  // React Router reuses the element when only the route changes (enroll ->
  // rollover, another user), so the form state is keyed by the route.
  const routeKey = [
    mode,
    params["*"] ?? "",
    params.tokenType ?? "",
    params.tokenSerial ?? ""
  ].join("|");

  return <EnrollTokenForm key={routeKey} mode={mode} />;
}

function EnrollTokenForm({ mode }: EnrollTokenPageProps) {
  const params = useParams();
  const [routeRealm = "", routeUser = ""] = (params["*"] ?? "").split("/");
  const rolloverSerial = params.tokenSerial ?? "";
  const rolloverType = params.tokenType ?? "";
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { t } = useLingui();
  const { isAuthenticated, logout, rights, settings, user } = useAuth();
  const role = user?.role ?? "";
  const isAdmin = role === "admin";
  const isUser = role === "user";
  const isRollover = mode === "rollover";
  const isWizard = mode === "wizard";
  const session: EnrollSession = {
    realm: user?.realm ?? "",
    role,
    username: user?.username ?? ""
  };

  const [form, setForm] = useState<EnrollFormState>(() => ({
    ...initialEnrollForm,
    realm: routeRealm || null,
    user: routeUser
  }));
  const [enrolled, setEnrolled] = useState<TokenEnrollDetail | null>(null);
  const [enrollAttempt, setEnrollAttempt] = useState(0);
  const [clientPart, setClientPart] = useState("");
  const [verifyResponse, setVerifyResponse] = useState("");
  const [fido, setFido] = useState<FidoState>({ pending: false, subject: "" });

  const update = (patch: Partial<EnrollFormState>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  };

  const enrollTypesQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getAuthRights(apiClient, signal),
    queryKey: authQueryKeys.rights
  });
  const realmsQuery = useQuery({
    enabled: isAuthenticated && isAdmin,
    queryFn: ({ signal }) => getRealms(apiClient, signal),
    queryKey: configQueryKeys.realms
  });
  const systemConfigQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemConfig(apiClient, signal),
    queryKey: configQueryKeys.system
  });

  const enrollTypes = enrollTypesQuery.data ?? {};
  const typeNames = Object.keys(enrollTypes);
  const defaultTypeAllowed = typeNames.includes(settings.defaultTokenType);
  const defaultTokenType = isRollover
    ? rolloverType
    : defaultTypeAllowed
      ? settings.defaultTokenType
      : (typeNames[0] ?? settings.defaultTokenType);
  // "hotp" is also the value when no default_tokentype policy exists, so a
  // missing enrollHOTP right is not worth a warning (legacy behaviour).
  const defaultTypeFallback =
    !isRollover &&
    typeNames.length > 0 &&
    !defaultTypeAllowed &&
    settings.defaultTokenType !== "hotp";

  const realmNames = Object.keys(realmsQuery.data ?? {}).sort((left, right) =>
    left.localeCompare(right)
  );
  const defaultRealm =
    routeRealm ||
    (realmsQuery.data ? (getDefaultRealmName(realmsQuery.data) ?? "") : "");

  const systemConfig = systemConfigQuery.data ?? {};
  const preliminaryType = form.type ?? defaultTokenType;
  const needsIndexedSecretPreset =
    preliminaryType === "indexedsecret" && settings.indexedSecretPresetAttribute !== "";

  // Email, mobile number and the indexed secret preset come from the user
  // record. Admins get it once a suggestion was picked (or the user came
  // with the route), users read their own record like the legacy
  // `getUserDetails({})` call.
  const selectedRealm = form.realm ?? defaultRealm;
  const pickedUser =
    form.user.startsWith("[") || (routeUser !== "" && form.user === routeUser);
  const lookupUsername = isAdmin ? fixUser(form.user) : session.username;
  const lookupRealm = isAdmin ? selectedRealm : session.realm;
  const canLoadUserInfo =
    isAuthenticated &&
    (isAdmin
      ? pickedUser && lookupUsername !== "" && lookupRealm !== ""
      : isUser && (hasRight(rights, "userlist") || needsIndexedSecretPreset));
  const userInfoQuery = useQuery({
    enabled: canLoadUserInfo,
    queryFn: async ({ signal }) => {
      const users = await getUserDetails(
        apiClient,
        isAdmin ? { realm: lookupRealm, username: lookupUsername } : {},
        signal
      );

      return users[0] ?? null;
    },
    queryKey: isAdmin
      ? userQueryKeys.detail(lookupRealm, lookupUsername)
      : userQueryKeys.self
  });
  const userInfo = canLoadUserInfo ? (userInfoQuery.data ?? null) : null;
  const userEmail = typeof userInfo?.email === "string" ? userInfo.email : "";
  const userPhones = toPhoneList(userInfo?.mobile);
  const indexedSecretPreset =
    needsIndexedSecretPreset && userInfo
      ? toPhoneList(userInfo[settings.indexedSecretPresetAttribute]).join("")
      : "";

  const typeLookups = useTypeLookups(preliminaryType, isAuthenticated);

  const lookups: EnrollLookups = {
    caConnectors: typeLookups.caConnectors,
    eduMfaServers: typeLookups.eduMfaServers,
    numAnswers: configString(systemConfig, "question.num_answers") ?? "",
    phones: userPhones,
    questions: getConfiguredQuestions(systemConfig),
    radiusNames: typeLookups.radiusNames,
    realms: realmNames,
    serviceIds: typeLookups.serviceIds,
    smsGateways: String(getRightsValue(rights, "sms_gateways", ""))
      .split(" ")
      .filter((gateway) => gateway.length > 0)
  };
  const context: EnrollFormContext = {
    caConnectors: lookups.caConnectors.map((connector) => connector.connectorname),
    defaultRealm,
    defaultTokenType,
    indexedSecretPreset,
    rights,
    systemConfig,
    userEmail,
    userPhones
  };
  const resolved = resolveEnrollForm(form, context);
  const errors = validateEnrollForm(resolved, {
    requireDescription: settings.requireDescription
  });

  const showTypeSelect = !isRollover && !isWizard;
  const showDescription = !(isUser && !hasRight(rights, "setdescription"));
  const descriptionRequired = settings.requireDescription.includes(resolved.type);
  const showUserAssignment = isAdmin && !isRollover;
  const showPin =
    isUser &&
    !pinlessTypes.has(resolved.type) &&
    !isRollover &&
    (!isWizard || getRightsValue(rights, "otp_pin_minlength") !== false) &&
    hasRight(rights, "enrollpin");
  const showExtendedAttributes = isAdmin && !isWizard;
  const qrCodeWidth = isWizard && !settings.showSeed ? 300 : 250;
  const sessionParams = buildSessionParams(resolved, session);

  const submitInit = (request: TokenEnrollRequest) => enrollToken(apiClient, request);

  const describeFidoError = useFidoErrorMessage();

  const fidoMutation = useMutation({ mutationFn: submitInit });

  // Port of `register_fido`: the browser ceremony, then the second
  // `/token/init` step with its result.
  const registerFido = async (detail: TokenEnrollDetail) => {
    setFido({ pending: true, subject: "" });

    try {
      const registration = detail.u2fRegisterRequest
        ? await registerU2fToken(detail.u2fRegisterRequest)
        : detail.webAuthnRegisterRequest
          ? await registerWebAuthnCredential(detail.webAuthnRegisterRequest)
          : null;

      if (!registration) {
        setFido({ pending: false, subject: "" });

        return;
      }

      const result = await fidoMutation.mutateAsync({
        ...registration,
        ...sessionParams,
        serial: detail.serial
      });
      const subject =
        result.detail.u2fRegisterResponse?.subject ??
        result.detail.webAuthnRegisterResponse?.subject ??
        "";

      setFido({ pending: false, subject });
    } catch (error) {
      notify(describeFidoError(error), "danger");
      setFido({ pending: false, subject: "" });
    }
  };

  // Port of the enrollment `callback`.
  const handleEnrolled = (detail: TokenEnrollDetail) => {
    setEnrolled(detail);
    setEnrollAttempt((attempt) => attempt + 1);
    setClientPart("");
    setFido({ pending: false, subject: "" });
    window.scrollTo(0, 0);
    void queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });

    if (detail.u2fRegisterRequest || detail.webAuthnRegisterRequest) {
      void registerFido(detail);
    }
  };

  const enrollMutation = useMutation({
    mutationFn: submitInit,
    onSuccess: (result) => {
      handleEnrolled(result.detail);
    }
  });
  const clientPartMutation = useMutation({
    mutationFn: submitInit,
    onSuccess: (result) => {
      handleEnrolled(result.detail);
    }
  });
  const verifyMutation = useMutation({
    mutationFn: submitInit,
    onSuccess: (result) => {
      if (result.value) {
        notify(t`Token successfully verified`, "success");
      }

      setVerifyResponse("");
      handleEnrolled(result.detail);
    }
  });

  const rolloutState = useRolloutState(enrolled, enrollAttempt);
  const isClientWait = rolloutState === "clientwait";
  const isVerifyPending = rolloutState === "verify";

  const canSubmit =
    isAuthenticated &&
    hasEnrollRight(rights) &&
    resolved.type !== "" &&
    errors.length === 0 &&
    !enrollMutation.isPending;

  const submitEnrollment = () => {
    enrollMutation.mutate(
      buildEnrollRequest(resolved, { mode, rolloverSerial, session })
    );
  };

  const regenerate = () => {
    if (enrolled) {
      enrollMutation.mutate({
        ...buildEnrollRequest(resolved, { mode, rolloverSerial, session }),
        serial: enrolled.serial
      });
    }
  };

  const sendClientPart = () => {
    if (enrolled) {
      clientPartMutation.mutate({
        ...sessionParams,
        otpkey: clientPart.replace(/ /g, ""),
        otpkeyformat: "base32check",
        serial: enrolled.serial,
        type: resolved.type
      });
    }
  };

  const sendVerifyResponse = () => {
    if (enrolled) {
      verifyMutation.mutate({
        ...sessionParams,
        serial: enrolled.serial,
        type: resolved.type,
        verify: verifyResponse
      });
    }
  };

  const enrolledUsername = isAdmin ? fixUser(resolved.user) : "";
  const title = isRollover ? (
    <Trans>Rollover token {rolloverSerial}</Trans>
  ) : isWizard ? (
    <Trans>Token enrollment wizard</Trans>
  ) : (
    <Trans>Enroll a new token</Trans>
  );

  const content = (
    <>
      <PageHeader title={title} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      {isRollover ? (
        <Alert
          color="red"
          icon={<IconAlertTriangle size={18} />}
          mb="md"
          role="alert"
          variant="light"
        >
          <Trans>
            You are about to rollover your token! This will invalidate your existing
            token and create a new token with a new secret key!
          </Trans>
        </Alert>
      ) : null}
      {defaultTypeFallback ? (
        <Alert color="yellow" mb="md" role="status" variant="light">
          <Trans>
            Your user has no permission to enroll the default tokentype "
            {settings.defaultTokenType}". Using "{defaultTokenType}" instead.
          </Trans>
        </Alert>
      ) : null}
      <ErrorAlert error={enrollTypesQuery.error} />
      <ErrorAlert error={realmsQuery.error} />
      <ErrorAlert error={userInfoQuery.error} />
      <ErrorAlert error={typeLookups.error} />
      <ErrorAlert error={enrollMutation.error} />
      <ErrorAlert error={clientPartMutation.error} />
      <ErrorAlert error={verifyMutation.error} />
      <ErrorAlert error={fidoMutation.error} />

      {enrolled ? (
        <Card title={<Trans>Enrolled token</Trans>}>
          <Stack gap="md">
            {!isClientWait ? (
              <EnrollmentSummary
                isWizard={isWizard}
                realm={resolved.realm}
                serial={enrolled.serial}
                username={enrolledUsername}
              />
            ) : null}
            <EnrolledTokenResult
              clientPart={clientPart}
              detail={enrolled}
              fido={fido}
              form={resolved}
              isSendingClientPart={clientPartMutation.isPending}
              isWizard={isWizard}
              onClientPartChange={setClientPart}
              onRegenerate={regenerate}
              onSendClientPart={sendClientPart}
              qrCodeWidth={qrCodeWidth}
              rolloutState={rolloutState}
              showSeed={settings.showSeed}
            />
            {isVerifyPending ? (
              <Stack gap="sm">
                <Text size="sm">
                  <Trans>
                    The token was enrolled, but you still need to verify it before you
                    can use it!
                  </Trans>
                </Text>
                <TextInput
                  autoComplete="off"
                  id="verifyResponse"
                  label={enrolled.verify?.message ?? t`Enter code to verify enrollment`}
                  onChange={(event) => {
                    setVerifyResponse(event.currentTarget.value);
                  }}
                  value={verifyResponse}
                />
                <Group justify="center">
                  <Button
                    disabled={verifyResponse.trim() === ""}
                    loading={verifyMutation.isPending}
                    onClick={sendVerifyResponse}
                  >
                    <Trans>Verify Token</Trans>
                  </Button>
                </Group>
              </Stack>
            ) : null}
            {!fido.pending && !isClientWait && !isVerifyPending ? (
              <Group justify="center">
                {isWizard ? (
                  <Button
                    id="wizardLogoutButton"
                    leftSection={<IconLogout size={16} />}
                    onClick={() => {
                      logout();
                    }}
                  >
                    <Trans>Logout</Trans>
                  </Button>
                ) : (
                  <Button
                    id="enrollAnotherButton"
                    leftSection={<IconEdit size={16} />}
                    onClick={() => {
                      setEnrolled(null);
                    }}
                  >
                    <Trans>Enroll a new token</Trans>
                  </Button>
                )}
              </Group>
            ) : null}
          </Stack>
        </Card>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (canSubmit) {
              submitEnrollment();
            }
          }}
        >
          <Card
            footer={
              <Button
                disabled={!canSubmit}
                id="enrollButton"
                leftSection={
                  isRollover ? <IconRefresh size={16} /> : <IconEdit size={16} />
                }
                loading={enrollMutation.isPending}
                type="submit"
              >
                {isRollover ? (
                  <Trans>Rollover Token</Trans>
                ) : (
                  <Trans>Enroll Token</Trans>
                )}
              </Button>
            }
            footerAlign="center"
            title={isRollover ? <Trans>Token data</Trans> : <Trans>Token</Trans>}
          >
            {showTypeSelect ? (
              <NativeSelect
                data={typeNames.map((typeName) => ({
                  label: enrollTypes[typeName] ?? typeName,
                  value: typeName
                }))}
                id="tokentype"
                label={<Trans>Token type</Trans>}
                mb="md"
                onChange={(event) => {
                  // Port of `changeTokenType`: the type's defaults apply again.
                  update({ ...typeDependentFields, type: event.currentTarget.value });
                }}
                value={resolved.type}
              />
            ) : null}

            <TokenTypeHelp
              appImages={settings.authenticatorAppImages}
              isAdmin={isAdmin}
              isWizard={isWizard}
              qrCodeWidth={qrCodeWidth}
              systemConfig={systemConfig}
              type={resolved.type}
            />

            <TokenTypeFields
              errors={errors}
              form={resolved}
              indexedSecretForced={settings.indexedSecretForceAttribute}
              isWizard={isWizard}
              lookups={lookups}
              onChange={update}
              rights={rights}
            />

            {showDescription ? (
              <TextInput
                autoComplete="off"
                error={
                  errors.includes("descriptionLength")
                    ? t`The description may have at most 80 characters.`
                    : undefined
                }
                id="description"
                label={<Trans>Description</Trans>}
                mb="sm"
                onChange={(event) => {
                  update({ description: event.currentTarget.value });
                }}
                placeholder={t`Some nice words...`}
                required={descriptionRequired}
                value={form.description}
              />
            ) : null}

            {showUserAssignment ? (
              <UserAssignmentFields
                onRealmChange={(realm) => {
                  update({ realm });
                }}
                onUserChange={(value) => {
                  update({ user: value });
                }}
                realm={resolved.realm}
                realmNames={realmNames}
                user={form.user}
              />
            ) : null}

            {showUserAssignment || showPin ? (
              <PinFields
                error={
                  errors.includes("pin") && form.pinRepeat !== ""
                    ? t`The PINs do not match.`
                    : undefined
                }
                onPinChange={(pin) => {
                  update({ pin });
                }}
                onPinRepeatChange={(pinRepeat) => {
                  update({ pinRepeat });
                }}
                pin={form.pin}
                pinRepeat={form.pinRepeat}
              />
            ) : null}

            {showExtendedAttributes ? (
              <ExtendedAttributesFields
                onChange={update}
                validityEnd={form.validityEnd}
                validityError={
                  errors.includes("validity")
                    ? t`End Date before Start Date!`
                    : undefined
                }
                validityStart={form.validityStart}
              />
            ) : null}
          </Card>
        </form>
      )}
    </>
  );

  // The wizard hides the token navigation when the `token_wizard` policy
  // sends users straight here (`ng-hide="token_wizard"` in token.html).
  if (isWizard && settings.tokenWizard) {
    return (
      <Box className="react-migration-shell">
        <main>{content}</main>
      </Box>
    );
  }

  return (
    <SidebarLayout
      sidebar={<TokenSidebar activeItem={isWizard ? "wizard" : "enroll"} />}
    >
      {content}
    </SidebarLayout>
  );
}

import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Divider, Grid, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  CaConnectorEditorFrame,
  useCaConnectorEditor,
  type SaveCaConnectorVariables
} from "./caConnectorEditor";
import {
  buildCaConnectorRequest,
  RESOURCE_NAME_PATTERN,
  readText
} from "./caConnectorForm";
import type { CaConnector } from "@/api/caConnectors";
import { Card } from "@/components/layout/Card";

/**
 * The form model. `opensslCnf` stands for the stored key `openssl.cnf`,
 * which react-hook-form would otherwise read as a nested path.
 */
interface LocalCaFormValues {
  CRL: string;
  CRL_Overlap_Period: string;
  CRL_Validity_Period: string;
  CSRDir: string;
  CertificateDir: string;
  WorkingDir: string;
  cacert: string;
  cakey: string;
  connectorname: string;
  opensslCnf: string;
  templates: string;
}

/** Port of `config.caconnectors.local.html` and `LocalCAConnectorController`. */
export function LocalCaConnectorPage() {
  const { connectorname } = useParams();
  const editor = useCaConnectorEditor(connectorname);

  return (
    <CaConnectorEditorFrame
      editor={editor}
      title={
        connectorname ? (
          <Trans>Edit Local CA Connector {connectorname}</Trans>
        ) : (
          <Trans>Create a new Local CA Connector</Trans>
        )
      }
    >
      <LocalCaConnectorForm
        canWrite={editor.canWrite}
        connector={editor.connector}
        isSaving={editor.saveMutation.isPending}
        key={connectorname ?? ""}
        onSave={(variables) => {
          editor.saveMutation.mutate(variables);
        }}
      />
    </CaConnectorEditorFrame>
  );
}

interface LocalCaConnectorFormProps {
  canWrite: boolean;
  /** The loaded connector when editing; `null` creates a new one. */
  connector: CaConnector | null;
  isSaving: boolean;
  onSave: (variables: SaveCaConnectorVariables) => void;
}

function LocalCaConnectorForm({
  canWrite,
  connector,
  isSaving,
  onSave
}: LocalCaConnectorFormProps) {
  const { t } = useLingui();
  const data = connector?.data ?? {};
  const { formState, handleSubmit, register } = useForm<LocalCaFormValues>({
    defaultValues: {
      CRL: readText(data, "CRL"),
      CRL_Overlap_Period: readText(data, "CRL_Overlap_Period"),
      CRL_Validity_Period: readText(data, "CRL_Validity_Period"),
      CSRDir: readText(data, "CSRDir"),
      CertificateDir: readText(data, "CertificateDir"),
      WorkingDir: readText(data, "WorkingDir"),
      cacert: readText(data, "cacert"),
      cakey: readText(data, "cakey"),
      connectorname: connector?.connectorname ?? "",
      opensslCnf: readText(data, "openssl.cnf"),
      templates: readText(data, "templates")
    },
    mode: "onChange"
  });

  const submitForm = handleSubmit(({ connectorname, opensslCnf, ...values }) => {
    onSave({
      name: connectorname,
      request: buildCaConnectorRequest("local", {
        ...values,
        "openssl.cnf": opensslCnf
      })
    });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitForm(event);
      }}
    >
      <Card
        footer={
          canWrite ? (
            <Button
              disabled={!formState.isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isSaving}
              type="submit"
            >
              <Trans>Save CA</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          error={formState.errors.connectorname?.message}
          id="connectorname"
          label={<Trans>Connector name</Trans>}
          mb="md"
          placeholder="MyConnector1"
          required
          {...register("connectorname", {
            pattern: {
              message: t`The resource name must consist of letters, numbers and '_', '-', '.'`,
              value: RESOURCE_NAME_PATTERN
            },
            required: true
          })}
        />

        <Divider label={<Trans>Base Config</Trans>} labelPosition="left" my="md" />

        <TextInput
          id="cacert"
          label={<Trans>CA Certificate</Trans>}
          mb="md"
          placeholder="/etc/cacert.pem"
          required
          {...register("cacert", { required: true })}
        />
        <TextInput
          id="cakey"
          label={<Trans>CA Key</Trans>}
          mb="md"
          placeholder="/etc/cakey.pem"
          required
          {...register("cakey", { required: true })}
        />
        <TextInput
          id="openssl.cnf"
          label={<Trans>OpenSSL config file</Trans>}
          mb="md"
          placeholder="/etc/openssl.cnf"
          required
          {...register("opensslCnf", { required: true })}
        />
        <TextInput
          id="templates"
          label={<Trans>Certificates Templates file</Trans>}
          mb="md"
          placeholder="/etc/edumfa/ca/templates.yaml"
          {...register("templates")}
        />
        <TextInput
          id="workingdir"
          label={<Trans>Working Directory</Trans>}
          mb="md"
          placeholder="/opt/myCA"
          {...register("WorkingDir")}
        />
        <TextInput
          id="csrdir"
          label={<Trans>Certificate Signing Request Directory</Trans>}
          mb="md"
          placeholder="/opt/myCA/csrs"
          {...register("CSRDir")}
        />
        <TextInput
          description={
            <Trans>This is the directory were certificates get written to.</Trans>
          }
          id="certdir"
          label={<Trans>Certificate Directory</Trans>}
          mb="md"
          placeholder="/opt/myCA/certs"
          {...register("CertificateDir")}
        />

        <Divider
          label={<Trans>CRL Configuration</Trans>}
          labelPosition="left"
          my="md"
        />

        <TextInput
          description={
            <Trans>
              This is the CRL file, which is written when a certificate is revoked or
              the CRL is created otherwise.
            </Trans>
          }
          id="crl"
          label={<Trans>Certificate Revocation List</Trans>}
          mb="md"
          placeholder="/opt/myCA/certs/crl.pem"
          {...register("CRL")}
        />
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              description={
                <Trans>Number of days the generated CRL should be valid.</Trans>
              }
              id="validity_period"
              inputMode="numeric"
              label={<Trans>Validity Period</Trans>}
              placeholder="30"
              {...register("CRL_Validity_Period")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              description={
                <Trans>
                  Number of days a new CRL should be generated before the current CRL
                  expires.
                </Trans>
              }
              id="overlap_period"
              inputMode="numeric"
              label={<Trans>Overlap Period</Trans>}
              placeholder="10"
              {...register("CRL_Overlap_Period")}
            />
          </Grid.Col>
        </Grid>
      </Card>
    </form>
  );
}

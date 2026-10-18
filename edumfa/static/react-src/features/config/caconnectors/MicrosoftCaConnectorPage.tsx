import { Trans, useLingui } from "@lingui/react/macro";
import { useParams } from "react-router-dom";

import { CaConnectorEditorFrame, useCaConnectorEditor } from "./caConnectorEditor";
import { MicrosoftCaConnectorForm } from "./MicrosoftCaConnectorForm";

/** Port of `config.caconnectors.microsoft.html` and `MicrosoftCAConnectorController`. */
export function MicrosoftCaConnectorPage() {
  const { t } = useLingui();

  const { connectorname } = useParams();
  const editor = useCaConnectorEditor(connectorname);

  return (
    <CaConnectorEditorFrame
      editor={editor}
      title={
        connectorname ? (
          <Trans>Edit Microsoft CA Connector {connectorname}</Trans>
        ) : (
          t`Create a new Microsoft CA Connector`
        )
      }
    >
      <MicrosoftCaConnectorForm
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

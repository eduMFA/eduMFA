import { Trans, useLingui } from "@lingui/react/macro";
import { useParams } from "react-router-dom";

import { CaConnectorEditorFrame, useCaConnectorEditor } from "./caConnectorEditor";
import { LocalCaConnectorForm } from "./LocalCaConnectorForm";

/** Port of `config.caconnectors.local.html` and `LocalCAConnectorController`. */
export function LocalCaConnectorPage() {
  const { t } = useLingui();

  const { connectorname } = useParams();
  const editor = useCaConnectorEditor(connectorname);

  return (
    <CaConnectorEditorFrame
      editor={editor}
      title={
        connectorname ? (
          <Trans>Edit Local CA Connector {connectorname}</Trans>
        ) : (
          t`Create a new Local CA Connector`
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

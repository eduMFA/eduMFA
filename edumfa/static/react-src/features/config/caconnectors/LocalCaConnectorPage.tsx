import { Trans } from "@lingui/react/macro";
import { useParams } from "react-router-dom";

import { CaConnectorEditorFrame, useCaConnectorEditor } from "./caConnectorEditor";
import { LocalCaConnectorForm } from "./LocalCaConnectorForm";

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

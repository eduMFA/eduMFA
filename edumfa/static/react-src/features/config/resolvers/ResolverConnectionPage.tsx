import { Trans } from "@lingui/react/macro";
import { useParams } from "react-router-dom";

import { ResolverConnectionForm } from "./ResolverConnectionForm";
import { ResolverEditorLayout } from "./ResolverEditorLayout";
import type { ResolverConnectionConfig } from "./resolverFields";
import { useStoredResolver } from "./useResolverEditor";

/** Shared load, validation, test and save flow for the connection-based resolvers. */
export function ResolverConnectionPage(props: ResolverConnectionConfig) {
  const { resolvername = "" } = useParams();
  const stored = useStoredResolver(resolvername);
  const { label } = props;

  return (
    <ResolverEditorLayout
      resolverName={resolvername}
      resolverType={props.type}
      stored={stored}
      title={
        resolvername ? (
          <Trans>
            Edit {label} Resolver {resolvername}
          </Trans>
        ) : (
          <Trans>Create a new {label} Resolver</Trans>
        )
      }
    >
      <ResolverConnectionForm
        {...props}
        key={`${props.type}:${resolvername}`}
        resolverName={resolvername}
        storedData={stored.data}
      />
    </ResolverEditorLayout>
  );
}

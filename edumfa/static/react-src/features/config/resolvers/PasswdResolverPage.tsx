import { Trans, useLingui } from "@lingui/react/macro";
import { useParams } from "react-router-dom";

import { PasswdResolverForm } from "./PasswdResolverForm";
import { ResolverEditorLayout } from "./ResolverEditorLayout";
import { useStoredResolver } from "./useResolverEditor";

/** Port of `config.resolvers.passwd.html` and `PasswdResolverController`. */
export function PasswdResolverPage() {
  const { t } = useLingui();

  const { resolvername = "" } = useParams();
  const stored = useStoredResolver(resolvername);

  return (
    <ResolverEditorLayout
      resolverName={resolvername}
      resolverType="passwdresolver"
      stored={stored}
      title={
        resolvername ? (
          <Trans>Edit Passwd Resolver {resolvername}</Trans>
        ) : (
          t`Create a new Passwd Resolver`
        )
      }
    >
      <PasswdResolverForm
        key={resolvername}
        resolverName={resolvername}
        storedData={stored.data}
      />
    </ResolverEditorLayout>
  );
}

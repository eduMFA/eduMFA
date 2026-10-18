import { useEffect, useState } from "react";

import { HsmNotReadyAlert } from "./HsmNotReadyAlert";
import { LoginForm } from "./LoginForm";
import { LoginHintAlert } from "./LoginHintAlert";
import { LoginShell } from "./LoginShell";
import { RemoteUserLoginCard } from "./RemoteUserLoginCard";
import { useAuthenticate } from "./useAuthenticate";
import { popFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";
import { getUiConfig } from "@/lib/uiConfig";

/**
 * Port of `login.html`: the credentials form with the optional realm
 * dropdown, or the "Login as <web server user>" card. A successful login is
 * handed to the Angular controller (`useAuthenticate`); a challenge moves on
 * to `/response`.
 */
export function LoginPage() {
  const [config] = useState(() => getUiConfig());
  const logoUrl = config.logo
    ? `${config.instanceUrl}/static/css/${config.logo}`
    : null;
  const [withCredentials, setWithCredentials] = useState(
    () => config.remoteUser === ""
  );
  const authenticateMutation = useAuthenticate({ step: "login" });

  // Notices handed over by the PIN change page ("PIN changed successfully.").
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  if (!config.hsmReady) {
    return (
      <LoginShell>
        <HsmNotReadyAlert />
      </LoginShell>
    );
  }

  if (!withCredentials) {
    return (
      <LoginShell>
        <RemoteUserLoginCard
          config={config}
          isPending={authenticateMutation.isPending}
          logoUrl={logoUrl}
          onLogin={() => {
            authenticateMutation.mutate({ password: "", username: config.remoteUser });
          }}
          onUseCredentials={() => {
            setWithCredentials(true);
          }}
        />
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <LoginHintAlert />
      <LoginForm
        config={config}
        isPending={authenticateMutation.isPending}
        logoUrl={logoUrl}
        onSubmit={(request) => {
          authenticateMutation.mutate(request);
        }}
      />
    </LoginShell>
  );
}

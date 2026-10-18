import { Navigate, useParams } from "react-router-dom";

import { isTokenConfigTypeKey } from "./tokenConfigForm";
import { TokenConfigEditor } from "./TokenConfigEditor";

export function TokenConfigPage() {
  const { tokentype = "hotp" } = useParams();
  if (!isTokenConfigTypeKey(tokentype))
    return <Navigate replace to="/config/tokens/hotp" />;
  return <TokenConfigEditor key={tokentype} tokenType={tokentype} />;
}

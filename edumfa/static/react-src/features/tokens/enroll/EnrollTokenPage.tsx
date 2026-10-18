import { useParams } from "react-router-dom";

import { EnrollTokenForm } from "./EnrollTokenForm";
import type { EnrollMode } from "./enrollForm";

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

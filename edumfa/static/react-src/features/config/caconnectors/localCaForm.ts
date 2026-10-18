import { readText } from "./caConnectorForm";
import type { CaConnector } from "@/api/caConnectors";

/**
 * The form model. `opensslCnf` stands for the stored key `openssl.cnf`,
 * which react-hook-form would otherwise read as a nested path.
 */
export interface LocalCaFormValues {
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

/** The form values of the loaded connector, or the blanks of a new one. */
export function toLocalCaFormValues(connector: CaConnector | null): LocalCaFormValues {
  const data = connector?.data ?? {};

  return {
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
  };
}

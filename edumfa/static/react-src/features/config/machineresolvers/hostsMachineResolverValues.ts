/** The form fields of a hosts file machine resolver. */
export interface HostsFormValues {
  filename: string;
  resolvername: string;
}

/** The legacy controller preset this file for a new resolver. */
export const defaultFilename = "/etc/hosts";

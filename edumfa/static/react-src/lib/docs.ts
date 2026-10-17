import { useAuth } from "@/auth/AuthProvider";

/** The legacy views linked `https://edumfa.readthedocs.io/en/v<version>/...`. */
export function docsUrl(path: string, version: string | null): string {
  const release = version ? `v${version}` : "latest";

  return `https://edumfa.readthedocs.io/en/${release}/${path}`;
}

/** Documentation link for the running version; "latest" before a login. */
export function useDocsUrl(path: string): string {
  const { versionNumber } = useAuth();

  return docsUrl(path, versionNumber);
}

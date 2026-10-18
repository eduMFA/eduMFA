import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  importTokens,
  tokenQueryKeys,
  type PskcValidateMac,
  type TokenImportFileType,
  type TokenImportResult
} from "@/api/tokens";

/**
 * The import form state and the upload. The tokens go into `defaultRealm`
 * until the administrator picks another realm.
 */
export function useTokenImport(defaultRealm: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [fileType, setFileType] = useState<TokenImportFileType>("OATH CSV");
  const [psk, setPsk] = useState("");
  const [password, setPassword] = useState("");
  const [validateMac, setValidateMac] = useState<PskcValidateMac | "">("");
  const [selectedRealm, setSelectedRealm] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [result, setResult] = useState<TokenImportResult | null>(null);
  const activeRealm = selectedRealm || defaultRealm;

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      importTokens(apiClient, file, {
        fileType,
        realm: activeRealm,
        ...(fileType === "pskc"
          ? {
              password,
              psk,
              ...(validateMac ? { pskcValidateMac: validateMac } : {})
            }
          : {})
      }),
    onSuccess: async (importResult, file) => {
      setUploadedFile(file.name);
      setResult(importResult);
      await queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
    }
  });

  return {
    activeRealm,
    fileType,
    password,
    psk,
    result,
    setFileType,
    setPassword,
    setPsk,
    setSelectedRealm,
    setValidateMac,
    uploadMutation,
    uploadedFile,
    validateMac
  };
}

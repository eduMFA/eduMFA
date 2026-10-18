import { useLingui } from "@lingui/react/macro";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { BaseSyntheticEvent } from "react";
import { useForm, type FormState, type UseFormRegister } from "react-hook-form";

import { useApiClient } from "@/api/ApiClientProvider";
import { updateUser, type UserDetail } from "@/api/users";
import { notify } from "@/lib/notify";

export interface PasswordFormValues {
  password: string;
  passwordRepeat: string;
}

export interface ChangePassword {
  formState: FormState<PasswordFormValues>;
  mutation: UseMutationResult<boolean, Error, PasswordFormValues>;
  register: UseFormRegister<PasswordFormValues>;
  submitPassword: (event?: BaseSyntheticEvent) => Promise<void>;
}

/** The password form of the own user record and the `PUT /user/` behind it. */
export function useChangePassword(userDetail: UserDetail | null): ChangePassword {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { formState, handleSubmit, register, reset } = useForm<PasswordFormValues>({
    defaultValues: { password: "", passwordRepeat: "" },
    mode: "onChange"
  });

  const mutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      updateUser(apiClient, userDetail?.resolver ?? "", {
        password: values.password,
        username: userDetail?.username ?? ""
      }),
    onSuccess: () => {
      notify(t`Password set successfully.`, "success");
      reset();
    }
  });

  const submitPassword = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return { formState, mutation, register, submitPassword };
}

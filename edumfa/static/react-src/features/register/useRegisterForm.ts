import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import type { RegisterFormValues } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import { registerUser } from "@/api/register";

/**
 * The registration form state and its `POST /register`: the form validates
 * on change and is cleared after a successful registration.
 */
export function useRegisterForm() {
  const apiClient = useApiClient();
  const { formState, handleSubmit, register, reset } = useForm<RegisterFormValues>({
    mode: "onChange"
  });
  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerUser(apiClient, {
        email: values.email,
        givenname: values.givenname,
        mobile: values.mobile,
        password: values.password,
        phone: values.phone,
        surname: values.surname,
        username: values.username
      })
  });

  const submitForm = handleSubmit((values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        reset();
      }
    });
  });

  return { formState, register, registerMutation, submitForm };
}

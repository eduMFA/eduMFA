import { Center } from "@mantine/core";

export interface LoginLogoProps {
  url: string | null;
}

/** The instance logo above the sign-in heading (`EDUMFA_LOGO`). */
export function LoginLogo({ url }: LoginLogoProps) {
  if (!url) {
    return null;
  }

  return (
    <Center mb="md">
      <img alt="" src={url} width={90} />
    </Center>
  );
}

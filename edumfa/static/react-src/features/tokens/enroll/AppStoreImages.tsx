import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { Box, SimpleGrid, Text } from "@mantine/core";

import type { AuthenticatorAppImages } from "@/auth/AuthProvider";

const appStores = [
  {
    alt: msg`QR-Code with link to android app in play store`,
    help: msg`Get the Authenticator App for Android.`,
    key: "android"
  },
  {
    alt: msg`QR-Code with link to iOS app in app store`,
    help: msg`Get the Authenticator App for iOS.`,
    key: "ios"
  },
  {
    alt: msg`QR-Code with link to a custom app`,
    help: msg`Get the Authenticator App.`,
    key: "custom"
  }
] as const;

export interface AppStoreImagesProps {
  images: AuthenticatorAppImages;
  isWizard: boolean;
  width: number;
}

/** The authenticator app store QR codes of `token.display.apps.html`. */
export function AppStoreImages({ images, isWizard, width }: AppStoreImagesProps) {
  const { i18n } = useLingui();
  const entries = appStores.flatMap((store) => {
    const src = images[store.key];

    return src ? [{ ...store, src }] : [];
  });

  if (entries.length === 0) {
    return null;
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: Math.min(entries.length, 3) }}
      data-testid="authenticator-app-images"
      mx={isWizard ? "auto" : 0}
      spacing="md"
    >
      {entries.map((entry) => (
        <Box key={entry.key} ta="center">
          <img
            alt={i18n._(entry.alt)}
            src={entry.src}
            style={{ maxWidth: "100%" }}
            width={width}
          />
          <Text c="dimmed" size="sm">
            {i18n._(entry.help)}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}

import { Button, Group } from "@mantine/core";

import type { ResolverPreset, ResolverValues } from "./resolverFields";

export interface ResolverPresetButtonsProps {
  onSelect: (values: ResolverValues) => void;
  presets: ResolverPreset[];
}

/** The preset buttons (e.g. "Preset Active Directory") that fill in a known setup. */
export function ResolverPresetButtons({
  onSelect,
  presets
}: ResolverPresetButtonsProps) {
  return (
    <Group>
      {presets.map((preset, index) => (
        <Button
          key={index}
          onClick={() => {
            onSelect(preset.values);
          }}
          type="button"
          variant="default"
        >
          {preset.label}
        </Button>
      ))}
    </Group>
  );
}

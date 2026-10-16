/**
 * Mantine appends an asterisk to the label of required inputs, so
 * `getByLabelText("Resolver")` no longer matches "Resolver *". This matcher
 * accepts both spellings.
 */
export function fieldLabel(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( \\*)?$`);
}

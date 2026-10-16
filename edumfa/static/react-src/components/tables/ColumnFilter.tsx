export interface ColumnFilterProps {
  label: string;
  onChange: (value: string) => void;
  /** Called when the user presses Enter, e.g. to apply a debounced filter now. */
  onSubmit?: (() => void) | undefined;
  placeholder?: string | undefined;
  value: string;
}

/**
 * Column filter input, replacing the legacy `pi-filter` directive.
 * Filtering is live; React Query cancels superseded requests through the
 * abort signal, like the legacy `$q` canceller did.
 */
export function ColumnFilter({
  label,
  onChange,
  onSubmit,
  placeholder,
  value
}: ColumnFilterProps) {
  return (
    <input
      aria-label={label}
      className="form-control input-sm"
      onChange={(event) => {
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && onSubmit) {
          event.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  );
}

import type { SystemConfig } from "@/api/config";
import type {
  TokenConfigForm,
  TokenConfigValue
} from "@/features/config/tokens/tokenConfigForm";

/** Staged changes by config key; `null` removes a staged entry again. */
export type TokenConfigUpdate = Record<string, TokenConfigValue | null>;

/** Props of the per-type field components (the `config.token.<type>.html` partials). */
export interface TokenConfigFieldsProps {
  /** Delete buttons for stored entries need the `configdelete` right. */
  canDelete: boolean;
  /** Actions that save right away (add question, create API key) need `configwrite`. */
  canWrite: boolean;
  /** The loaded config with the legacy defaults applied and the staged edits on top. */
  form: TokenConfigForm;
  isSaving: boolean;
  onChange: (update: TokenConfigUpdate) => void;
  onDeleteEntry: (key: string) => void;
  /** Posts the staged changes; the legacy `addQuestion` saved immediately. */
  onSave: () => void;
  /** The config as loaded, for the question and Yubikey API key tables. */
  savedConfig: SystemConfig;
}

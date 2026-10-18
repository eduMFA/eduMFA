import type { useDefinitionMutations } from "./useDefinitionMutations";

/** The fields every listed definition (event handler, periodic task) has in common. */
export interface Definition {
  id: number;
  name: string;
  active: boolean;
  ordering: number;
}

/** What `useDefinitionMutations` returns for a definition type saved with request `T`. */
export type DefinitionMutations<T> = ReturnType<typeof useDefinitionMutations<T>>;

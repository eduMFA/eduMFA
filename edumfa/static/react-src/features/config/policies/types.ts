import type { usePolicyMutations } from "./usePolicyMutations";

/** The save, toggle and delete mutations the policy pages share. */
export type PolicyMutations = ReturnType<typeof usePolicyMutations>;

import { BooleanPill } from "@/components/feedback/BooleanPill";

/** The `sig_check` / `missing_line` columns: OK or FAIL as a pill. */
export function CheckLabel({ value }: { value: "FAIL" | "OK" | null | undefined }) {
  if (!value) {
    return null;
  }

  return <BooleanPill falseLabel="FAIL" trueLabel="OK" value={value === "OK"} />;
}

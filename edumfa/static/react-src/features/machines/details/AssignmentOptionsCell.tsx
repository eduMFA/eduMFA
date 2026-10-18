import { Text } from "@mantine/core";

import type { AssignmentEditor } from "./useAssignmentEditor";
import type { ApplicationOptionSpec, MachineTokenAssignment } from "@/api/machines";
import { ApplicationOptionInput } from "@/components/forms/ApplicationOptionInput";
import { capitalize } from "@/lib/strings";

export interface AssignmentOptionsCellProps {
  assignment: MachineTokenAssignment;
  editor: AssignmentEditor;
  optionSpecs: Record<string, ApplicationOptionSpec>;
}

/** The options of one assignment; inputs while that row is being edited. */
export function AssignmentOptionsCell({
  assignment,
  editor,
  optionSpecs
}: AssignmentOptionsCellProps) {
  if (editor.editingAssignmentId === assignment.id) {
    return Object.entries(optionSpecs).map(([name, spec]) => (
      <ApplicationOptionInput
        idPrefix={`option_${String(assignment.id)}`}
        key={name}
        name={name}
        onChange={(value) => {
          editor.setDraftOption(name, value);
        }}
        spec={spec}
        value={editor.draftOptions[name]}
      />
    ));
  }

  return Object.keys(optionSpecs).map((name) => (
    <Text key={name} size="sm">
      <b>{capitalize(name)}:</b> {assignment.options[name]}
    </Text>
  ));
}

import { Text } from "@mantine/core";

import type { MachineAssignmentEditor } from "./useMachineAssignmentEditor";
import type { ApplicationOptionSpec, MachineTokenAssignment } from "@/api/machines";
import { ApplicationOptionInput } from "@/components/forms/ApplicationOptionInput";
import { capitalize } from "@/lib/strings";

export interface AssignmentOptionsCellProps {
  assignment: MachineTokenAssignment;
  editor: MachineAssignmentEditor;
  /** The options the assignment's application defines. */
  optionSpecs: Record<string, ApplicationOptionSpec>;
}

/** The option values of an assignment, as inputs while it is being edited. */
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

import { useState } from "react";

export interface CustomAttributeDraft {
  allowedValues: string[];
  canAddAttribute: boolean;
  customAttributeKey: string;
  customAttributeValue: string;
  resolvedAttributeKey: string;
  resolvedAttributeValue: string;
  selectAttributeKey: (key: string) => void;
  selectAttributeValue: (value: string) => void;
  selectedAttributeKey: string;
  selectedAttributeValue: string;
  setCustomAttributeKey: (value: string) => void;
  setCustomAttributeValue: (value: string) => void;
}

/**
 * The inputs of the "add custom attribute" toolbar. A key or value of "*"
 * switches the respective select to free text input.
 */
export function useCustomAttributeDraft(
  settableAttributes: Record<string, string[]>
): CustomAttributeDraft {
  const [selectedAttributeKey, setSelectedAttributeKey] = useState("");
  const [customAttributeKey, setCustomAttributeKey] = useState("");
  const [selectedAttributeValue, setSelectedAttributeValue] = useState("");
  const [customAttributeValue, setCustomAttributeValue] = useState("");
  const allowedValues = settableAttributes[selectedAttributeKey] ?? [];
  const resolvedAttributeKey =
    selectedAttributeKey === "*" ? customAttributeKey.trim() : selectedAttributeKey;
  const resolvedAttributeValue =
    selectedAttributeValue === "*" ? customAttributeValue : selectedAttributeValue;
  const canAddAttribute =
    resolvedAttributeKey.length > 0 && resolvedAttributeValue.length > 0;

  const selectAttributeKey = (key: string) => {
    const values = settableAttributes[key] ?? [];

    setSelectedAttributeKey(key);
    setCustomAttributeKey("");
    setCustomAttributeValue("");
    // With a single allowed value there is nothing to choose, so preselect it.
    setSelectedAttributeValue(values.length === 1 ? (values[0] ?? "") : "");
  };

  const selectAttributeValue = (value: string) => {
    setSelectedAttributeValue(value);
    setCustomAttributeValue("");
  };

  return {
    allowedValues,
    canAddAttribute,
    customAttributeKey,
    customAttributeValue,
    resolvedAttributeKey,
    resolvedAttributeValue,
    selectAttributeKey,
    selectAttributeValue,
    selectedAttributeKey,
    selectedAttributeValue,
    setCustomAttributeKey,
    setCustomAttributeValue
  };
}

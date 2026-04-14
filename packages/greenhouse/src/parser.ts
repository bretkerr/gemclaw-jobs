import type { FormField, FormFieldType, FormQuestion } from "@repo/core";
import type { GhQuestion } from "./types.js";

const VALID_FIELD_TYPES = new Set<string>([
  "input_text",
  "input_file",
  "textarea",
  "multi_value_single_select",
  "multi_value_multi_select",
]);

function normalizeFieldType(raw: string): FormFieldType {
  if (VALID_FIELD_TYPES.has(raw)) {
    return raw as FormFieldType;
  }
  return "input_text";
}

export function parseQuestions(raw: GhQuestion[]): FormQuestion[] {
  return raw.map((q) => ({
    label: q.label,
    required: q.required,
    fields: q.fields.map(
      (f): FormField => ({
        name: f.name,
        label: q.label,
        type: normalizeFieldType(f.type),
        required: q.required,
        values: f.values ?? [],
      }),
    ),
  }));
}

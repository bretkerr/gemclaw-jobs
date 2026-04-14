import { describe, it, expect } from "vitest";
import { parseQuestions } from "./parser.js";
import type { GhQuestion } from "./types.js";

describe("parseQuestions", () => {
  it("maps basic text fields", () => {
    const raw: GhQuestion[] = [
      {
        label: "First Name",
        required: true,
        fields: [{ name: "first_name", type: "input_text", values: [] }],
      },
    ];

    const result = parseQuestions(raw);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      label: "First Name",
      required: true,
      fields: [
        {
          name: "first_name",
          label: "First Name",
          type: "input_text",
          required: true,
          values: [],
        },
      ],
    });
  });

  it("maps file upload fields", () => {
    const raw: GhQuestion[] = [
      {
        label: "Resume",
        required: true,
        fields: [{ name: "resume", type: "input_file", values: [] }],
      },
    ];

    const result = parseQuestions(raw);

    expect(result[0]!.fields[0]!.type).toBe("input_file");
  });

  it("maps select fields with values", () => {
    const raw: GhQuestion[] = [
      {
        label: "Source",
        required: false,
        fields: [
          {
            name: "source",
            type: "multi_value_single_select",
            values: [
              { label: "LinkedIn", value: 1 },
              { label: "Referral", value: 2 },
            ],
          },
        ],
      },
    ];

    const result = parseQuestions(raw);

    expect(result[0]!.fields[0]!.type).toBe("multi_value_single_select");
    expect(result[0]!.fields[0]!.values).toEqual([
      { label: "LinkedIn", value: 1 },
      { label: "Referral", value: 2 },
    ]);
  });

  it("normalizes unknown field types to input_text", () => {
    const raw: GhQuestion[] = [
      {
        label: "Custom",
        required: false,
        fields: [{ name: "custom", type: "unknown_type", values: [] }],
      },
    ];

    const result = parseQuestions(raw);

    expect(result[0]!.fields[0]!.type).toBe("input_text");
  });

  it("handles empty question list", () => {
    expect(parseQuestions([])).toEqual([]);
  });

  it("handles questions with multiple fields", () => {
    const raw: GhQuestion[] = [
      {
        label: "Name",
        required: true,
        fields: [
          { name: "first_name", type: "input_text", values: [] },
          { name: "last_name", type: "input_text", values: [] },
        ],
      },
    ];

    const result = parseQuestions(raw);

    expect(result[0]!.fields).toHaveLength(2);
    expect(result[0]!.fields[0]!.name).toBe("first_name");
    expect(result[0]!.fields[1]!.name).toBe("last_name");
  });
});

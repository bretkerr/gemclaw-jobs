import Papa from "papaparse";

/**
 * Parses a CSV string into an array of typed row objects using PapaParse.
 * Assumes the first row contains headers.
 */
export function parseCSV<T extends Record<string, unknown>>(
  csvContent: string,
): T[] {
  if (!csvContent.trim()) return [];

  const result = Papa.parse<T>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  // Filter out non-fatal delimiter-detection warnings that PapaParse emits
  // for single-column CSVs or very short inputs.
  const fatalErrors = result.errors.filter(
    (e) => e.type !== "Delimiter" && e.type !== "FieldMismatch",
  );

  if (fatalErrors.length > 0) {
    const first = fatalErrors[0];
    throw new Error(`CSV parse error at row ${first?.row}: ${first?.message}`);
  }

  return result.data;
}

import AdmZip from "adm-zip";

/**
 * Extracts a LinkedIn data export ZIP file and returns a map of
 * filename (without directory prefix) to file content as a string.
 */
export function extractZip(zipPath: string): Map<string, string> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const files = new Map<string, string>();

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    // LinkedIn ZIPs sometimes nest files in a subdirectory — strip any path prefix
    const name = entry.entryName.split("/").pop() ?? entry.entryName;
    const content = entry.getData().toString("utf-8");
    files.set(name, content);
  }

  return files;
}

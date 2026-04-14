import { chromium } from "playwright";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

interface FormData {
  [key: string]: string | number;
}

interface FillResult {
  success: boolean;
  screenshotBase64?: string;
  message: string;
}

export async function fillGreenhouseForm(
  url: string,
  formData: FormData,
  resumeBase64?: string,
): Promise<FillResult> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // Fill standard fields
    for (const [field, value] of Object.entries(formData)) {
      const strValue = String(value);

      // Try to find the field by name attribute
      const input = page.locator(`[name="${field}"], [id="${field}"]`).first();
      const count = await input.count();

      if (count === 0) {
        continue;
      }

      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
      const inputType = await input.getAttribute("type");

      if (tagName === "select") {
        await input.selectOption({ label: strValue }).catch(() => {
          input.selectOption(strValue);
        });
      } else if (tagName === "textarea") {
        await input.fill(strValue);
      } else if (inputType === "file") {
        // Skip file inputs — handled below
        continue;
      } else {
        await input.fill(strValue);
      }
    }

    // Handle resume upload
    if (resumeBase64) {
      const resumePath = join(tmpdir(), `resume-${Date.now()}.pdf`);
      const buffer = Buffer.from(resumeBase64, "base64");
      writeFileSync(resumePath, buffer);

      const fileInput = page.locator('input[type="file"][name*="resume"], input[type="file"]').first();
      const fileCount = await fileInput.count();
      if (fileCount > 0) {
        await fileInput.setInputFiles(resumePath);
      }

      // Cleanup temp file
      try {
        unlinkSync(resumePath);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Take screenshot of filled form for review
    const screenshot = await page.screenshot({ fullPage: true });
    const screenshotBase64 = screenshot.toString("base64");

    return {
      success: true,
      screenshotBase64,
      message: "Form filled. Paused at review step — manual submission required.",
    };
  } catch (e) {
    return {
      success: false,
      message: `Form fill failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  } finally {
    await browser.close();
  }
}

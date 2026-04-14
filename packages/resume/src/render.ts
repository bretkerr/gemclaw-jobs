import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { UserProfile } from "@repo/core";
import { StandardResume } from "./templates/standard.js";
import { ModernResume } from "./templates/modern.js";

export type ResumeTemplate = "standard" | "modern";

export interface RenderResumeOptions {
  profile: UserProfile;
  tailoredBullets?: string[];
  tailoredSummary?: string;
  template?: ResumeTemplate;
}

export async function renderResume(options: RenderResumeOptions): Promise<Uint8Array> {
  const { profile, tailoredBullets, tailoredSummary, template = "standard" } = options;

  const props = { profile, tailoredBullets, tailoredSummary };

  const element =
    template === "modern"
      ? React.createElement(ModernResume, props)
      : React.createElement(StandardResume, props);

  const buffer = await renderToBuffer(element as React.ReactElement);
  return new Uint8Array(buffer);
}

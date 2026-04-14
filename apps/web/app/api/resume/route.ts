import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile, tailoredBullets, tailoredSummary, template } = body;

    if (!profile) {
      return NextResponse.json({ error: "Missing profile data" }, { status: 400 });
    }

    const { renderResume } = await import("@repo/resume");
    const pdf = await renderResume({ profile, tailoredBullets, tailoredSummary, template });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF generation failed" },
      { status: 500 },
    );
  }
}

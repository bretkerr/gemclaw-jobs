import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boardToken, jobId } = body;

    if (!boardToken || !jobId) {
      return NextResponse.json({ error: "Missing boardToken or jobId" }, { status: 400 });
    }

    // Pipeline execution will be wired up when AI package is imported
    return NextResponse.json({
      message: "Pipeline execution endpoint. Use CLI for full pipeline: jobseek apply --board <token> --job <id>",
      boardToken,
      jobId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}

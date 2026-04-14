import { NextRequest, NextResponse } from "next/server";

const GREENHOUSE_BASE = "https://boards-api.greenhouse.io";

export async function GET(request: NextRequest) {
  const board = request.nextUrl.searchParams.get("board");
  const keyword = request.nextUrl.searchParams.get("keyword");

  if (!board) {
    return NextResponse.json({ error: "Missing board parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GREENHOUSE_BASE}/v1/boards/${board}/jobs?content=true`);
    if (!res.ok) {
      return NextResponse.json({ error: `Greenhouse API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    let jobs = (data.jobs || []).map((j: Record<string, unknown>) => ({
      id: j.id,
      title: j.title,
      location: (j.location as Record<string, string>)?.name ?? "Remote",
      departments: ((j.departments as Array<Record<string, string>>) || []).map((d) => d.name),
      absoluteUrl: j.absolute_url,
    }));

    if (keyword) {
      const kw = keyword.toLowerCase();
      jobs = jobs.filter(
        (j: { title: string; departments: string[] }) =>
          j.title.toLowerCase().includes(kw) ||
          j.departments.some((d: string) => d.toLowerCase().includes(kw)),
      );
    }

    return NextResponse.json({ jobs, total: jobs.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}

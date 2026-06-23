import { NextRequest, NextResponse } from "next/server";

interface ScamReport {
  id: string;
  domain: string;
  reason: string;
  reporter: string;
  timestamp: string;
  votes: number;
}

const reports: ScamReport[] = [];

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { domain, reason, reporter = "anonymous" } = body;

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "domain_required" }, { status: 400 });
  }

  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }

  const report: ScamReport = {
    id: crypto.randomUUID(),
    domain: domain.toLowerCase().trim(),
    reason: reason.slice(0, 500),
    reporter: reporter.slice(0, 100),
    timestamp: new Date().toISOString(),
    votes: 1,
  };

  reports.push(report);

  console.log(`[Gorgon.Net] Scam report filed: ${domain} — "${reason}"`);

  return NextResponse.json(
    { success: true, reportId: report.id, domain: report.domain },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const domain = url.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ reports: reports.slice(-50) }, { status: 200 });
  }

  const domainReports = reports.filter(
    (r) => r.domain === domain.toLowerCase().trim()
  );

  return NextResponse.json(
    { domain, count: domainReports.length, reports: domainReports },
    { status: 200 }
  );
}

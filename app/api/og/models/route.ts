import { NextResponse } from "next/server";

const OG_ROUTER_BASE = "https://router-api.0g.ai/v1";

let modelsCache: { data: any; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (modelsCache && Date.now() - modelsCache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(modelsCache.data, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const upstream = await fetch(`${OG_ROUTER_BASE}/models`, {
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream_error", status: upstream.status },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    modelsCache = { data, fetchedAt: Date.now() };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "proxy_error", message: err instanceof Error ? err.message : "Failed to fetch 0G models" },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const OG_ROUTER_BASE = "https://router-api.0g.ai/v1";

export async function POST(req: NextRequest) {
  const apiKey = process.env.VITE_0G_API_KEY || process.env.NEXT_PUBLIC_0G_API_KEY;

  if (!apiKey || apiKey === "sk-your-0g-api-key-here" || apiKey.trim() === "") {
    return NextResponse.json(
      {
        error: "missing_api_key",
        message: "0G API key not configured. Add VITE_0G_API_KEY=sk-... to your .env file. Get a key at https://pc.0g.ai",
      },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { messages, model = "deepseek-v4-flash", stream = false, max_tokens = 1024 } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "messages_required", message: "messages array is required" },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${OG_ROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, stream, max_tokens }),
    });

    if (stream && upstream.body) {
      return new Response(upstream.body as any, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-0G-Status": upstream.status.toString(),
        },
      });
    }

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream_error", status: upstream.status, detail: data },
        { status: upstream.status }
      );
    }

    const response = NextResponse.json(data);
    response.headers.set("X-0G-Model", data.model ?? model);
    response.headers.set("X-0G-Provider", upstream.headers.get("x-provider") ?? "unknown");
    return response;
  } catch (err) {
    console.error("[0G proxy error]", err);
    return NextResponse.json(
      { error: "proxy_error", message: err instanceof Error ? err.message : "Unknown error contacting 0G Router" },
      { status: 502 }
    );
  }
}

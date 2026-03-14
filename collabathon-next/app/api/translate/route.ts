import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "TRANSLATE_API_KEY missing" }, { status: 500 });
  const { text, target } = await request.json();

  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target })
  });
  const data = await res.json();
  return NextResponse.json(data);
}

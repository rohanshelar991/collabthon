import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.GOOGLE_RECAPTCHA_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, error: "Missing secret" }, { status: 500 });
  }
  const { token } = await request.json();
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }).toString()
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : 400 });
}

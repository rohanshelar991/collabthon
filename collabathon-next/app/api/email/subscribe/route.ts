import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return NextResponse.json({ error: "SENDGRID_API_KEY missing" }, { status: 500 });
  const { email, name } = await request.json();
  const listId = process.env.SENDGRID_LIST_ID;

  const res = await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      list_ids: listId ? [listId] : undefined,
      contacts: [{ email, first_name: name }]
    })
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

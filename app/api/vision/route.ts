import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "VISION_API_KEY missing" }, { status: 500 });

  const { imageBase64 } = await request.json();
  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "LABEL_DETECTION", maxResults: 5 }]
      }
    ]
  };

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-12-18.acacia" }) : null;

export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ error: "STRIPE_SECRET_KEY missing" }, { status: 500 });
  const { priceId, successUrl, cancelUrl, mode = "subscription" } = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: priceId ? [{ price: priceId, quantity: 1 }] : undefined,
    success_url: successUrl || "http://localhost:3000/dashboard?checkout=success",
    cancel_url: cancelUrl || "http://localhost:3000/dashboard?checkout=cancel",
    automatic_tax: { enabled: true }
  });

  return NextResponse.json({ url: session.url });
}

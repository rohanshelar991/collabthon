"use client";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

export function CheckoutButton({ priceId }: { priceId?: string }) {
  const [loading, setLoading] = useState(false);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const startCheckout = async () => {
    if (!publishableKey) {
      alert("Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout");
      return;
    }
    setLoading(true);
    const stripe = await loadStripe(publishableKey);
    const res = await fetch(/api/stripe/checkout, {
      method: POST,
      headers: { Content-Type: application/json },
      body: JSON.stringify({ priceId })
    });
    const data = await res.json();
    if (data.url && stripe) {
      window.location.href = data.url;
    } else {
      alert(Could

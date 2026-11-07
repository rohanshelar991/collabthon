"use client";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function logEvent(name: string, payload: Record<string, unknown> = {}) {
  try {
    await addDoc(collection(db, "analytics"), {
      name,
      payload,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("analytics log failed", err);
  }
}

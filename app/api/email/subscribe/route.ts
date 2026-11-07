import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function splitName(name?: string) {
  const trimmedName = name?.trim() || '';
  if (!trimmedName) return { firstName: undefined, lastName: undefined };

  const [firstName, ...rest] = trimmedName.split(/\s+/);
  return {
    firstName,
    lastName: rest.length ? rest.join(' ') : undefined
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 });
  }

  const { email, name } = await request.json();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  const { firstName, lastName } = splitName(name);

  try {
    const existing = await resend.contacts.get({ email: normalizedEmail });

    if (existing.data) {
      const updated = await resend.contacts.update({
        email: normalizedEmail,
        unsubscribed: false,
        firstName: firstName ?? null,
        lastName: lastName ?? null
      });

      if (updated.error) {
        return NextResponse.json({ error: updated.error.message }, { status: 502 });
      }

      return NextResponse.json(
        { ok: true, provider: 'resend', action: 'updated', contact: updated.data },
        { status: 200 }
      );
    }

    if (existing.error && existing.error.name !== 'not_found') {
      return NextResponse.json({ error: existing.error.message }, { status: 502 });
    }

    const created = await resend.contacts.create({
      email: normalizedEmail,
      firstName,
      lastName,
      unsubscribed: false
    });

    if (created.error) {
      return NextResponse.json({ error: created.error.message }, { status: 502 });
    }

    return NextResponse.json(
      { ok: true, provider: 'resend', action: 'created', contact: created.data },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync contact';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const message = clean(body.message, 4000);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_TO_EMAIL || 'rmshelar11@gmail.com';
    const sender = process.env.EMAIL_FROM || 'Collabathon <noreply@collabthon.com>';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Contact email is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: sender,
      to: [recipient],
      replyTo: email,
      subject: `Collabathon contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });

    if (result.error) {
      console.error('Contact email provider error:', result.error);
      return NextResponse.json(
        { error: 'We could not send your message right now. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'We could not send your message right now. Please try again.' },
      { status: 500 }
    );
  }
}

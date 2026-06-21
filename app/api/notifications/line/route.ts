import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, action } = body;

    if (!event || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch all active monks to display names in notification
    const monks = await db.monks.list();
    const assignedMonksNames = (event.assigned_monks || [])
      .map((id: string) => {
        const monk = monks.find((m) => m.id === id);
        return monk ? `${monk.name} (${monk.chaya})` : null;
      })
      .filter(Boolean)
      .join(', ');

    // 2. Send request to the external PHP notify API
    const phpNotifyUrl = 'https://www.watdongsedthee.com/line_oa_php/send_notify';
    const phpRes = await fetch(phpNotifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        event: {
          ...event,
          assigned_monks_names: assignedMonksNames
        }
      })
    });

    if (!phpRes.ok) {
      const errorText = await phpRes.text();
      console.error('PHP Notify API error:', errorText);
      return NextResponse.json({ error: 'PHP Notify API returned error' }, { status: 502 });
    }

    const result = await phpRes.json();
    return NextResponse.json({ success: true, hostResponse: result });

  } catch (err: any) {
    console.error('LINE notification Route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

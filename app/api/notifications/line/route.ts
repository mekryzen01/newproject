import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, action } = body;

    if (!event || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let formattedEvent = { ...event };

    if (action.includes('booking')) {
      // 1. Fetch sala details to get short name
      if (!formattedEvent.sala_name || formattedEvent.sala_name === 'ไม่ระบุ') {
        try {
          const salas = await db.salas.list();
          const sala = salas.find((s) => s.id === event.sala_id);
          formattedEvent.sala_name = sala ? sala.short_name : 'ไม่ระบุ';
        } catch (err) {
          console.error('Failed to fetch salas details for notification:', err);
          formattedEvent.sala_name = 'ไม่ระบุ';
        }
      }
    } else {
      // 1. Fetch all active monks to display names in notification
      try {
        const monks = await db.monks.list();
        const assignedMonksNames = (event.assigned_monks || [])
          .map((id: string) => {
            const monk = monks.find((m) => m.id === id);
            return monk ? `${monk.name} (${monk.chaya})` : null;
          })
          .filter(Boolean)
          .join(', ');
        
        formattedEvent.assigned_monks_names = assignedMonksNames;
      } catch (err) {
        console.error('Failed to fetch monks details for notification:', err);
      }
    }

    // 2. Send request to the external PHP notify API
    const phpNotifyUrl = 'https://www.watdongsedthee.com/line_oa_php/send_notify';
    const phpRes = await fetch(phpNotifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        event: formattedEvent
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

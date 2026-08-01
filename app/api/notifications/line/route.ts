import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, action, custom_message } = body;

    // Handle Direct Custom Message (e.g. Funeral Sala Booking LINE text summary)
    if (custom_message) {
      const settings = await db.settings.get().catch(() => ({} as any));
      
      // 1. Send to LINE Notify API if token is configured
      if (settings?.lineNotifyToken) {
        try {
          const params = new URLSearchParams();
          params.append('message', '\n' + custom_message);
          await fetch('https://notify-api.line.me/api/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${settings.lineNotifyToken}`
            },
            body: params.toString()
          });
        } catch (e) {
          console.error('Failed to post direct LINE Notify:', e);
        }
      }

      // 2. Send to LINE Channel Push API if group ID & token are configured
      if (settings?.lineChannelAccessToken && settings?.lineGroupId) {
        try {
          await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.lineChannelAccessToken}`
            },
            body: JSON.stringify({
              to: settings.lineGroupId,
              messages: [{ type: 'text', text: custom_message }]
            })
          });
        } catch (e) {
          console.error('Failed to post direct LINE Channel push:', e);
        }
      }

      // 3. Send to external PHP notify script as raw text message payload
      const phpNotifyUrl = 'https://www.watdongsedthee.com/line_oa_php/send_notify';
      await fetch(phpNotifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom_text',
          message: custom_message,
          title: custom_message,
          event: {
            title: custom_message,
            message: custom_message,
            custom_text: custom_message
          }
        })
      }).catch(e => console.error('PHP notify fetch error:', e));

      return NextResponse.json({ success: true });
    }

    if (!event || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const formattedEvent = { ...event };

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

    // 3. Send individual LINE Push notifications to assigned monks who have linked LINE User IDs
    if (!action.includes('booking')) {
      try {
        const settings = await db.settings.get();
        if (settings.lineChannelAccessToken) {
          const assignedMonks = event.assigned_monks || [];
          if (assignedMonks.length > 0) {
            const monks = await db.monks.list();
            const targetMonks = monks.filter((m) => assignedMonks.includes(m.id) && m.line_user_id);

            for (const monk of targetMonks) {
              const prefix = action === 'create_event' ? '🔔 แจ้งเตือนงานนิมนต์ใหม่' : '📝 แจ้งเตือนอัปเดตงานนิมนต์';
              const messageText = `${prefix} (ส่วนบุคคล)\n\nนมัสการพระคุณเจ้า ${monk.name} (ฉายา: ${monk.chaya})\n\nท่านได้รับมอบหมายงานนิมนต์ดังนี้:\n\n🌸 งานพิธี: ${event.title}\n📅 วันที่: ${formatThaiDate(event.date)}\n⏰ เวลา: ${event.time || 'ไม่ระบุ'} น.\n📍 สถานที่: ${event.location || 'วัดดอนเศรษฐี'}\n🧘 เจ้าภาพ: ${event.host || 'ไม่ระบุ'}\n📝 หมายเหตุ: ${event.description || '-'}\n\nกรุณาเตรียมความพร้อมและปฏิบัติศาสนพิธีตามวันและเวลาดังกล่าวครับ 🙏`;

              await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${settings.lineChannelAccessToken}`
                },
                body: JSON.stringify({
                  to: monk.line_user_id,
                  messages: [{
                    type: 'text',
                    text: messageText
                  }]
                })
              }).catch(e => console.error(`Failed to push private LINE notice to monk ${monk.name}:`, e));
            }
          }
        }
      } catch (err) {
        console.error('Failed to send individual monk LINE notifications:', err);
      }
    }

    return NextResponse.json({ success: true, hostResponse: result });

  } catch (err: any) {
    console.error('LINE notification Route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

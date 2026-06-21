import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      let groupId: string | null = null;
      
      if (event.source && (event.source.type === 'group' || event.source.type === 'room')) {
        groupId = event.source.groupId || event.source.roomId;
      }

      if (groupId) {
        // Automatically save the groupId into the system settings table
        const settings = await db.settings.get();
        
        if (settings.lineGroupId !== groupId) {
          await db.settings.save({
            ...settings,
            lineGroupId: groupId
          });
        }
        
        // If event is 'join' (bot just added to the group), send a nice welcoming greeting!
        if (event.type === 'join' && settings.lineChannelAccessToken) {
          const welcomeMessage = {
            to: groupId,
            messages: [
              {
                type: 'text',
                text: 'นมัสการพระคุณเจ้า และสวัสดีญาติโยมทุกท่าน 🙏\nบัดนี้ ระบบจัดการตารางวัด (Temple OS) ได้เชื่อมต่อเข้ากับกลุ่มไลน์นี้เรียบร้อยแล้ว! งานนิมนต์และศาสนพิธีทั้งหมดจะได้รับการแจ้งเตือนที่นี่โดยอัตโนมัติ'
              }
            ]
          };
          
          await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.lineChannelAccessToken}`
            },
            body: JSON.stringify(welcomeMessage)
          }).catch(e => console.error('Failed to send LINE welcome message:', e));
        }
      }
    }

    return new Response('OK', { status: 200 });

  } catch (err: any) {
    console.error('LINE Webhook Error:', err);
    return new Response('Error', { status: 500 });
  }
}

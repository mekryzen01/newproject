import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Calculate target date (Today + 3 days)
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 3);
    const targetDay = targetDate.getDate();

    // 2. Fetch all active recurring expenses
    const list = await db.recurringExpenses.list();
    const activeExpenses = list.filter(exp => exp.is_active && !exp.is_deleted);
    
    // 3. Filter expenses due on targetDay
    const matchingExpenses = activeExpenses.filter(exp => exp.pay_day === targetDay);

    if (matchingExpenses.length > 0) {
      // 4. Format Thai Date
      const thaiMonthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const formattedDateStr = `${targetDate.getDate()} ${thaiMonthNames[targetDate.getMonth()]} ${targetDate.getFullYear() + 543}`;

      // 5. Fetch settings & monks for private alerts
      const [settings, monks] = await Promise.all([
        db.settings.get(),
        db.monks.list()
      ]);

      // 6. Send individual LINE Push notifications to assigned payers
      if (settings.lineChannelAccessToken) {
        for (const exp of matchingExpenses) {
          if (exp.payer_monk_id) {
            const monk = monks.find(m => m.id === exp.payer_monk_id && m.line_user_id);
            if (monk) {
              const privateMsg = `🔔 แจ้งเตือนรายจ่ายประจำ (ผู้รับผิดชอบชำระ)\n\nนมัสการพระคุณเจ้า ${monk.name} (ฉายา: ${monk.chaya})\n\nท่านมีรายการรายจ่ายประจำที่เป็นผู้รับดูแล ซึ่งจะถึงกำหนดจ่ายในอีก 3 วันข้างหน้า (${formattedDateStr}):\n\n💸 รายการ: ${exp.title}\n💰 จำนวนเงิน: ${exp.amount.toLocaleString()} บาท\n📁 หมวดหมู่: ${exp.category}\n📝 รายละเอียด: ${exp.description || '-'}\n\nกรุณาช่วยดำเนินการหรือเตรียมการโอนชำระภายในกำหนดด้วยครับ 🙏`;

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
                    text: privateMsg
                  }]
                })
              }).catch(e => console.error(`Failed to push private warning to monk ${monk.name}:`, e));
            }
          }
        }
      }

      // 7. Construct Group LINE Message
      let msg = `🔔 แจ้งเตือนรายจ่ายประจำ (อีก 3 วันถึงกำหนดชำระ)\n`;
      msg += `------------------------\n`;
      msg += `วัดมีรายการรายจ่ายประจำที่จะถึงกำหนดชำระในวันที่ ${formattedDateStr} ดังนี้:\n\n`;

      matchingExpenses.forEach((exp, idx) => {
        const monkName = exp.payer_monk_id ? monks.find(m => m.id === exp.payer_monk_id)?.name : null;
        msg += `${idx + 1}. 💸 ${exp.title}\n`;
        msg += `   • จำนวนเงิน: ${exp.amount.toLocaleString()} บาท\n`;
        msg += `   • หมวดหมู่: ${exp.category}\n`;
        if (monkName) {
          msg += `   • ผู้รับผิดชอบ: ${monkName}\n`;
        }
        if (exp.description) {
          msg += `   • รายละเอียด: ${exp.description}\n`;
        }
        msg += `\n`;
      });

      msg += `กรุณาเตรียมความพร้อมในการชำระเงินตามกำหนดด้วยครับ 🙏`;

      // 8. Send request to LINE OA Group (via PHP notify wrapper)
      const phpNotifyUrl = 'https://www.watdongsedthee.com/line_oa_php/send_notify';
      const phpRes = await fetch(phpNotifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'recurring_warning',
          event: {
            message: msg
          }
        })
      });

      if (!phpRes.ok) {
        const errorText = await phpRes.text();
        console.error('PHP Notify API returned error on cron warning:', errorText);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification processed', 
        targetDay, 
        matchingCount: matchingExpenses.length, 
        expenses: matchingExpenses
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'No recurring expenses due in 3 days', 
      targetDay, 
      matchingCount: 0 
    });

  } catch (err: any) {
    console.error('Cron check-recurring-expenses error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 1. Fetch all important data
    const [transactions, events, monks, recurringExpenses, categories, settings] = await Promise.all([
      db.finance.list(),
      db.events.list(),
      db.monks.list(),
      db.recurringExpenses.list(),
      db.financialCategories.list(),
      db.settings.get()
    ]);

    const backupDate = new Date().toISOString();
    const backupData = {
      backup_date: backupDate,
      version: '1.0',
      system: 'WatdongOS',
      data: {
        transactions: { count: transactions.length, records: transactions },
        events: { count: events.length, records: events },
        monks: { count: monks.length, records: monks },
        recurring_expenses: { count: recurringExpenses.length, records: recurringExpenses },
        financial_categories: { count: categories.length, records: categories },
        settings: settings
      }
    };

    // 2. Format Thai date for the message
    const thaiMonthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const now = new Date();
    const formattedDate = `${now.getDate()} ${thaiMonthNames[now.getMonth()]} ${now.getFullYear() + 543}`;

    // 3. Build summary message
    let msg = `🛡️ สำรองข้อมูล WatdongOS สำเร็จ\n`;
    msg += `------------------------\n`;
    msg += `📅 วันที่สำรอง: ${formattedDate}\n`;
    msg += `⏰ เวลา: ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.\n\n`;
    msg += `📊 สรุปข้อมูลที่สำรอง:\n`;
    msg += `  • ธุรกรรมการเงิน: ${transactions.length} รายการ\n`;
    msg += `  • งานนิมนต์/พิธี: ${events.length} รายการ\n`;
    msg += `  • ทำเนียบบุคลากร: ${monks.length} รูป/ท่าน\n`;
    msg += `  • รายจ่ายประจำ: ${recurringExpenses.length} รายการ\n`;
    msg += `  • หมวดหมู่บัญชี: ${categories.length} หมวด\n\n`;
    msg += `✅ ระบบทำการสำรองข้อมูลเรียบร้อยแล้วครับ 🙏`;

    // 4. Send notification to LINE group
    try {
      const phpNotifyUrl = 'https://www.watdongsedthee.com/line_oa_php/send_notify';
      await fetch(phpNotifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'backup_complete',
          event: { message: msg }
        })
      });
    } catch (lineErr) {
      console.error('Failed to send backup notification via LINE:', lineErr);
    }

    // 5. Return backup data as JSON (can be downloaded or stored)
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="watdongos_backup_${backupDate.split('T')[0]}.json"`,
      }
    });

  } catch (err: any) {
    console.error('Backup API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

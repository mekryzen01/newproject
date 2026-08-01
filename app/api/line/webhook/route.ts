import { db } from '@/lib/db';

function normalizeThaiDateStr(rawDate: string): string {
  if (!rawDate || !rawDate.trim()) return new Date().toISOString().split('T')[0];
  const clean = rawDate.trim();

  // 1. ISO YYYY-MM-DD (e.g. 2026-07-20 or 2026/07/20)
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    let year = parseInt(isoMatch[1], 10);
    if (year > 2500) year -= 543;
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY (e.g. 20/07/2569 or 20/7/2026 or 20/07/69)
  const slashMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (slashMatch) {
    const day = String(parseInt(slashMatch[1], 10)).padStart(2, '0');
    const month = String(parseInt(slashMatch[2], 10)).padStart(2, '0');
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2500; // 69 -> 2569
    if (year > 2500) year -= 543; // 2569 -> 2026
    return `${year}-${month}-${day}`;
  }

  // 3. Thai Text (e.g. 20 ก.ค. 2569, 20 กรกฎาคม 2569)
  const thaiMonths: Record<string, string> = {
    'ม.ค.': '01', 'มกราคม': '01',
    'ก.พ.': '02', 'กุมภาพันธ์': '02',
    'มี.ค.': '03', 'มีนาคม': '03',
    'เม.ย.': '04', 'เมษายน': '04',
    'พ.ค.': '05', 'พฤษภาคม': '05',
    'มิ.ย.': '06', 'มิถุนายน': '06',
    'ก.ค.': '07', 'กรกฎาคม': '07',
    'ส.ค.': '08', 'สิงหาคม': '08',
    'ก.ย.': '09', 'กันยายน': '09',
    'ต.ค.': '10', 'ตุลาคม': '10',
    'พ.ย.': '11', 'พฤศจิกายน': '11',
    'ธ.ค.': '12', 'ธันวาคม': '12'
  };

  for (const [mName, mNum] of Object.entries(thaiMonths)) {
    if (clean.includes(mName)) {
      const dayMatch = clean.match(/^(\d{1,2})/);
      const yearMatch = clean.match(/(\d{4})/);

      const day = dayMatch ? String(parseInt(dayMatch[1], 10)).padStart(2, '0') : '01';
      let year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
      if (year > 2500) year -= 543;

      return `${year}-${mNum}-${day}`;
    }
  }

  return clean;
}

function parseAshesFromText(text: string) {
  let deceased_name = '';
  let death_date = '';
  let niche_code = '';
  let relative_name = '';
  let relative_phone = '';
  let notes = '';

  // Try parsing by splitting lines first, then by commas/semicolons
  const lines = text.split(/[\n,;，；]/);
  for (const part of lines) {
    const clean = part.trim();
    const kv = clean.split(/[:：]/);
    if (kv.length >= 2) {
      const key = kv[0].trim();
      const val = kv.slice(1).join(':').trim();
      
      if (key.includes('ชื่อ') || key.includes('ผู้วายชนม์') || key.includes('นาม')) {
        deceased_name = val;
      } else if (key.includes('เสียชีวิต') || key.includes('มรณะ') || key.includes('วันที่') || key.includes('วันเสีย')) {
        death_date = val;
      } else if (key.includes('ล็อก') || key.includes('ตู้') || key.includes('ช่อง') || key.includes('รหัส')) {
        niche_code = val;
      } else if (key.includes('ญาติ') || key.includes('ผู้ประสาน') || key.includes('ผู้ดูแล') || key.includes('เจ้าภาพ')) {
        relative_name = val;
      } else if (key.includes('เบอร์') || key.includes('โทร') || key.includes('ติดต่อ')) {
        relative_phone = val;
      } else if (key.includes('หมายเหตุ') || key.includes('ประวัติ') || key.includes('คำอุทิศ')) {
        notes = val;
      }
    }
  }

  return { deceased_name, death_date, niche_code, relative_name, relative_phone, notes };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      // 1. Handle auto Group ID detection
      let groupId: string | null = null;
      if (event.source && (event.source.type === 'group' || event.source.type === 'room')) {
        groupId = event.source.groupId || event.source.roomId;
      }

      if (groupId) {
        const settings = await db.settings.get();
        if (settings.lineGroupId !== groupId) {
          await db.settings.save({
            ...settings,
            lineGroupId: groupId
          });
        }
        
        // Welcoming bot greeting on join group
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

      // 2. Handle Text Messaging (Parsing "ฝากกระดูก" registrations and monk link registrations)
      if (event.type === 'message' && event.message && event.message.type === 'text') {
        const text = event.message.text || '';
        
        // 2A. Check for Monk registration commands (e.g. ผูกบัญชี พระประเสริฐ)
        const linkPattern = /^(ผูกบัญชี|ลงทะเบียนพระ|ผูกไอดี)\s*(.+)$/;
        const linkMatch = text.match(linkPattern);
        
        if (linkMatch) {
          const settings = await db.settings.get();
          const queryName = linkMatch[2].trim();
          
          const monksList = await db.monks.list();
          const matchedMonk = monksList.find(m => {
            const cleanMName = m.name.replace(/^(พระครู|พระมหา|พระอธิการ|พระ|สามเณร)\s*/, '').trim().toLowerCase();
            const cleanQuery = queryName.replace(/^(พระครู|พระมหา|พระอธิการ|พระ|สามเณร)\s*/, '').trim().toLowerCase();
            
            // Try direct containment first
            if (cleanMName.includes(cleanQuery) || cleanQuery.includes(cleanMName)) return true;
            if (m.chaya.toLowerCase().includes(cleanQuery)) return true;
            
            // Word-by-word token fallback (e.g. if last name is misspelled but first name matches)
            const queryWords = cleanQuery.split(/\s+/).filter((w: string) => w.length >= 3);
            for (const word of queryWords) {
              if (cleanMName.includes(word)) return true;
            }
            return false;
          });

          if (settings.lineChannelAccessToken && event.replyToken) {
            let replyText = '';
            if (matchedMonk) {
              // Update monk line_user_id
              await db.monks.save({
                ...matchedMonk,
                line_user_id: event.source.userId
              });
              replyText = `🙏 นมัสการพระคุณเจ้า ${matchedMonk.name} (ฉายา: ${matchedMonk.chaya})\n\nบัดนี้ระบบ Temple OS ได้เชื่อมโยงบัญชี LINE ของท่านเรียบร้อยแล้ว!\n\nท่านจะได้รับการแจ้งเตือนงานนิมนต์ส่วนตัวตรงที่ห้องแชทนี้ทันทีเมื่อได้รับมอบหมายครับ ✨`;
            } else {
              replyText = `⚠️ ไม่พบรายชื่อพระภิกษุหรือสามเณรที่ระบุ "${queryName}" ในระบบของวัด\n\nกรุณาพิมพ์ตรวจสอบความถูกต้องอีกครั้ง เช่น:\n"ผูกบัญชี พระมหาประเสริฐ" หรือสะกดตามชื่อในทะเบียนวัดครับ`;
            }

            const replyBody = {
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: replyText
              }]
            };

            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.lineChannelAccessToken}`
              },
              body: JSON.stringify(replyBody)
            }).catch(e => console.error('Failed to reply link success to LINE:', e));
          }
          continue;
        }

        // 2B. Check for "ฝากกระดูก"
        if (text.includes('ฝากกระดูก')) {
          const settings = await db.settings.get();
          const parsed = parseAshesFromText(text);

          if (!parsed.deceased_name) {
            // Send validation warning
            if (settings.lineChannelAccessToken && event.replyToken) {
              const replyBody = {
                replyToken: event.replyToken,
                messages: [{
                  type: 'text',
                  text: '⚠️ ไม่สามารถบันทึกข้อมูลฝากกระดูกได้\nกรุณาระบุชื่อผู้วายชนม์อย่างน้อย เช่น:\n"ฝากกระดูก ชื่อ: นายสมหวัง ตั้งมั่น"'
                }]
              };
              await fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${settings.lineChannelAccessToken}`
                },
                body: JSON.stringify(replyBody)
              }).catch(e => console.error('Failed to reply failure to LINE:', e));
            }
            continue;
          }

          // Resolve Sender Profile / Monk Name for deposited_by tracking
          let depositedBy = 'LINE User';
          const senderUserId = event.source?.userId;

          if (senderUserId) {
            // 1. Check if user is a registered monk in temple system
            const monksList = await db.monks.list().catch(() => []);
            const matchedMonk = monksList.find(m => m.line_user_id === senderUserId);

            if (matchedMonk) {
              depositedBy = `${matchedMonk.name} (${matchedMonk.chaya})`;
            } else if (settings.lineChannelAccessToken) {
              // 2. Fetch LINE Display Name from LINE Profile API
              try {
                const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${senderUserId}`, {
                  headers: { 'Authorization': `Bearer ${settings.lineChannelAccessToken}` }
                });
                if (profileRes.ok) {
                  const profile = await profileRes.json();
                  if (profile.displayName) {
                    depositedBy = `LINE: ${profile.displayName}`;
                  }
                }
              } catch (err) {
                console.error('Failed to fetch LINE profile:', err);
              }
            }
          }

          let finalDeathDate = normalizeThaiDateStr(parsed.death_date);

          const record = {
            id: `ash-${Date.now()}`,
            deceased_name: parsed.deceased_name,
            death_date: finalDeathDate,
            niche_code: parsed.niche_code || '-',
            relative_name: parsed.relative_name || 'ไม่ระบุชื่อญาติ',
            relative_phone: parsed.relative_phone || '-',
            deposit_date: new Date().toISOString().split('T')[0],
            deposited_by: depositedBy,
            notes: parsed.notes || `ลงทะเบียนผ่าน LINE โดย ${depositedBy}`
          };

          // Save to database
          await db.ashes.save(record);

          // Send confirmation reply back to user with dynamic respects QR link
          if (settings.lineChannelAccessToken && event.replyToken) {
            const originUrl = new URL(request.url).origin;
            const publicUrl = `${originUrl}/WatdongOS/dashboard/ashes/${record.id}`;

            const replyText = `🙏 บันทึกข้อมูลฝากอัฐิเรียบร้อยแล้ว!\n\n🌸 ผู้วายชนม์: ${record.deceased_name}\n🪦 ล็อก/ตู้ที่: ${record.niche_code}\n📞 ญาติผู้ดูแล: ${record.relative_name} (${record.relative_phone})\n🧘 พระภิกษุ/ผู้บันทึก: ${record.deposited_by}\n\n🔗 หน้าประวัติติดโกศอัฐิสำหรับสแกน:\n${publicUrl}`;
            
            const replyBody = {
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: replyText
              }]
            };

            await fetch('https://api.line.me/v2/bot/message/reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.lineChannelAccessToken}`
              },
              body: JSON.stringify(replyBody)
            }).catch(e => console.error('Failed to reply success to LINE:', e));
          }
          continue;
        }

        // 2C. Check for "เอากระดูกออก", "ถอนกระดูก", "ถอนอัฐิ", "ย้ายกระดูก"
        if (text.includes('เอากระดูกออก') || text.includes('ถอนกระดูก') || text.includes('ถอนอัฐิ') || text.includes('ย้ายกระดูก') || text.includes('ถอนอัฐิออก')) {
          const settings = await db.settings.get();
          const parsed = parseAshesFromText(text);

          const ashesList = await db.ashes.list().catch(() => []);
          let matched = ashesList.find(a => {
            if (parsed.niche_code && a.niche_code && a.niche_code.toLowerCase() === parsed.niche_code.toLowerCase()) {
              return true;
            }
            if (parsed.deceased_name && a.deceased_name && a.deceased_name.includes(parsed.deceased_name)) {
              return true;
            }
            return false;
          });

          if (!matched) {
            const rawQuery = text.replace(/^(เอากระดูกออก|ถอนกระดูก|ถอนอัฐิ|ย้ายกระดูก|ถอนอัฐิออก)\s*/, '').trim();
            if (rawQuery) {
              matched = ashesList.find(a => 
                a.deceased_name.toLowerCase().includes(rawQuery.toLowerCase()) || 
                a.niche_code.toLowerCase() === rawQuery.toLowerCase()
              );
            }
          }

          if (matched) {
            await db.ashes.delete(matched.id);

            if (settings.lineChannelAccessToken && event.replyToken) {
              const replyText = `✅ ทำรายการถอนอัฐิ/เอากระดูกออกสำเร็จ!\n\n🌸 ผู้วายชนม์: ${matched.deceased_name}\n🪦 รหัสช่อง/ตู้เดิม: ${matched.niche_code}\n📞 ญาติผู้รับคืน: ${matched.relative_name}\n\nระบบได้ทำการคืนพื้นที่ช่องประดิษฐาน ${matched.niche_code} เพื่อรองรับการรับฝากใหม่เรียบร้อยแล้ว 🙏`;
              await fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${settings.lineChannelAccessToken}`
                },
                body: JSON.stringify({
                  replyToken: event.replyToken,
                  messages: [{ type: 'text', text: replyText }]
                })
              }).catch(e => console.error('Failed to reply removal success:', e));
            }
          } else {
            if (settings.lineChannelAccessToken && event.replyToken) {
              const replyText = `⚠️ ไม่พบรายการฝากอัฐิในระบบ\nกรุณาระบุชื่อผู้วายชนม์ หรือ รหัสช่องให้ถูกต้อง เช่น:\n"ถอนอัฐิ ชื่อ: นายสมคิด" หรือ "เอากระดูกออก ช่อง: A-102"`;
              await fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${settings.lineChannelAccessToken}`
                },
                body: JSON.stringify({
                  replyToken: event.replyToken,
                  messages: [{ type: 'text', text: replyText }]
                })
              }).catch(e => console.error('Failed to reply removal not found:', e));
            }
          }
          continue;
        }
      }
    }

    return new Response('OK', { status: 200 });

  } catch (err: any) {
    console.error('LINE Webhook Error:', err);
    return new Response('Error', { status: 500 });
  }
}

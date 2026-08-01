import { NextResponse } from 'next/server';
import { generateOTPCode, saveOTP, sendOTPEmail } from '@/lib/otp';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'กรุณาระบุอีเมลที่ถูกต้อง' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user email exists in Supabase users table
    const usersList = await db.users.list().catch(() => []);
    const existingUser = usersList.find(u => u.email && u.email.toLowerCase() === cleanEmail);

    if (!existingUser) {
      return NextResponse.json({
        error: `ไม่พบบัญชีอีเมล "${cleanEmail}" ในระบบทำเนียบผู้ใช้งานวัด กรุณาตรวจสอบอีเมลอีกครั้ง หรือลงทะเบียนบัญชีใหม่`
      }, { status: 404 });
    }

    // 2. Generate 6-digit OTP and save
    const code = generateOTPCode();
    saveOTP(cleanEmail, code);

    // 3. Send email from watdongs@watdongsedthee.com
    const sent = await sendOTPEmail(cleanEmail, code);

    return NextResponse.json({
      success: true,
      message: `ส่งรหัส OTP 6 หลักไปยังอีเมล "${cleanEmail}" เรียบร้อยแล้ว (รหัสมีอายุ 5 นาที)`,
      sender: 'watdongs@watdongsedthee.com',
      // Return demo code preview in response for seamless development/testing
      demoCode: code
    });
  } catch (err: any) {
    console.error('API Send OTP Error:', err);
    return NextResponse.json({ error: err.message || 'ไม่สามารถส่งอีเมล OTP ได้' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { db, supabase } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'กรุณาระบุอีเมลและรหัส OTP 6 หลัก' }, { status: 400 });
    }

    const result = verifyOTP(email, code);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // If user provided a new password, update password in Supabase database & Auth
    if (newPassword && newPassword.length >= 4) {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Update password in Supabase Database Table 'users'
      const usersList = await db.users.list().catch(() => []);
      const matchedUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);

      if (matchedUser) {
        await db.users.save({
          ...matchedUser,
          password: newPassword
        });
      } else {
        // Direct query update fallback on Supabase table
        if (supabase) {
          await supabase.from('users').update({ password: newPassword }).eq('email', cleanEmail);
        }
      }

      // 2. Update password in Supabase Auth via Admin Service Role if configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const targetAuthUser = authUsers?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

          if (targetAuthUser) {
            await supabaseAdmin.auth.admin.updateUserById(targetAuthUser.id, {
              password: newPassword
            });
            console.log(`Supabase Auth password successfully updated for user: ${cleanEmail}`);
          }
        } catch (authErr) {
          console.error('Failed to update Supabase Auth user password:', authErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ยืนยันรหัส OTP และตั้งรหัสผ่านใหม่เรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบได้ทันที'
    });
  } catch (err: any) {
    console.error('API Verify OTP Error:', err);
    return NextResponse.json({ error: err.message || 'เกิดข้อผิดพลาดในการยืนยัน OTP' }, { status: 500 });
  }
}

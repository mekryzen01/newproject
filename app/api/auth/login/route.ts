import { NextResponse } from 'next/server';
import { db, supabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'กรุณาระบุอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // 1. If Supabase is configured, login using Supabase Auth
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        return NextResponse.json(
          { error: signInError.message },
          { status: 400 }
        );
      }

      if (data.session) {
        // Fetch the user's role and name from system_users table matching the email
        const userList = await db.users.list();
        const dbUser = userList.find(u => u.email.toLowerCase() === data.session.user.email?.toLowerCase());

        const sessionWithRole = {
          ...data.session,
          user: {
            ...data.session.user,
            role: dbUser?.role || 'staff',
            name: dbUser?.fullName || data.session.user.email
          }
        };

        return NextResponse.json({ session: sessionWithRole });
      }
    }

    return NextResponse.json(
      { error: 'ระบบความปลอดภัยและการยืนยันตัวตนยังไม่ได้ถูกเปิดใช้งานในระบบหลังบ้าน' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    );
  }
}

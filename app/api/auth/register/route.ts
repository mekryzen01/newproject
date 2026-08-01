import { NextResponse } from 'next/server';
import { db, supabase } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ-นามสกุล, อีเมล และรหัสผ่าน)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    // 1. Check if user already exists in db.users list
    const userList = await db.users.list();
    const existingUser = userList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานลงทะเบียนในระบบเรียบร้อยแล้ว' },
        { status: 400 }
      );
    }

    // 2. Insert directly into public.users. The database trigger (sync_system_users_trigger)
    //    will automatically create the corresponding account in auth.users and hash the password.
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const userId = crypto.randomUUID();

      const newDbUser = {
        id: userId,
        email: email.trim(),
        full_name: fullName.trim(),
        password: password, // Pass the plain text password so the trigger handles hashing
        role: 'member',
        is_deleted: false,
        created_at: new Date().toISOString()
      };

      // Save to users table via Supabase client
      const { error: insertError } = await supabase.from('users').insert(newDbUser);
      
      if (insertError) {
        console.error('Failed to create db user entry:', insertError);
        const isDuplicate = insertError.code === '23505' || String(insertError.message).toLowerCase().includes('duplicate');
        return NextResponse.json(
          { 
            error: isDuplicate 
              ? 'อีเมลนี้ถูกใช้งานลงทะเบียนในระบบเรียบร้อยแล้ว' 
              : 'ไม่สามารถสร้างทะเบียนโปรไฟล์ผู้ใช้งานในตารางฐานข้อมูลได้ กรุณาติดต่อแอดมินเพื่อตรวจสอบระบบ',
            details: `${insertError.code || ''}: ${insertError.message || JSON.stringify(insertError)}`
          },
          { status: isDuplicate ? 400 : 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'ลงทะเบียนผู้ใช้งานใหม่เรียบร้อยแล้ว',
        user: {
          id: userId,
          email: email,
          fullName: fullName,
          role: 'member'
        }
      });
    }

    // Local / Offline fallback (just in case Supabase credentials aren't loaded in env yet)
    const localId = `usr-${Date.now()}`;
    await db.users.save({
      id: localId,
      email: email,
      fullName: fullName,
      role: 'member',
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'ลงทะเบียนผู้ใช้งานใหม่สำเร็จ (โหมดออฟไลน์)',
      user: {
        id: localId,
        email: email,
        fullName: fullName,
        role: 'member'
      }
    });

  } catch (error: unknown) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้งาน' },
      { status: 500 }
    );
  }
}

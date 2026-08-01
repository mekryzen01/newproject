'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, User, Mail, Lock, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('member'); // default to member
  
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        return;
      }

      setSuccess('ลงทะเบียนบัญชีใหม่สำเร็จ! กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#fdfaf3] dark:bg-[#15120c] p-4 font-sans select-none overflow-hidden">
      {/* Background Graphic Ornaments */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

      {/* Register Box Wrapper */}
      <div className="relative w-full max-w-md bg-white/80 dark:bg-[#1f1a12]/80 backdrop-blur-xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl rounded-2xl p-8 overflow-hidden transition-all duration-300">
        
        {/* Gold Accent Top Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600" />

        {/* Header Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-4 animate-scale-up">
            <UserPlus className="size-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-200 font-heading text-center">
            ลงทะเบียนเข้าใช้งานระบบ
          </h2>
          <p className="text-xs text-amber-700/70 dark:text-amber-400/60 mt-1.5 tracking-wider uppercase font-semibold">
            Create new account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs text-center leading-relaxed font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-250 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-405 text-xs text-center leading-relaxed font-bold animate-pulse">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/80 block">
              ชื่อ-นามสกุล หรือ ฉายาพระสงฆ์
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/50 dark:text-amber-500/40">
                <User className="size-4" />
              </div>
              <input
                type="text"
                required
                placeholder="เช่น พระสมชาย อภิปุญฺโญ"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/80 block">
              อีเมลสำหรับเข้าใช้งาน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/50 dark:text-amber-500/40">
                <Mail className="size-4" />
              </div>
              <input
                type="email"
                required
                placeholder="example@temple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/80 block">
              รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/50 dark:text-amber-500/40">
                <Lock className="size-4" />
              </div>
              <input
                type="password"
                required
                placeholder="ระบุรหัสผ่านเข้าใช้งาน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Information banner about role approval */}
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-900/20 rounded-lg text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Shield className="size-3 text-amber-500" />
              หมายเหตุสิทธิ์เข้าใช้งาน:
            </p>
            <p>
              บัญชีที่ลงทะเบียนใหม่จะได้รับการกำหนดสิทธิ์เริ่มต้นเป็น <strong>สมาชิกทั่วไป (พระ-เณร / สิทธิ์จำกัด)</strong> และต้องรอให้ผู้ดูแลระบบ (Admin) หรือเจ้าอาวาสทำการอนุมัติและปรับเปลี่ยนสิทธิ์ให้ภายหลัง
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-300 mt-4 flex items-center justify-center gap-2 group border-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                กำลังบันทึกข้อมูลและส่งอีเมลยืนยัน...
              </>
            ) : (
              <>
                ลงทะเบียนบัญชีใหม่
              </>
            )}
          </Button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-5 text-center flex items-center justify-center gap-1.5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700/60 dark:text-amber-400/60 hover:text-amber-800 dark:hover:text-amber-300 hover:underline cursor-pointer"
          >
            <ArrowLeft className="size-3" />
            ย้อนกลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

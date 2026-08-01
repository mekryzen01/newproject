'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, User, Lock, Loader2, ArrowRight, Mail, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLoginController } from '@/app/Controllers/useLoginController';

export default function Login() {
    const {
        username,
        setUsername,
        password,
        setPassword,
        error,
        loading,
        handleLogin
    } = useLoginController();

    const [isTimeout, setIsTimeout] = React.useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false);
    const [otpStep, setOtpStep] = React.useState<1 | 2>(1);
    const [resetEmail, setResetEmail] = React.useState('');
    const [otpCode, setOtpCode] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [resetLoading, setResetLoading] = React.useState(false);
    const [resetSuccess, setResetSuccess] = React.useState('');
    const [resetError, setResetError] = React.useState('');
    const [otpCountdown, setOtpCountdown] = React.useState(300);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('reason') === 'timeout') {
                setIsTimeout(true);
            }
        }
    }, []);

    // OTP Countdown Timer
    React.useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (otpStep === 2 && otpCountdown > 0) {
            timerId = setInterval(() => {
                setOtpCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timerId);
    }, [otpStep, otpCountdown]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail.trim() || !resetEmail.includes('@')) {
            setResetError('กรุณาระบุอีเมลที่ถูกต้อง');
            return;
        }
        setResetLoading(true);
        setResetError('');
        setResetSuccess('');

        try {
            const res = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });

            const data = await res.json();
            if (!res.ok) {
                setResetError(data.error || 'ไม่สามารถส่ง OTP ได้');
                return;
            }

            setOtpStep(2);
            setOtpCountdown(300);
            if (data.demoCode) {
                setResetError(`[DEMO CODE: ${data.demoCode}] - ส่งรหัสไปยัง ${resetEmail} เรียบร้อยแล้ว`);
            }
        } catch (err: any) {
            setResetError('เกิดข้อผิดพลาดในการส่ง OTP');
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyOTPAndResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode.trim() || otpCode.length < 6) {
            setResetError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
            return;
        }
        if (!newPassword || newPassword.length < 4) {
            setResetError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
            return;
        }
        if (newPassword !== confirmPassword) {
            setResetError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }

        setResetLoading(true);
        setResetError('');

        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: resetEmail,
                    code: otpCode,
                    newPassword: newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setResetError(data.error || 'การยืนยัน OTP ล้มเหลว');
                return;
            }

            setResetSuccess('เปลี่ยนรหัสผ่านใหม่สำเร็จ! ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที');
            setPassword(newPassword);
        } catch (err: any) {
            setResetError('เกิดข้อผิดพลาดในการยืนยัน OTP');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#fdfaf3] dark:bg-[#15120c] p-4 font-sans select-none overflow-hidden">
            {/* Background Graphic Ornaments */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

            {/* Decorative Traditional Border */}
            <div className="relative w-full max-w-md bg-white/80 dark:bg-[#1f1a12]/80 backdrop-blur-xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl rounded-2xl p-8 overflow-hidden transition-all duration-300">

                {/* Gold Accent Top Ribbon */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-amber-300 via-amber-500 to-amber-600" />

                {/* Brand / Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-linear-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-4 animate-pulse">
                        <KeyRound className="size-8" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-200 font-heading text-center">
                        ระบบบริหารจัดการภายในวัด
                    </h2>
                    <p className="text-xs text-amber-700/70 dark:text-amber-400/60 mt-1.5 tracking-wider uppercase font-semibold">
                        Temple Management System (TMS)
                    </p>
                </div>

                {isTimeout && (
                    <div className="mb-4 p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs text-center leading-relaxed font-bold animate-fade-in shadow-sm">
                        ⚠️ หมดเวลาเชื่อมต่อ (Session Expired): เนื่องจากไม่มีการใช้งานเกิน 30 นาที ระบบจึงนำคุณออกจากระบบโดยอัตโนมัติเพื่อความปลอดภัย
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs text-center leading-relaxed">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Username Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/80 block">
                            ชื่อผู้ใช้งาน หรือ อีเมล
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/50 dark:text-amber-500/40">
                                <User className="size-4" />
                            </div>
                            <input
                                type="text"
                                required
                                placeholder="ระบุชื่อผู้ใช้ (จำลอง: admin, editor, staff)"
                                value={username}
                                onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-amber-900/80 dark:text-amber-300/80 block">
                                รหัสผ่าน
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsForgotModalOpen(true);
                                    setResetSuccess('');
                                    setResetError('');
                                    setResetEmail('');
                                }}
                                className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline cursor-pointer border-none bg-transparent"
                            >
                                ลืมรหัสผ่าน?
                            </button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-700/50 dark:text-amber-500/40">
                                <Lock className="size-4" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="ระบุรหัสผ่าน (จำลอง: admin123, editor123, staff123)"
                                value={password}
                                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 rounded-lg bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-300 mt-2 flex items-center justify-center gap-2 group border-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                กำลังตรวจสอบข้อมูล...
                            </>
                        ) : (
                            <>
                                เข้าสู่ระบบ
                                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-5 text-center">
                    <span className="text-xs text-amber-700/60 dark:text-amber-400/60">ยังไม่มีบัญชีเข้าใช้งาน? </span>
                    <Link
                        href="/register"
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline cursor-pointer"
                    >
                        ลงทะเบียนบัญชีใหม่
                    </Link>
                </div>

                <div className="mt-6 text-center text-[10px] text-amber-800/40 dark:text-amber-500/30">
                    ระบบรักษาความปลอดภัยข้อมูลวัดอิเล็กทรอนิกส์ &copy; 2026
                </div>
            </div>

            {/* Forgot Password & Email OTP Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1f1a12] border border-amber-200 dark:border-amber-950 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl animate-fade-in relative">
                        <div className="flex justify-between items-center border-b border-amber-100 dark:border-amber-950/40 pb-3">
                            <h3 className="font-extrabold text-base text-amber-950 dark:text-amber-200 font-heading flex items-center gap-2">
                                <KeyRound className="size-5 text-amber-600" />
                                กู้คืนรหัสผ่านด้วย Email OTP (from watdongs@watdongsedthee.com)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(false)}
                                className="p-1 rounded-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer border-none bg-transparent"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {resetSuccess ? (
                            <div className="space-y-4 py-2 text-xs text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                                    <CheckCircle2 className="size-8" />
                                </div>
                                <h4 className="text-base font-extrabold text-amber-950 dark:text-amber-100 font-heading">
                                    รีเซ็ตรหัสผ่านใหม่สำเร็จ!
                                </h4>
                                <p className="text-stone-600 dark:text-amber-300 leading-relaxed">
                                    {resetSuccess}
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (resetEmail) setUsername(resetEmail);
                                        setIsForgotModalOpen(false);
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer border-none shadow-md"
                                >
                                    ตกลง เข้าสู่ระบบด้วยรหัสผ่านใหม่
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-xs">
                                {resetError && (
                                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 text-red-700 dark:text-red-300 font-bold text-xs">
                                        ⚠️ {resetError}
                                    </div>
                                )}

                                {otpStep === 1 ? (
                                    /* STEP 1: Enter Email & Request OTP */
                                    <form onSubmit={handleSendOTP} className="space-y-4">
                                        <p className="text-amber-800/70 dark:text-amber-400/70 leading-relaxed">
                                            ป้อนอีเมลประจำบัญชีที่คุณใช้ลงทะเบียนเพื่อขอรับรหัส OTP 6 หลัก จากอีเมลโฮสต์ส่งตรงของวัด (<strong className="text-amber-900 dark:text-amber-200">watdongs@watdongsedthee.com</strong>)
                                        </p>

                                        <div className="space-y-1.5">
                                            <label className="font-bold text-amber-900 dark:text-amber-300 block">
                                                อีเมลประจำบัญชี (Login Email) *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/50">
                                                    <Mail className="size-4" />
                                                </div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    placeholder="example@temple.mail.go.th"
                                                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-amber-50/20 dark:bg-[#15110a] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 text-[11px] text-amber-850/80 dark:text-amber-400/80 space-y-1">
                                            <span className="font-bold block">📩 อีเมลผู้ส่งระบบหลัก:</span>
                                            <div className="font-mono font-bold text-amber-950 dark:text-amber-200">
                                                watdongs@watdongsedthee.com
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsForgotModalOpen(false)}
                                                className="flex-1 py-2.5 text-xs rounded-xl border-amber-200 hover:bg-amber-500/10 cursor-pointer"
                                            >
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="flex-1 py-2.5 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer border-none shadow-md flex items-center justify-center gap-1.5"
                                            >
                                                {resetLoading ? (
                                                    <>
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                        กำลังส่ง OTP...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>ขอรับรหัส OTP</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    /* STEP 2: Enter OTP & New Password */
                                    <form onSubmit={handleVerifyOTPAndResetPassword} className="space-y-4">
                                        <div className="p-3 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 text-amber-950 dark:text-amber-100 text-xs space-y-1">
                                            <div className="flex justify-between items-center font-bold">
                                                <span>ส่ง OTP ไปยัง: {resetEmail}</span>
                                                <span className="font-mono text-amber-700 dark:text-amber-400">
                                                    ⏱️ {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-amber-800/70 dark:text-amber-400/70">
                                                โปรดนำรหัสตัวเลข 6 หลักจากอีเมล watdongs@watdongsedthee.com มาป้อนด้านล่าง
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="font-bold text-amber-900 dark:text-amber-300 block">
                                                รหัส OTP 6 หลัก *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="123456"
                                                className="w-full text-center px-3 py-3 text-lg font-black tracking-widest rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-[#15110a] text-amber-950 dark:text-amber-100 outline-none font-mono focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div className="space-y-3 border-t border-amber-100 dark:border-amber-950/40 pt-3">
                                            <div>
                                                <label className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                                                    รหัสผ่านใหม่ (New Password) *
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="ป้อนรหัสผ่านใหม่..."
                                                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#15110a] text-amber-950 dark:text-amber-100 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                                                    ยืนยันรหัสผ่านใหม่ (Confirm Password) *
                                                </label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="ป้อนรหัสผ่านใหม่อีกครั้ง..."
                                                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#15110a] text-amber-950 dark:text-amber-100 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setOtpStep(1)}
                                                className="flex-1 py-2.5 text-xs rounded-xl border-amber-200 hover:bg-amber-500/10 cursor-pointer"
                                            >
                                                ‹ ย้อนกลับ
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="flex-1 py-2.5 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer border-none shadow-md flex items-center justify-center gap-1.5"
                                            >
                                                {resetLoading ? (
                                                    <>
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                        กำลังตรวจสอบ...
                                                    </>
                                                ) : (
                                                    'ยืนยัน OTP & ตั้งรหัสผ่าน'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
'use client';

import React from 'react';
import { KeyRound, User, Lock, Loader2, ArrowRight } from 'lucide-react';
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
                                onChange={(e) => setUsername(e.target.value)}
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
                                onChange={(e) => setPassword(e.target.value)}
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

                <div className="mt-8 text-center text-[10px] text-amber-800/40 dark:text-amber-500/30">
                    ระบรักษาความปลอดภัยข้อมูลวัดอิเล็กทรอนิกส์ &copy; 2026
                </div>
            </div>
        </div>
    );
}
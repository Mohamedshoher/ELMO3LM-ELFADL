"use client";

import { useState, useEffect } from 'react';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Lock, Users, ArrowLeft, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ParentLoginPage() {
    const { login, loading, error } = useLogin();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState<'phone' | 'password'>('phone');

    useEffect(() => {
        const savedPhone = localStorage.getItem('almoalem_student_phone');
        if (savedPhone) {
            setPhone(savedPhone);
            setStep('password');
        }
    }, []);

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length >= 7) setStep('password');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('almoalem_student_phone', phone);
        await login(`student-${phone}`, password);
    };

    return (
        <div className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617]">
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 blur-[150px] rounded-full" />
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full px-4 flex flex-col items-center">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30">
                            <Users size={36} className="text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">المعلم الفاضل</h1>
                        <p className="text-emerald-200/60 text-sm md:text-base font-bold">بوابة الطالب</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-2xl border border-white/10">
                        {step === 'phone' ? (
                            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-xl font-black text-white mb-1">تسجيل الدخول</h2>
                                    <p className="text-white/40 text-sm font-bold">أدخل رقم هاتفك للمتابعة</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 pr-2">رقم الهاتف</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            placeholder="أدخل رقم الهاتف بدون 02"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="w-full h-14 bg-white/10 border border-white/10 rounded-2xl px-12 text-center text-lg tracking-[0.1em] text-white placeholder-white/30 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                                            dir="ltr"
                                        />
                                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={phone.length < 7}
                                    className="w-full h-14 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-base font-black shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    متابعة
                                </Button>

                                <div className="text-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-xs font-bold transition-colors"
                                    >
                                        <ArrowLeft size={14} />
                                        دخول الإدارة
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-xl font-black text-white mb-1">أهلاً بك</h2>
                                    <p className="text-white/40 text-sm font-bold">أدخل كلمة المرور للدخول</p>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                            <Phone size={18} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-[10px] font-bold">رقم الهاتف</p>
                                            <p className="text-white font-bold text-sm tracking-wider" dir="ltr">{phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 pr-2">كلمة المرور (آخر 6 أرقام من هاتفك)</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            placeholder="••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            required
                                            maxLength={6}
                                            className="w-full h-14 bg-white/10 border border-white/10 rounded-2xl px-12 text-center text-2xl tracking-[0.4em] text-white placeholder-white/20 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                                            dir="ltr"
                                            autoFocus
                                        />
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl text-center border border-red-500/20 font-bold">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || password.length < 4}
                                    className="w-full h-14 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-base font-black shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    ) : (
                                        'دخول'
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="w-full text-center text-white/30 hover:text-white/60 text-xs font-bold transition-colors"
                                >
                                    تغيير رقم الهاتف
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-6">
                        <BookOpen size={14} className="text-white/20" />
                        <p className="text-white/20 text-xs">المعلم الفاضل © 2026</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

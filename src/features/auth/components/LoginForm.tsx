"use client";

import { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, GraduationCap, Presentation, Phone, Lock, Briefcase, UserCheck, UserCircle, ArrowRight, BookOpen } from 'lucide-react';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { cn } from '@/lib/utils';

type Portal = 'teacher' | 'student' | null;
type RoleTab = 'director' | 'supervisor' | 'teacher';

export default function LoginForm() {
    const { login, loading, error } = useLogin();
    const { data: teachers } = useTeachers();

    const [portal, setPortal] = useState<Portal>(null);
    const [roleTab, setRoleTab] = useState<RoleTab>('director');
    const [password, setPassword] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        const savedPortal = localStorage.getItem('almoalem_last_portal');
        if (savedPortal === 'teacher' || savedPortal === 'student') setPortal(savedPortal);
        const savedRoleTab = localStorage.getItem('almoalem_last_role_tab') as RoleTab | null;
        const savedTeacherId = localStorage.getItem('almoalem_last_teacher_id');
        const savedPhone = localStorage.getItem('almoalem_parent_phone');
        const savedPass = localStorage.getItem('almoalem_last_pass');

        if (savedRoleTab) setRoleTab(savedRoleTab);
        if (savedTeacherId) setSelectedTeacherId(savedTeacherId);
        if (savedPhone) setPhone(savedPhone);
        if (savedPass) setPassword(savedPass);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (portal) localStorage.setItem('almoalem_last_portal', portal);
        localStorage.setItem('almoalem_last_pass', password);

        if (portal === 'student') {
            const loginIdentifier = `parent-${phone}`;
            localStorage.setItem('almoalem_parent_phone', phone);
            await login(loginIdentifier, password);
        } else {
            localStorage.setItem('almoalem_last_role_tab', roleTab);
            let loginIdentifier: string = roleTab;
            if (roleTab === 'teacher' || roleTab === 'supervisor') {
                if (!selectedTeacherId) return;
                loginIdentifier = `${roleTab}-${selectedTeacherId}`;
                localStorage.setItem('almoalem_last_teacher_id', selectedTeacherId);
            }
            await login(loginIdentifier, password);
        }
    };

    const renderHeader = () => (
        <div className="text-center mb-8 md:mb-12">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-white/20 shadow-xl shadow-black/10">
                <BookOpen size={32} className="md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">المعلم الفاضل</h1>
            <p className="text-blue-200/60 text-base md:text-lg">للقرآن وعلومه</p>
        </div>
    );

    // شاشة اختيار البوابة (طالب / مدرس)
    if (!portal) {
        return (
            <div className="w-full max-w-[500px] flex flex-col items-center">
                {renderHeader()}
                <div className="w-full grid grid-cols-2 gap-4 md:gap-6">
                    <button
                        onClick={() => setPortal('student')}
                        className="group relative bg-white/5 backdrop-blur-sm rounded-[32px] p-6 md:p-8 text-center border border-white/10 hover:border-emerald-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                                <GraduationCap size={40} className="md:w-12 md:h-12 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-white">طالب</h2>
                                <p className="text-emerald-200/70 text-xs md:text-sm font-bold mt-1">متابعة الدروس والاختبارات</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold group-hover:gap-2 transition-all">
                                دخول
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setPortal('teacher')}
                        className="group relative bg-white/5 backdrop-blur-sm rounded-[32px] p-6 md:p-8 text-center border border-white/10 hover:border-blue-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-3">
                                <Presentation size={40} className="md:w-12 md:h-12 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-white">مدرس</h2>
                                <p className="text-blue-200/70 text-xs md:text-sm font-bold mt-1">إدارة الطلاب والمجموعات</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold group-hover:gap-2 transition-all">
                                دخول
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </button>
                </div>

                <p className="mt-8 text-blue-200/30 text-xs md:text-sm text-center font-bold">
                    © 2026 . جميع الحقوق محفوظة.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[450px] flex flex-col items-center animate-[fadeIn_0.4s_ease-out]">
            {renderHeader()}

            <div className="w-full bg-[#f8f9fa] rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <button
                    onClick={() => { setPortal(null); setPassword(''); }}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors mb-6"
                >
                    <ArrowRight size={16} />
                    {portal === 'student' ? 'اختيار بوابة أخرى' : 'اختيار بوابة أخرى'}
                </button>

                {portal === 'teacher' ? (
                    <div className="space-y-6">
                        {/* أيقونة المدرس */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Presentation size={28} className="md:w-8 md:h-8 text-white" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl md:text-2xl font-bold text-[#344767]">دخول الكادر التعليمي</h2>
                                <p className="text-[#7b809a] text-xs md:text-sm mt-1">المدير - المشرف - المدرس</p>
                            </div>
                        </div>

                        <div className="flex bg-[#f1f3f5] p-1 rounded-2xl justify-between shadow-inner">
                            {[
                                { id: 'director', label: 'المدير', icon: Briefcase },
                                { id: 'supervisor', label: 'المشرف', icon: UserCheck },
                                { id: 'teacher', label: 'المدرس', icon: GraduationCap }
                            ].map((role) => {
                                const Icon = role.icon;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setRoleTab(role.id as RoleTab)}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-1.5",
                                            roleTab === role.id
                                                ? "bg-white text-blue-600 shadow-sm scale-105"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <Icon size={16} />
                                        {role.label}
                                    </button>
                                );
                            })}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                            {(roleTab === 'teacher' || roleTab === 'supervisor') && (
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-[#344767] pr-2">
                                        {roleTab === 'teacher' ? 'اسم المدرس' : 'اسم المشرف'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedTeacherId}
                                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                                            className="w-full h-12 md:h-14 pr-12 pl-4 rounded-2xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none font-bold text-gray-700 text-sm md:text-base"
                                            required
                                        >
                                            <option value="">-- اختر الاسم من القائمة --</option>
                                            {teachers?.filter(t => t.status === 'active' && t.role === roleTab).sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar')).map(t => (
                                                <option key={t.id} value={t.id}>{t.fullName}</option>
                                            ))}
                                        </select>
                                        <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-[#344767] pr-2">كلمة المرور</label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 md:h-14 rounded-2xl bg-white border border-gray-100 shadow-sm text-center text-xl md:text-2xl tracking-[0.2em] focus:ring-2 focus:ring-blue-500/20 transition-all font-sans pr-12"
                                        dir="ltr"
                                    />
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center border border-red-100 font-bold animate-[fadeIn_0.3s_ease-out]">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 md:h-14 rounded-2xl bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-base md:text-lg font-bold shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin mx-auto" />
                                ) : (
                                    `دخول كـ${roleTab === 'director' ? 'مدير' : roleTab === 'supervisor' ? 'مشرف' : 'مدرس'}`
                                )}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6 md:space-y-8">
                        {/* أيقونة الطالب */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <GraduationCap size={28} className="md:w-8 md:h-8 text-white" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl md:text-2xl font-bold text-[#344767]">دخول الطالب</h2>
                                <p className="text-[#7b809a] text-xs md:text-sm mt-1">متابعة الدروس والاختبارات</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-[#344767] pr-2">رقم الهاتف</label>
                                <div className="relative">
                                    <Input
                                        type="tel"
                                        placeholder="رقم الهاتف بدون 02"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        className="h-12 md:h-14 rounded-2xl bg-white border border-gray-100 shadow-sm text-center text-lg md:text-xl tracking-[0.1em] focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans pr-12"
                                        dir="ltr"
                                    />
                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-[#344767] pr-2">كلمة المرور (6 أرقام)</label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="h-12 md:h-14 rounded-2xl bg-white border border-gray-100 shadow-sm text-center text-xl md:text-2xl tracking-[0.4em] focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans pr-12"
                                        dir="ltr"
                                    />
                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center border border-red-100 font-bold animate-[fadeIn_0.3s_ease-out]">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 md:h-14 rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-base md:text-lg font-bold shadow-xl shadow-emerald-100 transition-all active:scale-[0.98]"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin mx-auto" /> : 'دخول كطالب'}
                            </Button>
                        </form>
                    </div>
                )}
            </div>

            <p className="mt-6 text-blue-200/30 text-xs md:text-sm text-center font-bold">
                © 2026 . جميع الحقوق محفوظة.
            </p>
        </div>
    );
}
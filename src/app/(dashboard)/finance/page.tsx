"use client";

import { useState, useMemo, useEffect } from 'react';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Plus,
    Gift,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTransactionsByMonth } from '@/features/finance/services/financeService';
import { getFeesByMonth } from '@/features/students/services/recordsService';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import type { TransactionData } from '@/features/finance/components/AddTransactionModal';
import { useTeachers } from '@/features/teachers/hooks/useTeachers';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useAllTeachersAttendance } from '@/features/teachers/hooks/useTeacherAttendance';
import { teacherDeductionService } from '@/features/teachers/services/deductionService';

const AddTransactionModal = dynamic(() => import('@/features/finance/components/AddTransactionModal'), { ssr: false });

interface Transaction extends TransactionData {
    id: string;
    performedBy?: string;
    relatedUserId?: string;
}

export default function FinancePage() {
    const { user } = useAuthStore();
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const { data: teachers = [] } = useTeachers();
    const { data: students = [] } = useStudents();
    const { data: groups = [] } = useGroups();

    useEffect(() => {
        const now = new Date();
        setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        setIsClient(true);
    }, []);

    const months = useMemo(() => {
        const result = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            result.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
            });
        }
        return result;
    }, []);

    const { data: dbTransactions = [], isLoading } = useQuery({
        queryKey: ['transactions', selectedMonth],
        queryFn: async () => {
            if (!isClient) return [];
            const [year, month] = selectedMonth.split('-');
            return await getTransactionsByMonth(parseInt(year), parseInt(month));
        },
        enabled: isClient && !!selectedMonth
    });

    const { data: allFees = [] } = useQuery({
        queryKey: ['all-fees', selectedMonth],
        queryFn: async () => {
            if (!isClient) return [];
            const feesByKey = await getFeesByMonth(selectedMonth);
            const label = months.find(m => m.value === selectedMonth)?.label;
            const feesByLabel = label ? await getFeesByMonth(label) : [];
            const seen = new Set();
            return [...feesByKey, ...feesByLabel].filter(f => {
                if (seen.has(f.id)) return false;
                seen.add(f.id);
                return true;
            });
        },
        enabled: isClient && !!selectedMonth
    });

    const { data: exemptions = [] } = useQuery({
        queryKey: ['exemptions', selectedMonth],
        queryFn: async () => {
            const { data } = await supabase.from('free_exemptions').select('id, amount').eq('month', selectedMonth);
            return data || [];
        },
        enabled: isClient && !!selectedMonth
    });

    const { data: monthDeductions = [] } = useQuery({
        queryKey: ['all-deductions-finance', selectedMonth],
        queryFn: async () => teacherDeductionService.getAllDeductions(),
        enabled: isClient && !!selectedMonth
    });

    const allAttendanceResult = useAllTeachersAttendance(selectedMonth);
    const allAttendanceMap = (allAttendanceResult.data || {}) as Record<string, any>;

    const transactions: Transaction[] = useMemo(() => {
        return dbTransactions.map(tr => ({
            id: tr.id,
            type: tr.type as 'income' | 'expense',
            title: tr.description,
            category: tr.category as any,
            amount: tr.amount,
            date: tr.date,
            notes: '',
            performedBy: tr.performedBy,
            relatedUserId: tr.relatedUserId
        }));
    }, [dbTransactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tr => tr.date.substring(0, 7) === selectedMonth);
    }, [transactions, selectedMonth]);

    const {
        totalReceived,
        totalExpenses,
        balance,
        totalGlobalDeficit,
        totalGlobalExempted,
        totalGlobalDeductions,
        teacherFees,
        feesByManager,
        fromTeachers,
        otherIncome,
        paidCount,
        unpaidCount,
        totalRemaining,
    } = useMemo(() => {
        const incomeTransactions = filteredTransactions.filter(tr => tr.type === 'income');
        const expenseTransactions = filteredTransactions.filter(tr => tr.type === 'expense');

        const normalize = (s: string) => {
            if (!s) return '';
            return s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ءئؤ]/g, '').replace(/[ًٌٍَُِّ]/g, '').replace(/\s+/g, '').trim();
        };

        const collectionsByTeacher: Record<string, { amount: number; count: number }> = {};
        teachers.forEach(t => { if (t.status === 'active' || !t.status) collectionsByTeacher[t.id] = { amount: 0, count: 0 }; });

        allFees.forEach(fee => {
            const matched = teachers.find(t => fee.createdBy === t.fullName || fee.createdBy === t.phone || (fee.createdBy && normalize(fee.createdBy) === normalize(t.fullName)));
            if (matched) {
                if (!collectionsByTeacher[matched.id]) collectionsByTeacher[matched.id] = { amount: 0, count: 0 };
                collectionsByTeacher[matched.id].amount += Number(fee.amount?.toString().replace(/[^0-9.]/g, '')) || 0;
                collectionsByTeacher[matched.id].count += 1;
            }
        });

        const totalFeesByTeachers = Object.values(collectionsByTeacher).reduce((sum, c) => sum + c.amount, 0);
        const totalFeesByManagerDirect = allFees.filter(fee => {
            const isByTeacher = teachers.some(t => fee.createdBy === t.fullName || fee.createdBy === t.phone || (fee.createdBy && normalize(fee.createdBy) === normalize(t.fullName)));
            const isExplicitManager = fee.createdBy === user?.displayName || fee.createdBy === 'المدير' || fee.createdBy === 'admin';
            return isExplicitManager || (!isByTeacher && fee.createdBy && fee.createdBy !== 'غير معروف');
        }).reduce((sum, fee) => sum + (Number(fee.amount?.toString().replace(/[^0-9.]/g, '')) || 0), 0);

        const totalFromTeachers = incomeTransactions.filter(tr => tr.category === 'تحصيل من مدرس').reduce((sum, tr) => sum + tr.amount, 0);
        const totalOtherIncome = incomeTransactions.filter(tr => tr.category === 'donation' || tr.category === 'other').reduce((sum, tr) => sum + tr.amount, 0);
        const totalInc = totalFeesByManagerDirect + totalFromTeachers + totalOtherIncome;
        const totalExp = expenseTransactions.reduce((sum, tr) => sum + tr.amount, 0);

        const exemptedIds = new Set(exemptions.map((e: any) => e.student_id));
        const totalDeficit = Object.entries(collectionsByTeacher).reduce((sum, [id, data]) => {
            const tGroups = groups.filter(g => g.teacherId === id).map(g => g.id);
            const tStudents = students.filter(s => s.groupId && tGroups.includes(s.groupId) && s.status !== 'archived' && (!s.enrollmentDate || s.enrollmentDate.substring(0, 7) <= selectedMonth));
            return sum + tStudents.reduce((acc, s) => {
                const paid = allFees.filter((f: any) => f.studentId === s.id).reduce((a, f) => a + (Number(f.amount?.toString().replace(/[^0-9.]/g, '')) || 0), 0);
                const amt = Number(s.monthlyAmount) || 0;
                return acc + (amt > paid && !exemptedIds.has(s.id) ? amt - paid : 0);
            }, 0);
        }, 0);

        const totalExempted = exemptions.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

        const filteredDeductions = monthDeductions.filter(d => {
            const dm = `${new Date(d.appliedDate).getFullYear()}-${String(new Date(d.appliedDate).getMonth() + 1).padStart(2, '0')}`;
            return dm === selectedMonth && d.status === 'applied' && !d.reason.startsWith('مكافأة:');
        });

        const totalDeductions = teachers.reduce((sum, t) => {
            const manual = filteredDeductions.filter(d => d.teacherId === t.id).reduce((a, d) => a + d.amount, 0);
            const att = allAttendanceMap[t.id] || {};
            const absence = Object.values(att).reduce((acc: number, stat: any) => { if (stat === 'absent') return acc + 1; if (stat === 'half') return acc + 0.5; if (stat === 'quarter') return acc + 0.25; return acc; }, 0);
            const daily = t.accountingType === 'partnership' ? ((Number(t.partnershipPercentage) || 0) / 22) : ((Number(t.salary) || 1000) / 22);
            return sum + Math.round((manual + absence) * daily);
        }, 0);

        const salaryPaymentsThisMonth = filteredTransactions.filter(tr => tr.type === 'expense' && tr.category === 'salary');
        const paidSet = new Set(salaryPaymentsThisMonth.map(p => p.relatedUserId).filter(Boolean));
        const activeTeachers = teachers.filter(t => t.status !== 'inactive');
        const paidCount = activeTeachers.filter(t => paidSet.has(t.id)).length;
        const unpaidCount = activeTeachers.length - paidCount;
        const totalPaid = salaryPaymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);
        const totalEntitlement = activeTeachers.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);
        const totalRemaining = Math.max(0, totalEntitlement - totalDeductions - totalPaid);

        return {
            totalReceived: totalInc,
            totalExpenses: totalExp,
            balance: totalInc - totalExp,
            totalGlobalDeficit: totalDeficit,
            totalGlobalExempted: totalExempted,
            totalGlobalDeductions: totalDeductions,
            teacherFees: totalFeesByTeachers,
            feesByManager: totalFeesByManagerDirect,
            fromTeachers: totalFromTeachers,
            otherIncome: totalOtherIncome,
            paidCount,
            unpaidCount,
            totalRemaining,
        };
    }, [filteredTransactions, teachers, students, groups, allFees, user?.displayName, exemptions, selectedMonth, monthDeductions, allAttendanceMap]);

    const handleAddTransaction = () => {
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['transactions', selectedMonth] });
    };

    if (!isClient) return null;

    return (
        <div className="pb-32 transition-all duration-500 bg-gray-50/50 min-h-screen font-sans">
            <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddTransaction} />

            {/* Sticky Header */}
            <div className="sticky top-0 z-[70] bg-gray-50/95 backdrop-blur-xl px-4 py-4 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 relative">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-11 h-11 bg-blue-600 text-white rounded-[16px] flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={22} />
                        </button>
                    </div>

                    {isClient && (
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                            <button
                                onClick={() => { const i = months.findIndex(m => m.value === selectedMonth); if (i < months.length - 1) setSelectedMonth(months[i + 1].value); }}
                                disabled={months.findIndex(m => m.value === selectedMonth) === months.length - 1}
                                className="w-10 h-10 bg-white border border-blue-100 rounded-[16px] flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-95 transition-all shadow-md shadow-blue-500/5 disabled:opacity-50 disabled:hover:bg-white"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                                    className="h-12 px-6 bg-white border border-blue-100 rounded-[18px] flex items-center gap-3 text-blue-700 font-black shadow-md shadow-blue-500/5 hover:border-blue-300"
                                >
                                    <Calendar size={20} className="text-blue-600" />
                                    <span className="text-sm whitespace-nowrap">{months.find(m => m.value === selectedMonth)?.label}</span>
                                    <ChevronDown size={16} className={cn("transition-transform duration-300", showMonthPicker && "rotate-180")} />
                                </button>
                                {showMonthPicker && (
                                    <div className="absolute top-[120%] left-1/2 -translate-x-1/2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                                        {months.map(month => (
                                            <button key={month.value}
                                                onClick={() => { setSelectedMonth(month.value); setShowMonthPicker(false); }}
                                                className={cn("w-full px-4 py-2.5 text-right text-xs font-bold transition-all flex items-center justify-between",
                                                    selectedMonth === month.value ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50")}>
                                                {month.label}
                                                {selectedMonth === month.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { const i = months.findIndex(m => m.value === selectedMonth); if (i > 0) setSelectedMonth(months[i - 1].value); }}
                                disabled={months.findIndex(m => m.value === selectedMonth) === 0}
                                className="w-10 h-10 bg-white border border-blue-100 rounded-[16px] flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-95 transition-all shadow-md shadow-blue-500/5 disabled:opacity-50 disabled:hover:bg-white"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                            <h1 className="text-sm font-black text-gray-900 leading-tight">المالية والمصروفات</h1>
                            <p className="text-[10px] font-bold text-gray-400">مركز الشاطبي</p>
                        </div>
                        <div className="w-11 h-11 bg-white border border-gray-100 rounded-[16px] flex items-center justify-center text-blue-600 shadow-sm">
                            <Wallet size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-gray-400 font-bold font-sans">جاري التحميل...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                        {/* Teacher Collections */}
                        <Link href="/finance/teachers" className="bg-white/90 backdrop-blur-xl border border-purple-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm border border-purple-100/30">
                                <ArrowUpCircle size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">محصل المدرسين</p>
                                <h3 className="text-2xl font-black text-purple-600 font-sans tracking-tight">
                                    {teacherFees.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Manager Direct */}
                        <Link href="/finance/income" className="bg-white/90 backdrop-blur-xl border border-blue-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100/30">
                                <Wallet size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">ما حصله المدير مباشر</p>
                                <h3 className="text-2xl font-black text-blue-600 font-sans tracking-tight">
                                    {feesByManager.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* From Teachers */}
                        <Link href="/finance/income" className="bg-white/90 backdrop-blur-xl border border-sky-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-sm border border-sky-100/30">
                                <Wallet size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">ما استلمه المدير من المدرسين</p>
                                <h3 className="text-2xl font-black text-sky-600 font-sans tracking-tight">
                                    {fromTeachers.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Other Income */}
                        <Link href="/finance/income" className="bg-white/90 backdrop-blur-xl border border-cyan-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center shadow-sm border border-cyan-100/30">
                                <ArrowUpCircle size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">إيرادات أخرى</p>
                                <h3 className="text-2xl font-black text-cyan-600 font-sans tracking-tight">
                                    {otherIncome.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Deficit */}
                        <Link href="/finance/teachers" className="bg-white/90 backdrop-blur-xl border border-amber-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm border border-amber-100/30">
                                <AlertCircle size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">إجمالي العجز</p>
                                <h3 className="text-2xl font-black text-amber-600 font-sans tracking-tight">
                                    {totalGlobalDeficit.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Exempted */}
                        <Link href="/finance/teachers" className="bg-white/90 backdrop-blur-xl border border-teal-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shadow-sm border border-teal-100/30">
                                <Gift size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">إجمالي المعفي عنه</p>
                                <h3 className="text-2xl font-black text-teal-600 font-sans tracking-tight">
                                    {totalGlobalExempted.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Deductions */}
                        <Link href="/finance/teachers" className="bg-white/90 backdrop-blur-xl border border-red-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm border border-red-100/30">
                                <AlertCircle size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">إجمالي الخصومات</p>
                                <h3 className="text-2xl font-black text-red-600 font-sans tracking-tight">
                                    {totalGlobalDeductions.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Salary Status */}
                        <Link href="/finance/expenses" className="bg-white/90 backdrop-blur-xl border border-emerald-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100/30">
                                <Wallet size={24} />
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[11px] font-black text-gray-400 mb-1">حالة الرواتب</p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✅ {paidCount}</span>
                                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⏳ {unpaidCount}</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400">المتبقي: <span className="font-black text-amber-600 font-sans">{totalRemaining.toLocaleString()} ج.م</span></p>
                            </div>
                        </Link>

                        {/* Total Received */}
                        <Link href="/finance/income" className="bg-white/90 backdrop-blur-xl border border-green-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm border border-green-100/30">
                                <ArrowUpCircle size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">إجمالي الإيرادات</p>
                                <h3 className="text-2xl font-black text-green-600 font-sans tracking-tight">
                                    {totalReceived.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Expenses */}
                        <Link href="/finance/expenses" className="bg-white/90 backdrop-blur-xl border border-red-100/50 rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm border border-red-100/30">
                                <ArrowDownCircle size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black text-gray-400 mb-1">إجمالي المصروفات</p>
                                <h3 className="text-2xl font-black text-red-600 font-sans tracking-tight">
                                    {totalExpenses.toLocaleString()} <span className="text-xs">ج.م</span>
                                </h3>
                            </div>
                        </Link>

                        {/* Balance */}
                        <div className={cn(
                            "backdrop-blur-xl border rounded-[32px] p-6 flex flex-col justify-between min-h-[160px] shadow-sm transition-all md:col-span-2",
                            balance >= 0 ? "bg-green-700 text-white border-green-400/30 shadow-green-600/20" : "bg-red-700 text-white border-red-400/30 shadow-red-600/20"
                        )}>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-sm border border-white/30 text-white">
                                <Wallet size={24} />
                            </div>
                            <div className="text-right flex items-end justify-between w-full mt-4">
                                <div />
                                <div>
                                    <p className="text-sm font-bold text-white/80 mb-1">{balance >= 0 ? 'صافي الربح النهائي' : 'صافي الخسارة'}</p>
                                    <h3 className="text-4xl md:text-5xl font-black font-sans tracking-tight drop-shadow-md">
                                        {balance >= 0 ? '+' : ''}{balance.toLocaleString()} <span className="text-lg md:text-xl text-white/80 font-bold">ج.م</span>
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

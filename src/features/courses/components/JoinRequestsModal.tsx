"use client";

import { useState } from 'react';
import { X, Check, GraduationCap, User, BookOpen, Loader2, Users } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGroups } from '@/features/groups/services/groupService';
import { cn } from '@/lib/utils';
import { FadeIn, SlideIn } from '@/components/ui/transition';
import { Button } from '@/components/ui/button';

interface JoinRequest {
    id: string;
    studentId: string;
    studentName: string;
    studentPhone: string;
    studentGroupId: string | null;
    courseId: string;
    courseName: string;
    courseLectures: number;
    status: string;
    createdAt: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function JoinRequestsModal({ isOpen, onClose }: Props) {
    const queryClient = useQueryClient();
    const { data: groups } = useQuery({
        queryKey: ['groups'],
        queryFn: () => getGroups(),
    });
    const [approving, setApproving] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<string | null>(null);
    const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['join-requests'],
        queryFn: async () => {
            const res = await fetch('/api/join-requests');
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
        refetchInterval: 5000,
    });

    const pendingRequests = requests.filter((r: JoinRequest) => r.status === 'pending');

    const handleApprove = async (req: JoinRequest) => {
        const groupId = groupSelections[req.id] || '';
        setApproving(req.id);
        try {
            const res = await fetch('/api/join-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: req.id, status: 'approved', groupId, approvedBy: 'director' }),
            });
            if (!res.ok) throw new Error('فشل الموافقة');
            queryClient.invalidateQueries({ queryKey: ['join-requests'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء الموافقة على الطلب');
        }
        setApproving(null);
    };

    const handleReject = async (id: string) => {
        setRejecting(id);
        try {
            const res = await fetch('/api/join-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected' }),
            });
            if (!res.ok) throw new Error('فشل الرفض');
            queryClient.invalidateQueries({ queryKey: ['join-requests'] });
        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء رفض الطلب');
        }
        setRejecting(null);
    };

    const getCourseGroups = (courseId: string) => {
        return groups?.filter((g: any) => g.courseId === courseId) || [];
    };

    return (
        <>
            <FadeIn show={isOpen} className="fixed inset-0 z-[100]">
                <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </FadeIn>
            <SlideIn show={isOpen} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[80vh] overflow-hidden relative z-10 shadow-2xl flex flex-col">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <h2 className="text-2xl font-black text-gray-900 border-r-4 border-emerald-500 pr-4 flex items-center gap-3">
                            <GraduationCap size={24} className="text-emerald-500" />
                            طلبات الانضمام
                        </h2>
                        <button onClick={onClose} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-400 font-bold flex items-center justify-center gap-2">
                                <Loader2 size={20} className="animate-spin" />
                                جاري التحميل...
                            </div>
                        ) : pendingRequests.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <GraduationCap size={36} className="text-emerald-300" />
                                </div>
                                <h3 className="text-lg font-black text-gray-400 mb-1">لا توجد طلبات معلقة</h3>
                                <p className="text-sm text-gray-300 font-bold">جميع طلبات الانضمام تمت معالجتها</p>
                            </div>
                        ) : (
                            pendingRequests.map((req: JoinRequest) => {
                                const courseGroups = getCourseGroups(req.courseId);
                                const selectedGroupId = groupSelections[req.id] || '';

                                return (
                                    <div key={req.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                                                    <User size={22} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-900 text-lg">{req.studentName}</h3>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                                            <BookOpen size={10} />
                                                            {req.courseName}
                                                        </span>
                                                        {req.studentGroupId && (
                                                            <span className="text-[10px] text-gray-400 font-bold">
                                                                {groups?.find((g: any) => g.id === req.studentGroupId)?.name || 'في مجموعة'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold">
                                                {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>

                                        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-gray-400" />
                                                <span className="text-xs font-bold text-gray-600">اختر المجموعة:</span>
                                            </div>
                                            <select
                                                value={selectedGroupId}
                                                onChange={(e) => setGroupSelections(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                className="w-full h-11 rounded-2xl bg-gray-50 border border-gray-100 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                                            >
                                                <option value="">-- اختر مجموعة --</option>
                                                {courseGroups.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                                {courseGroups.length === 0 && (
                                                    <option value="" disabled>لا توجد مجموعات لهذه الدورة</option>
                                                )}
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4">
                                            <Button
                                                onClick={() => selectedGroupId ? handleApprove(req) : alert('يرجى اختيار مجموعة أولاً')}
                                                disabled={approving === req.id}
                                                className={cn(
                                                    "flex-1 h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                                                    selectedGroupId
                                                        ? "bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                )}
                                            >
                                                {approving === req.id ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <><Check size={18} /> قبول</>
                                                )}
                                            </Button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                disabled={rejecting === req.id}
                                                className="h-12 px-6 bg-red-50 text-red-600 rounded-2xl font-black text-xs border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {rejecting === req.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : 'رفض'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </SlideIn>
        </>
    );
}

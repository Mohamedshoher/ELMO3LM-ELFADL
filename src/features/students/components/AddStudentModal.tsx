"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addStudent } from '../services/studentService';
import { Loader2 } from 'lucide-react';
import { Student, Group } from '@/types';
import { getGroups } from '@/features/groups/services/groupService';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultGroupId?: string;
}

export default function AddStudentModal({ isOpen, onClose, defaultGroupId }: AddStudentModalProps) {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'teacher';

    const [isFree, setIsFree] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        parentPhone: '',
        isOrphan: false,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: (isTeacher ? 'pending' : 'active') as 'active' | 'archived' | 'pending',
        groupId: defaultGroupId || '',
        groupIds: defaultGroupId ? [defaultGroupId] : [] as string[],
        monthlyAmount: 0,
    });

    const { data: groups } = useQuery({
        queryKey: ['groups'],
        queryFn: () => getGroups()
    });

    const myGroups = (groups?.filter((g: Group) => {
        if (user?.role === 'teacher') return g.teacherId === user.teacherId;
        return true;
    }) || []).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    const hasCourseGroup = myGroups.some((g: Group) => formData.groupIds.includes(g.id) && g.courseId);

    const mutation = useMutation({
        mutationFn: (newStudent: Omit<Student, 'id'>) => addStudent(newStudent),
        onMutate: async (newStudent) => {
            await queryClient.cancelQueries({ queryKey: ['students'] });
            const previousStudents = queryClient.getQueryData(['students']);
            queryClient.setQueryData(['students'], (old: any) => [...(old || []), { ...newStudent, id: 'temp-' + Date.now() }]);

            if (isTeacher) {
                alert('تم إرسال بيانات الطالب، وفي انتظار مراجعة وقبول الإدارة.');
            }
            onClose();
            // Reset form
            setIsFree(false);
            setFormData({
                fullName: '',
                parentPhone: '',
                isOrphan: false,
                enrollmentDate: new Date().toISOString().split('T')[0],
                status: isTeacher ? 'pending' : 'active',
                groupId: defaultGroupId || '',
                groupIds: defaultGroupId ? [defaultGroupId] : [],
                monthlyAmount: 0,
            });

            return { previousStudents };
        },
        onError: (err, newStudent, context: any) => {
            queryClient.setQueryData(['students'], context?.previousStudents);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    useEffect(() => {
        if (isOpen && defaultGroupId) {
            setFormData(prev => ({ ...prev, groupId: defaultGroupId, groupIds: [defaultGroupId] }));
        }
    }, [isOpen, defaultGroupId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: any = { ...formData };
        if (hasCourseGroup) {
            data.courseRegisteredAt = new Date().toISOString();
        }
        mutation.mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إضافة طالب جديد" className="max-w-4xl h-[95vh] md:h-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="الاسم الرباعي"
                        placeholder="أدخل اسم الطالب بالكامل"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                    <Input
                        label="رقم هاتف الطالب"
                        type="tel"
                        placeholder="0123456789"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        required
                        dir="ltr"
                    />
                    <div className="flex items-center justify-between bg-orange-50/50 border border-orange-100 p-4 rounded-xl h-12">
                        <label className="text-sm font-bold text-gray-700">هل الطالب يتيم؟</label>
                        <input
                            type="checkbox"
                            checked={formData.isOrphan}
                            onChange={(e) => setFormData({ ...formData, isOrphan: e.target.checked })}
                            className="w-5 h-5 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                    </div>
                    <Input
                        label="تاريخ الالتحاق"
                        type="date"
                        value={formData.enrollmentDate}
                        onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                        required
                        dir="rtl"
                    />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 mr-1">المبلغ الشهري</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFree(!isFree);
                                    if (!isFree) {
                                        setFormData({ ...formData, monthlyAmount: 0 });
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border ${
                                    isFree
                                        ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200'
                                        : 'bg-white text-green-600 border-green-400 hover:bg-green-50'
                                }`}
                            >
                                <span>{isFree ? '✓' : '🎁'}</span>
                                <span>مجانًا</span>
                            </button>
                        </div>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={isFree ? '0' : (formData.monthlyAmount || '')}
                            onChange={(e) => !isFree && setFormData({ ...formData, monthlyAmount: Number(e.target.value) })}
                            disabled={isFree}
                            required={!isFree}
                            dir="ltr"
                            className={`w-full h-12 border rounded-xl px-4 text-left font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-sm transition-all duration-200 ${
                                isFree
                                    ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                                    : 'bg-white border-gray-100 text-gray-700'
                            }`}
                        />
                        {isFree && (
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <span>✓</span> هذا الطالب مسجل بدون رسوم
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 mr-1">المجموعات</label>
                        <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1">
                            {myGroups.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-2">لا توجد مجموعات متاحة</p>
                            )}
                            {myGroups.map((group: Group) => {
                                const isSelected = formData.groupIds.includes(group.id);
                                return (
                                    <label
                                        key={group.id}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                            isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                const newGroupIds = e.target.checked
                                                    ? [...formData.groupIds, group.id]
                                                    : formData.groupIds.filter(id => id !== group.id);
                                                setFormData({
                                                    ...formData,
                                                    groupIds: newGroupIds,
                                                    groupId: newGroupIds.length > 0 ? newGroupIds[0] : '',
                                                });
                                            }}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{group.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    {isTeacher && (
                        <div className="col-span-full bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                                <span className="text-xl font-bold">!</span>
                            </div>
                            <p className="text-sm font-bold text-blue-700">
                                تنبيه: سيتم تسجيل الطالب كطلب جديد، ولن يظهر في مجموعتك إلا بعد مراجعة وقبول الإدارة أو المشرف.
                            </p>
                        </div>
                    )}


                </div>
                <div className="flex items-center gap-3 pt-4 justify-start">
                    <Button type="submit" disabled={mutation.isPending} className="px-8">
                        {mutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الحفظ...</span>
                            </div>
                        ) : "حفظ الطالب"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

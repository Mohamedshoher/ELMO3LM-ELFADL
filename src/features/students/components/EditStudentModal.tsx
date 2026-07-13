"use client"; // توجيه لاستخدام المكون في جانب العميل (Client Component)

// استيراد المكتبات والخطافات (Hooks) اللازمة
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal'; // مكون النافذة المنبثقة العام
import { Input } from '@/components/ui/input'; // مكون حقل الإدخال
import { Button } from '@/components/ui/button'; // مكون الزر
import { updateStudent } from '../services/studentService'; // خدمة تحديث بيانات الطالب في قاعدة البيانات
import { Loader2 } from 'lucide-react'; // أيقونة التحميل
import { Student, Group } from '@/types'; // استيراد نوع بيانات الطالب
import { getGroups } from '@/features/groups/services/groupService';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'; // مكتبة إدارة حالات البيانات (TanStack Query)

// تعريف أنواع الخصائص (Props) التي يستقبلها المكون
interface EditStudentModalProps {
    student: Student | null; // بيانات الطالب الحالي المراد تعديله
    isOpen: boolean; // حالة فتح النافذة
    onClose: () => void; // دالة لإغلاق النافذة
}

export default function EditStudentModal({ student, isOpen, onClose }: EditStudentModalProps) {
    const queryClient = useQueryClient(); // الوصول إلى عميل الاستعلامات لتحديث البيانات بعد التعديل

    // حالة بيانات النموذج (Form State)
    const [isFree, setIsFree] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        parentPhone: '',
        isOrphan: false,
        enrollmentDate: '',
        status: 'active' as Student['status'],
        groupId: '',
        groupIds: [] as string[],
        monthlyAmount: 0,
        appointment: '',
    });

    const { data: groups } = useQuery({
        queryKey: ['groups'],
        queryFn: () => getGroups()
    });

    // مراقبة التغيير في الطالب المختار لتعبئة النموذج ببياناته تلقائياً عند الفتح
    useEffect(() => {
        if (student) {
            const amount = student.monthlyAmount ?? 0;
            setIsFree(amount === 0);
            const studentGroupIds = student.groupIds?.length ? student.groupIds : (student.groupId ? [student.groupId] : []);
            setFormData({
                fullName: student.fullName || '',
                parentPhone: student.parentPhone || '',
                isOrphan: student.isOrphan || false,
                enrollmentDate: student.enrollmentDate || '',
                status: student.status || 'active',
                groupId: student.groupId || (studentGroupIds[0] ?? ''),
                groupIds: studentGroupIds,
                monthlyAmount: amount,
                appointment: student.appointment || '',
            });
        }
    }, [student]);

    // إعداد عملية التعديل باستخدام useMutation
    const mutation = useMutation({
        mutationFn: (updatedData: Partial<Student>) => {
            if (!student?.id) throw new Error('Student ID is missing');
            return updateStudent(student.id, updatedData); // استدعاء خدمة التعديل
        },
        onSuccess: () => {
            // عند النجاح: تحديث الكاش لإظهار البيانات الجديدة في القائمة فوراً
            queryClient.invalidateQueries({ queryKey: ['students'] });
            onClose(); // إغلاق النافذة
        },
    });

    // دالة معالجة إرسال النموذج
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData as any); // تنفيذ عملية التعديل
    };

    // في حال عدم وجود طالب مختار، لا يتم عرض أي شيء
    if (!student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تعديل بيانات الطالب" className="max-w-4xl h-[95vh] md:h-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* شبكة حقول الإدخال (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* حقل الاسم الكامل */}
                    <Input
                        label="الاسم الرباعي"
                        placeholder="أدخل اسم الطالب بالكامل"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />
                    {/* حقل رقم الهاتف */}
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
                    {/* حقل تاريخ الالتحاق */}
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
                                    const next = !isFree;
                                    setIsFree(next);
                                    if (next) setFormData({ ...formData, monthlyAmount: 0 });
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
                            {(!groups || groups.length === 0) && (
                                <p className="text-sm text-gray-400 text-center py-2">لا توجد مجموعات متاحة</p>
                            )}
                            {[...(groups || [])].sort((a, b) => a.name.localeCompare(b.name, 'ar')).map((group: Group) => {
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
                    <Input
                        label="موعد الحضور"
                        placeholder="مثال: السبت والأربعاء الساعة ٤ عصراً"
                        value={(formData as any).appointment || ''}
                        onChange={(e) => setFormData({ ...formData, appointment: e.target.value } as any)}
                    />
                </div>

                {/* أزرار التحكم في أسفل النموذج */}
                <div className="flex items-center gap-3 pt-4 justify-start">
                    {/* زر حفظ التعديلات مع حالة التحميل */}
                    <Button type="submit" disabled={mutation.isPending} className="px-8 bg-blue-600 hover:bg-blue-700">
                        {mutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الحفظ...</span>
                            </div>
                        ) : "حفظ التعديلات"}
                    </Button>
                    {/* زر الإلغاء */}
                    <Button type="button" variant="secondary" onClick={onClose}>
                        إلغاء
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
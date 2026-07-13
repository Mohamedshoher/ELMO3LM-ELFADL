import { X, Archive, RotateCcw, Edit3, MessageCircle, Phone } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useStudents } from '../hooks/useStudents';
import { useGroups } from '../../../features/groups/hooks/useGroups';
import { cn, getWhatsAppUrl } from '../../../lib/utils';

export default function ModalHeader({ student, onClose, onEdit }: any) {
    const { user } = useAuthStore();
    const { data: groups = [] } = useGroups();
    const { archiveStudent, restoreStudent } = useStudents();
    
    const isArchived = student?.status === 'archived';
    const canManage = user?.role !== 'teacher'; // المعلم لا يملك صلاحية الأرشفة أو التعديل

    // وظيفة التواصل عبر واتساب
    const handleWhatsApp = () => {
        if (student?.parentPhone) {
            window.open(getWhatsAppUrl(student.parentPhone), '_blank');
        }
    };

    // وظيفة الاتصال الهاتفي
    const handleCall = () => {
        if (student?.parentPhone) window.location.href = `tel:${student.parentPhone}`;
    };

    // وظيفة تبديل حالة الأرشفة
    const handleArchiveToggle = () => {
        if (isArchived) {
            if (confirm(`استعادة ${student.fullName}؟`)) restoreStudent(student.id, student.groupId || null);
        } else {
            if (confirm(`أرشفة ${student.fullName}؟`)) archiveStudent(student.id);
        }
        onClose(); // إغلاق المودال بعد الأرشفة
    };

    return (
        <div className="p-4 sm:p-5 border-b border-gray-50">
            <div className="text-right flex items-center justify-between gap-2 sm:gap-3">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate flex-1 min-w-0">
                    {student.fullName}
                </h2>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {canManage && (
                        <>
                            <button onClick={handleCall} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors" title="اتصال">
                                <Phone size={14} />
                            </button>
                            <button onClick={handleWhatsApp} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors" title="واتساب">
                                <MessageCircle size={14} />
                            </button>
                            <button onClick={() => onEdit?.(student)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="تعديل">
                                <Edit3 size={14} />
                            </button>
                            <button onClick={handleArchiveToggle} className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all", isArchived ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-amber-50 text-amber-500 hover:bg-amber-100")} title={isArchived ? 'استعادة' : 'أرشفة'}>
                                {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors" title="إغلاق">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* اسم المجموعة */}
            <div className="flex items-center gap-2 mt-2 sm:mt-3">
                <span className="text-blue-600 font-bold text-[10px] sm:text-sm bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {groups.find((g: any) => g.id === student.groupId)?.name || 'بدون مجموعة'}
                </span>
            </div>
        </div>
    );
}

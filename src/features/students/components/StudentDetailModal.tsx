"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, FileText, Award, Headphones, CreditCard } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useStudents } from '../hooks/useStudents';
import { useStudentRecords } from '../hooks/useStudentRecords';
import { StudentDetailModalProps } from '../hooks/types';

// استيراد المكونات الفرعية
import ModalHeader from './ModalHeader';
import AttendanceTab from './AttendanceTab';

import ExamsTab from './ExamsTab';

import CoursesTab from './CoursesTab';
import NotesTab from './NotesTab';
import FollowUpTab from './FollowUpTab';
import FeesTab from './FeesTab';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { FadeIn, SlideIn } from '@/components/ui/transition';


export default function StudentDetailModal({ 
    student: initialStudent, 
    isOpen, 
    onClose, 
    initialTab = 'attendance', 
    onEdit,
    currentAttendance 
}: StudentDetailModalProps) {
    // تحديد التبويب النشط (الافتراضي هو الحضور)
    const [activeTab, setActiveTab] = useState(initialTab);

    // جلب المجموعات للتحقق من نوع المجموعة
    const { data: groups } = useGroups();
    
    // جلب بيانات الطلاب وتحديد الطالب الحالي لضمان تحديث البيانات فورياً
    const { data: students } = useStudents();
    const student = students?.find((s: any) => s.id === initialStudent?.id) || initialStudent;

    // استدعاء الهوك الخاص بسجلات الطالب (حضور، مصروفات، اختبارات، ملحوظات)
    const studentRecords = useStudentRecords(student?.id || '');
    


    // تحديث التبويب النشط عند فتح المودال
    useEffect(() => {
        if (isOpen && initialTab) setActiveTab(initialTab);
    }, [isOpen, initialTab]);

    // دعم زر الرجوع في الهاتف لإغلاق المودال
    useEffect(() => {
        if (!isOpen) return;
        window.history.pushState({ studentModalOpen: true }, '');
        const handlePopState = (e: PopStateEvent) => {
            if (e.state && e.state.studentModalOpen) {
                onClose();
            }
        };
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // إزالة حالة التاريخ المضافة عند إغلاق المودال من الزر وليس من الرجوع
            if (window.history.state?.studentModalOpen) {
                window.history.back();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!student || !isOpen) return null;



    // هل الطالب مجاني؟
    const isFree = !student.monthlyAmount || student.monthlyAmount === 0;

    // تعريف التبويبات (الأزرار العلوية)
    const tabs = [
        { id: 'attendance', label: 'سجل الحضور', icon: Calendar },
        { id: 'courses', label: 'الدورات', icon: Award },
        { id: 'followup', label: 'المتابعات', icon: Headphones },
        { id: 'exams', label: 'سجل الاختبارات', icon: BookOpen },
        ...(!isFree ? [{ id: 'fees', label: 'المصروفات', icon: CreditCard }] : []),
        { id: 'notes', label: 'سجل الملحوظات', icon: FileText },
    ];

    return (
        <>
            {/* الخلفية المظلمة */}
            <FadeIn show={isOpen} className="fixed inset-0 z-[200]">
                <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </FadeIn>

            {/* جسم المودال الرئيسي */}
            <SlideIn show={isOpen} className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] h-[99vh] max-h-[980px] min-h-[500px] bg-white rounded-[40px] shadow-2xl z-[201] overflow-hidden flex flex-col">

                {/* 1. رأس المودال (الاسم وأزرار التحكم) */}
                <ModalHeader student={student} onClose={onClose} onEdit={onEdit} />

                {/* 2. شريط التنقل بين التبويبات */}
                <div className="flex border-b border-gray-50 px-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={cn("flex-1 flex flex-col items-center gap-1 py-4 text-[10px] font-bold transition-all relative",
                                    isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}>
                                <Icon size={20} className={cn("mb-1", isActive && "stroke-[2.5px]")} />
                                <span className="hidden md:inline">{tab.label}</span>
                                {isActive && <div className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-t-full" />}
                            </button>
                        );
                    })}
                </div>

                {/* 3. محتوى التبويبات (يتم استدعاء المكون بناءً على التبويب النشط) */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 text-right">
                    {activeTab === 'attendance' && <AttendanceTab student={student} records={studentRecords} />}

                    {activeTab === 'exams' && <ExamsTab student={student} records={studentRecords} />}
                    {activeTab === 'notes' && <NotesTab student={student} records={studentRecords} />}
                    {activeTab === 'courses' && <CoursesTab student={student} records={studentRecords} />}
                    {activeTab === 'followup' && <FollowUpTab student={student} records={studentRecords} />}
                    {activeTab === 'fees' && !isFree && <FeesTab student={student} records={studentRecords} />}
                </div>
            </SlideIn>
        </>
    );
}
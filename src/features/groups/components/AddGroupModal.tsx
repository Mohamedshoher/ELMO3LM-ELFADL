"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeachers } from '@/features/teachers/services/teacherService';
import { addGroup } from '@/features/groups/services/groupService';
import { getCourses } from '@/features/courses/services/courseService';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

const DEFAULT_SECTIONS = ['العقيدة'];
const STORAGE_KEY = 'almoalem_group_sections';

function loadSections(): string[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    } catch { return DEFAULT_SECTIONS; }
}

function saveSections(sections: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

interface AddGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddGroupModal({ isOpen, onClose }: AddGroupModalProps) {
    const queryClient = useQueryClient();

    const { data: teachers } = useQuery({
        queryKey: ['teachers'],
        queryFn: () => getTeachers()
    });

    const { data: courses } = useQuery({
        queryKey: ['courses'],
        queryFn: () => getCourses()
    });

    const [name, setName] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [section, setSection] = useState('');
    const [courseId, setCourseId] = useState('');
    const [maxStudentsPerHour, setMaxStudentsPerHour] = useState(5);
    const [sectionsList, setSectionsList] = useState<string[]>([]);
    const [showNewInput, setShowNewInput] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    useEffect(() => {
        if (isOpen) {
            const loaded = loadSections();
            setSectionsList(loaded);
            setSection(loaded[0] || '');
        }
    }, [isOpen]);

    const addMutation = useMutation({
        mutationFn: addGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            onClose();
            setName('');
            setTeacherId('');
            setSection(sectionsList[0] || '');
            setCourseId('');
        }
    });

    const handleAddSection = () => {
        const trimmed = newSectionName.trim();
        if (!trimmed || sectionsList.includes(trimmed)) return;
        const updated = [...sectionsList, trimmed];
        setSectionsList(updated);
        saveSections(updated);
        setSection(trimmed);
        setNewSectionName('');
        setShowNewInput(false);
    };

    const handleRemoveSection = (s: string) => {
        if (sectionsList.length <= 1) return;
        const updated = sectionsList.filter(cs => cs !== s);
        setSectionsList(updated);
        saveSections(updated);
        if (section === s) setSection(updated[0] || '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedTeacher = teachers?.find(t => t.id === teacherId);
        addMutation.mutate({
            name: `${section} - ${name}`,
            teacherId: selectedTeacher?.id || null,
            teacher: selectedTeacher?.fullName || '',
            schedule: '',
            count: 0,
            color: 'bg-purple-100 text-purple-600',
            maxStudentsPerHour: maxStudentsPerHour || 5,
            courseId: courseId || null,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إضافة مجموعة جديدة">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">القسم</label>
                    <div className="grid grid-cols-2 gap-2">
                        {sectionsList.map((s) => (
                            <div key={s} className="relative group">
                                <button
                                    type="button"
                                    onClick={() => setSection(s)}
                                    className={cn(
                                        "w-full py-2 rounded-xl text-xs font-bold border transition-all",
                                        section === s
                                            ? "bg-purple-600 text-white border-purple-600"
                                            : "bg-white text-gray-500 border-gray-100 hover:border-purple-200"
                                    )}
                                >
                                    {s}
                                </button>
                                {sectionsList.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSection(s)}
                                        className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {showNewInput ? (
                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    placeholder="اسم القسم الجديد"
                                    className="flex-1 h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection(); } }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSection}
                                    className="h-10 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                                >
                                    إضافة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowNewInput(false); setNewSectionName(''); }}
                                    className="h-10 px-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowNewInput(true)}
                                className="py-2 rounded-xl text-xs font-bold border border-dashed border-gray-300 text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-all flex items-center justify-center gap-1"
                            >
                                <Plus size={14} />
                                إضافة قسم
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">اسم المجموعة</label>
                    <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: 1 أو أ"
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-right font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">الدورة المرتبطة</label>
                    <select
                        required
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-right font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    >
                        <option value="">اختر دورة</option>
                        {courses?.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">المدرس المسؤول</label>
                    <select
                        required
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-right font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    >
                        <option value="">اختر مدرساً</option>
                        {teachers?.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.fullName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">أقصى عدد طلاب في الساعة</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={maxStudentsPerHour}
                            onChange={(e) => setMaxStudentsPerHour(Number(e.target.value))}
                            className="w-24 h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-center font-black text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                        />
                        <p className="text-xs text-gray-400 font-bold">لا يمكن للمدرس تجديد موعد طالب في ساعة تجاوز هذا العدد</p>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20"
                        disabled={addMutation.isPending}
                    >
                        {addMutation.isPending ? 'جاري الإضافة...' : 'إضافة المجموعة'}
                    </Button>
                </div>

            </form>
        </Modal>
    );
}

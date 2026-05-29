"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeachers } from '@/features/teachers/services/teacherService';
import { addGroup } from '@/features/groups/services/groupService';
import { getCourses } from '@/features/courses/services/courseService';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, BookOpen } from 'lucide-react';

const DEFAULT_COLORS: Record<string, string> = {
    'قرآن': 'bg-blue-100 text-blue-600',
    'تلقين': 'bg-green-100 text-green-600',
    'نور بيان': 'bg-orange-100 text-orange-600',
};

const DEFAULT_TYPES = Object.keys(DEFAULT_COLORS);
const STORAGE_KEY = 'almoalem_custom_group_types';

function loadCustomTypes(): string[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function saveCustomTypes(types: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

const CUSTOM_COLOR = 'bg-gray-100 text-gray-600';

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
    const [type, setType] = useState('قرآن');
    const [courseId, setCourseId] = useState('');
    const [maxStudentsPerHour, setMaxStudentsPerHour] = useState(5);
    const [customTypes, setCustomTypes] = useState<string[]>([]);
    const [showNewInput, setShowNewInput] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');

    useEffect(() => {
        if (isOpen) setCustomTypes(loadCustomTypes());
    }, [isOpen]);

    const allTypes = [...DEFAULT_TYPES, ...customTypes];

    const addMutation = useMutation({
        mutationFn: addGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            onClose();
            setName('');
            setTeacherId('');
            setType('قرآن');
            setCourseId('');
        }
    });

    const handleAddCustomType = () => {
        const trimmed = newTypeName.trim();
        if (!trimmed || allTypes.includes(trimmed)) return;
        const updated = [...customTypes, trimmed];
        setCustomTypes(updated);
        saveCustomTypes(updated);
        setType(trimmed);
        setNewTypeName('');
        setShowNewInput(false);
    };

    const handleRemoveCustomType = (t: string) => {
        const updated = customTypes.filter(ct => ct !== t);
        setCustomTypes(updated);
        saveCustomTypes(updated);
        if (type === t) setType('قرآن');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedTeacher = teachers?.find(t => t.id === teacherId);
        addMutation.mutate({
            name: `${type} (${name})`,
            teacherId: selectedTeacher?.id || null,
            teacher: selectedTeacher?.fullName || '',
            schedule: '',
            count: 0,
            color: DEFAULT_COLORS[type] || CUSTOM_COLOR,
            maxStudentsPerHour: maxStudentsPerHour || 5,
            courseId: courseId || null,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إضافة مجموعة جديدة">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">نوع المجموعة</label>
                    <div className="grid grid-cols-2 gap-2">
                        {allTypes.map((t) => {
                            const isCustom = customTypes.includes(t);
                            return (
                                <div key={t} className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={cn(
                                            "w-full py-2 rounded-xl text-xs font-bold border transition-all",
                                            type === t
                                                ? "bg-purple-600 text-white border-purple-600"
                                                : "bg-white text-gray-500 border-gray-100 hover:border-purple-200"
                                        )}
                                    >
                                        {t}
                                    </button>
                                    {isCustom && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomType(t)}
                                            className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {showNewInput ? (
                            <div className="col-span-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="اسم النوع الجديد"
                                    className="flex-1 h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomType(); } }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomType}
                                    className="h-10 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                                >
                                    إضافة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowNewInput(false); setNewTypeName(''); }}
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
                                إضافة نوع
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">اسم/رقم المجموعة</label>
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
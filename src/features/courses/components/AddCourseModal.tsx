"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAddCourse, useUpdateCourse } from '../hooks/useCourses';
import { Course } from '@/types';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    editCourse?: Course | null;
}

export default function AddCourseModal({ isOpen, onClose, editCourse }: AddCourseModalProps) {
    const [name, setName] = useState('');
    const [lecturesCount, setLecturesCount] = useState(1);
    const [link, setLink] = useState('');
    const [bookLink, setBookLink] = useState('');

    useEffect(() => {
        if (editCourse) {
            setName(editCourse.name);
            setLecturesCount(editCourse.lecturesCount);
            setLink(editCourse.link);
            setBookLink(editCourse.bookLink || '');
        } else {
            setName('');
            setLecturesCount(1);
            setLink('');
            setBookLink('');
        }
    }, [editCourse, isOpen]);

    const addMutation = useAddCourse();
    const updateMutation = useUpdateCourse();

    const isEditing = !!editCourse;
    const mutation = isEditing ? updateMutation : addMutation;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateMutation.mutate({ id: editCourse.id, name, lecturesCount, link, bookLink: bookLink || undefined }, {
                onSuccess: () => { onClose(); }
            });
        } else {
            addMutation.mutate({ name, lecturesCount, link, bookLink: bookLink || undefined }, {
                onSuccess: () => { onClose(); }
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'تعديل الدورة' : 'إضافة دورة جديدة'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <Input
                    label="اسم الدورة"
                    placeholder="مثال: دورة تجويد القرآن"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <Input
                    label="عدد المحاضرات"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={lecturesCount}
                    onChange={(e) => setLecturesCount(Number(e.target.value))}
                    required
                />

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">الرابط</label>
                    <input
                        required
                        type="url"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="https://youtube.com/..."
                        dir="ltr"
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-left font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    />
                    <p className="text-xs text-gray-400">رابط الدورة على يوتيوب أو تليجرام</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 block">رابط الكتاب</label>
                    <input
                        type="url"
                        value={bookLink}
                        onChange={(e) => setBookLink(e.target.value)}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-left font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/10"
                    />
                    <p className="text-xs text-gray-400">رابط الكتاب الخاص بالدورة (اختياري)</p>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الحفظ...</span>
                            </div>
                        ) : isEditing ? 'حفظ التعديلات' : 'إضافة الدورة'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

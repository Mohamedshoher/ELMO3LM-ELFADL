"use client";

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAddCourse } from '../hooks/useCourses';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
    const [name, setName] = useState('');
    const [lecturesCount, setLecturesCount] = useState(1);
    const [link, setLink] = useState('');

    const addMutation = useAddCourse();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate({ name, lecturesCount, link }, {
            onSuccess: () => {
                onClose();
                setName('');
                setLecturesCount(1);
                setLink('');
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="إضافة دورة جديدة">
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

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20"
                        disabled={addMutation.isPending}
                    >
                        {addMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الحفظ...</span>
                            </div>
                        ) : 'إضافة الدورة'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

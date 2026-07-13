"use client";
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Bell } from 'lucide-react';

// المكونات الفرعية
import AttendanceStats from './AttendanceStats';
import AttendanceFilters from './AttendanceFilters';
import StudentReportCard from './StudentReportCard';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// الخدمات والمخازن
import { useStudents } from '@/features/students/hooks/useStudents';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/store/useAuthStore';

const AttendanceChartModal = dynamic(() => import('./AttendanceChartModal'), { ssr: false });
const StudentDetailModal = dynamic(() => import('@/features/students/components/StudentDetailModal'), { ssr: false });
const EditStudentModal = dynamic(() => import('@/features/students/components/EditStudentModal'), { ssr: false });

export default function AttendanceReportPage() {
    const { data: students, archiveStudent } = useStudents();
    const { data: groups } = useGroups();
    const { user } = useAuthStore();

    // حالة التاريخ المختار
    const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const [groupId, setGroupId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [contLimit, setContLimit] = useState('');
    const [totalLimit, setTotalLimit] = useState('');
    const [showAbsentChart, setShowAbsentChart] = useState(false);
    const [showPresentChart, setShowPresentChart] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<any>(null);
    const [autoCheckResult, setAutoCheckResult] = useState<string | null>(null);
    const autoCheckDone = useRef(false);

    // تشغيل تلقائي لفحص غياب الطلاب عند فتح التقرير (مرة واحدة فقط)
    useEffect(() => {
        if (autoCheckDone.current) return;
        autoCheckDone.current = true;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const todayStr = new Date().toISOString().split('T')[0];

        // فحص الأمس واليوم
        Promise.all([
            fetch('/api/automation/check-student-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr }),
            }),
            fetch('/api/automation/check-student-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: todayStr }),
            }),
        ])
        .then(async ([res1, res2]) => {
            const data1 = await res1.json();
            const data2 = await res2.json();
            const total1 = (data1?.results || []).filter((r: any) => r.status === 'marked_absent').length;
            const total2 = (data2?.results || []).filter((r: any) => r.status === 'marked_absent').length;
            const total = total1 + total2;
            if (total > 0) {
                setAutoCheckResult(`✅ تم تسجيل ${total} طالب كغائب (لم يسلموا متابعاتهم)`);
            }
        })
        .catch(err => console.error('Auto attendance check error:', err));
    }, []);

    // 0. تحديد الطلاب المسموح للمستخدم رؤيتهم
    const relevantStudentIds = useMemo(() => {
        if (!students || !groups || !user) return [];
        const filteredGroups = groups.filter(g => {
            if (user.role === 'teacher') return g.teacherId === user.teacherId;
            if (user.role === 'supervisor') {
                const sections = user.responsibleSections || [];
                return sections.some(section => g.name.includes(section));
            }
            return true;
        });
        const gIds = filteredGroups.map(g => g.id);
        return students.filter(s => s.status === 'active' && (user.role === 'director' || (s.groupIds?.some(gid => gIds.includes(gid)) || gIds.includes(s.groupId!)))).map(s => s.id);
    }, [students, groups, user]);

    const groupIdsForQuery = useMemo(() => {
        if (user?.role === 'director') return 'all';
        return groups?.filter(g => {
            if (user?.role === 'teacher') return g.teacherId === user.teacherId;
            if (user?.role === 'supervisor') return (user.responsibleSections || []).some(sec => g.name.includes(sec));
            return false;
        }).map(g => g.id).join(',') || 'none';
    }, [groups, user]);

    // 1. جلب بيانات الغياب والملحوظات
    const { data: reportData, isLoading } = useQuery({
        queryKey: ['attendance-report-v7', selectedDateStr, groupIdsForQuery],
        queryFn: async () => {
            const { supabase } = await import('@/lib/supabase');

            const [y, m, d] = selectedDateStr.split('-').map(Number);
            const dObj = new Date(y, m - 1, d);
            dObj.setDate(dObj.getDate() - 14); // تقليل الفترة لـ 14 يوم فقط بناءً على طلب المستخدم لتسريع التحميل القصوى
            const sinceDate = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;

            const fetchAllAtt = async () => {
                let allData: any[] = [];
                let from = 0;
                const step = 1000;
                
                while (true) {
                    let query = supabase.from('attendance')
                        .select('student_id, date, status, notes, is_automatic')
                        .gte('date', sinceDate);

                    // فلترة البيانات على السيرفر بدلاً من جلب الكل
                    if (user?.role !== 'director' && relevantStudentIds.length > 0) {
                        query = query.in('student_id', relevantStudentIds);
                    }

                    const { data, error } = await query
                        .order('date', { ascending: false })
                        .range(from, from + step - 1);

                    if (error || !data || data.length === 0) break;
                    allData = [...allData, ...data];

                    if (data.length < step) break;
                    from += step;
                }
                return allData;
            };

            const attData = await fetchAllAtt();

            const map: Record<string, any[]> = {};
            (attData || []).forEach(row => {
                if (!map[row.student_id]) map[row.student_id] = [];
                map[row.student_id].push({
                    date: row.date.split('T')[0],
                    status: row.status,
                    notes: row.notes,
                    is_automatic: row.is_automatic,
                });
            });

            return { attendanceMap: map };
        },
        enabled: !!students && (user?.role === 'director' || relevantStudentIds.length > 0)
    });

    // 2. معالجة البيانات وحساب الغياب المتصل والكلي
    const processedStudents = useMemo(() => {
        if (!students || !reportData) return [];

        const filteredGroups = groups?.filter(g => {
            if (user?.role === 'teacher') return g.teacherId === user.teacherId;
            if (user?.role === 'supervisor') {
                const sections = user.responsibleSections || [];
                return sections.some(section => g.name.includes(section));
            }
            return true;
        }) || [];
        const groupIds = filteredGroups.map(g => g.id);
        const isControlRole = user?.role === 'director'

        const selectedDate = new Date(selectedDateStr);
        const dayOfWeek = selectedDate.getDay();
        const diffFromSat = (dayOfWeek + 1) % 7; // الأسبوع يبدأ من السبت
        const weekStartDate = new Date(selectedDate);
        weekStartDate.setDate(selectedDate.getDate() - diffFromSat);
        const wStartStr = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;

        return students
            .filter(s => s.status === 'active' && (isControlRole || s.groupIds?.some(gid => groupIds.includes(gid)) || groupIds.includes(s.groupId!)))
            .map(s => {
                const history = reportData.attendanceMap[s.id] || [];

                // استخراج الحالة الأحدث لكل يوم مع التفاصيل
                const dailyStatusMap = new Map<string, string>();
                const dailyNotesMap = new Map<string, string | null>();
                const dailyAutoMap = new Map<string, boolean>();
                history.forEach(h => {
                    if (!dailyStatusMap.has(h.date)) {
                        dailyStatusMap.set(h.date, h.status);
                        dailyNotesMap.set(h.date, h.notes);
                        dailyAutoMap.set(h.date, h.is_automatic);
                    }
                });

                // 1. حساب الغياب المتصل تنازلياً من اليوم المختار (في حدود الأسبوع فقط)
                const recordedDates = Array.from(dailyStatusMap.keys())
                    .filter(d => d >= wStartStr && d <= selectedDateStr)
                    .sort((a, b) => b.localeCompare(a));

                let continuousAbsences = 0;
                for (const d of recordedDates) {
                    if (dailyStatusMap.get(d) === 'absent') {
                        continuousAbsences++;
                    } else if (dailyStatusMap.get(d) === 'present') {
                        break;
                    }
                }

                // 2. حساب الغياب والحضور في الأسبوع الحالي لليوم المختار
                let totalAbsentWeek = 0;
                let totalPresentWeek = 0;
                for (const [d, status] of dailyStatusMap.entries()) {
                    if (d >= wStartStr && d <= selectedDateStr) {
                        if (status === 'absent') totalAbsentWeek++;
                        if (status === 'present') totalPresentWeek++;
                    }
                }
                const totalRecordsWeek = totalAbsentWeek + totalPresentWeek;
                const absencePercentage = totalRecordsWeek > 0 ? Math.round((totalAbsentWeek / totalRecordsWeek) * 100) : 0;
                const presencePercentage = totalRecordsWeek > 0 ? Math.round((totalPresentWeek / totalRecordsWeek) * 100) : 0;

                const selDateStatus = dailyStatusMap.get(selectedDateStr);
                const selDateNotes = dailyNotesMap.get(selectedDateStr);
                const selDateAuto = dailyAutoMap.get(selectedDateStr);

                return {
                    ...s,
                    groupName: groups?.find(g => g.id === (s.groupId ?? s.groupIds?.[0] ?? null))?.name || 'بدون حلقة',
                    totalAbsences: totalAbsentWeek,
                    continuousAbsences,
                    absencePercentage,
                    presencePercentage,
                    currentStatus: selDateStatus || 'not_recorded',
                    currentNotes: selDateNotes || null,
                    isAutoAbsence: selDateAuto || false,
                };
            });
    }, [students, reportData, groups, user, selectedDateStr]);

    // 3. الفلترة النهائية للعرض وحساب إحصائيات المخططات
    const { displayStudents, chartData } = useMemo(() => {
        const filtered = processedStudents.filter(s => {
            const matchesGroup = groupId === 'all' || (s.groupIds?.includes(groupId) ?? false) || s.groupId === groupId;
            const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase());
            const cL = Number(contLimit);
            const tL = Number(totalLimit);

            if (!matchesSearch || !matchesGroup) return false;

            // إذا لم يتم تحديد فلاتر أرقام، اظهر الغائبين اليوم فقط
            if (!cL && !tL) return s.currentStatus === 'absent';

            let pass = false;
            if (cL > 0 && tL > 0) {
                pass = s.continuousAbsences >= cL && s.totalAbsences >= tL;
            } else if (cL > 0) {
                pass = s.continuousAbsences >= cL;
            } else if (tL > 0) {
                pass = s.totalAbsences >= tL;
            }
            return pass;
        }).sort((a, b) => b.totalAbsences - a.totalAbsences);

        const getGroupStats = (list: any[]) => {
            const counts: Record<string, number> = {};
            list.forEach(s => { counts[s.groupName] = (counts[s.groupName] || 0) + 1; });
            return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        };

        return {
            displayStudents: filtered,
            chartData: {
                present: getGroupStats(processedStudents.filter(s => s.currentStatus === 'present')),
                absent: getGroupStats(processedStudents.filter(s => s.currentStatus === 'absent'))
            }
        };
    }, [processedStudents, groupId, searchQuery, contLimit, totalLimit]);

    // حساب إحصائيات اليوم
    const dailyStats = useMemo(() => {
        const p = processedStudents.filter(s => s.currentStatus === 'present').length;
        const a = processedStudents.filter(s => s.currentStatus === 'absent').length;
        return { p, a };
    }, [processedStudents]);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 text-right overflow-x-hidden">
            {/* Header - Simple Stats Only */}
            <div className="sticky top-0 z-[70] bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-2 overflow-x-hidden relative">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex bg-gray-100 p-1 rounded-xl items-center gap-2">
                        <button onClick={() => {
                            const d = new Date(selectedDateStr);
                            d.setDate(d.getDate() - 1);
                            setSelectedDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                        }} className="px-3 py-1.5 rounded-lg text-xs font-black bg-white shadow-sm text-gray-600 hover:bg-gray-200 transition-colors">
                            السابق
                        </button>

                        <div className="px-2 text-[10px] font-black text-gray-500 min-w-[80px] text-center relative cursor-pointer group flex items-center justify-center">
                            <input
                                type="date"
                                value={selectedDateStr}
                                onChange={(e) => {
                                    if (e.target.value) setSelectedDateStr(e.target.value);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="group-hover:text-blue-500 transition-colors">
                                {new Date(selectedDateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>

                        <button onClick={() => {
                            const d = new Date();
                            setSelectedDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                        }} className="px-3 py-1.5 rounded-lg text-xs font-black bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            اليوم
                        </button>
                    </div>

                    {autoCheckResult && (
                        <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 z-50">
                            <Bell size={14} />
                            {autoCheckResult}
                        </div>
                    )}
                    <AttendanceStats
                        presentCount={dailyStats.p} absentCount={dailyStats.a}
                        showPresentChart={showPresentChart} setShowPresentChart={setShowPresentChart}
                        showAbsentChart={showAbsentChart} setShowAbsentChart={setShowAbsentChart}
                    />
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-4 space-y-4">

                {isLoading ? (
                    <div className="py-20 text-center font-black text-gray-400">جاري تحميل البيانات...</div>
                ) : (
                    <>
                        <AttendanceFilters
                            groups={groups?.filter(g => {
                                if (user?.role === 'teacher') return g.teacherId === user.teacherId;
                                if (user?.role === 'supervisor') {
                                    const sections = user.responsibleSections || [];
                                    return sections.some(section => g.name.includes(section));
                                }
                                return true;
                            }) || []}
                            selectedGroupId={groupId} setSelectedGroupId={setGroupId}
                            continuousLimit={contLimit} setContinuousLimit={setContLimit}
                            totalLimit={totalLimit} setTotalLimit={setTotalLimit}
                            count={displayStudents.length}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {displayStudents.length > 0 ? (
                                displayStudents.map((s, i) => (
                                    <StudentReportCard 
                                        key={s.id} 
                                        student={s} 
                                        index={i} 
                                        userRole={user?.role} 
                                        onArchive={archiveStudent} 
                                        onOpenDetails={setSelectedStudent} 
                                        onEdit={(s: any) => {
                                            setStudentToEdit(s);
                                            setIsEditModalOpen(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-gray-100 text-gray-400 font-bold">لا توجد بيانات غياب مطابقة للبحث</div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <AttendanceChartModal isOpen={showAbsentChart} onClose={() => setShowAbsentChart(false)} type="absent" title="توزيع الغياب" data={chartData.absent} />
            <AttendanceChartModal isOpen={showPresentChart} onClose={() => setShowPresentChart(false)} type="present" title="توزيع الحضور" data={chartData.present} />

            <StudentDetailModal 
                student={selectedStudent} 
                isOpen={!!selectedStudent} 
                onClose={() => setSelectedStudent(null)} 
                initialTab="attendance" 
                onEdit={(s: any) => {
                    setSelectedStudent(null);
                    setStudentToEdit(s);
                    setIsEditModalOpen(true);
                }}
            />

            <EditStudentModal
                student={studentToEdit}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setStudentToEdit(null);
                }}
            />
        </div>
    );
}
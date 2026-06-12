import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { ARABIC_DAYS } from '@/lib/appointment-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const targetDate = body.date || new Date().toISOString().split('T')[0];
        const dayIndex = new Date(targetDate).getDay();
        const todayArabic = ARABIC_DAYS[dayIndex];
        const monthKey = targetDate.substring(0, 7);

        const supabase = createServerSupabase();

        // 1. جلب جميع الطلاب النشطين
        const { data: students, error: stuErr } = await supabase
            .from('students')
            .select('id, full_name, parent_phone, appointment, group_id')
            .eq('status', 'active');

        if (stuErr) {
            return NextResponse.json({ error: stuErr.message }, { status: 500 });
        }

        // 2. تصفية الطلاب الذين لديهم هذا اليوم في مواعيدهم
        const studentsWithAppointment = (students || []).filter((s: any) => {
            if (!s.appointment) return false;
            const days = s.appointment.split(',').map((p: string) => p.trim().split(':')[0].trim());
            return days.includes(todayArabic);
        });

        // 3. جلب جميع متابعات (listens) اليوم
        const { data: todayListens } = await supabase
            .from('student_listens')
            .select('student_id')
            .eq('date', targetDate);

        const listenedStudentIds = new Set((todayListens || []).map((l: any) => l.student_id));

        // 4. جلب الحضور المسجل بالفعل لليوم
        const { data: existingAttendance } = await supabase
            .from('attendance')
            .select('student_id, status, is_automatic')
            .eq('date', targetDate);

        const existingAttMap = new Map((existingAttendance || []).map((a: any) => [a.student_id, a]));

        // 5. معالجة كل طالب
        const results: any[] = [];

        for (const student of studentsWithAppointment) {
            const hasListen = listenedStudentIds.has(student.id);
            const existing = existingAttMap.get(student.id);

            if (!hasListen) {
                // لم يسلم المتابعة
                if (!existing) {
                    // إضافة سجل غياب
                    const { error: attErr } = await supabase
                        .from('attendance')
                        .insert([{
                            student_id: student.id,
                            date: targetDate,
                            month_key: monthKey,
                            status: 'absent',
                            notes: 'لم يسلم المتابعة',
                            is_automatic: true,
                        }]);

                    if (attErr) {
                        results.push({ studentId: student.id, status: 'error', error: attErr.message });
                        continue;
                    }

                    // إرسال إشعار داخلي لولي الأمر
                    try {
                        const convoId = `system-${student.id}`;
                        const { data: existingConvo } = await supabase
                            .from('conversations')
                            .select('id')
                            .contains('participants', ['system', student.id]);

                        let conversationId: string;
                        if (existingConvo && existingConvo.length > 0) {
                            conversationId = existingConvo[0].id;
                        } else {
                            const { data: newConvo } = await supabase
                                .from('conversations')
                                .insert([{
                                    participants: ['system', student.id],
                                    participant_names: ['نظام الحضور', student.full_name],
                                    type: 'system-parent',
                                }])
                                .select('id')
                                .single();
                            conversationId = newConvo?.id;
                        }

                        if (conversationId) {
                            const messageContent = `⚠️ تنبيه آلي: الطالب ${student.full_name} لم يسلم متابعة اليوم ${todayArabic} ${targetDate}.`;

                            await supabase
                                .from('messages')
                                .insert([{
                                    conversation_id: conversationId,
                                    sender_id: 'system',
                                    sender_name: 'نظام الحضور',
                                    sender_role: 'director',
                                    content: messageContent,
                                    read_by: ['system'],
                                }]);

                            // تحديث المحادثة
                            const { data: convoData } = await supabase
                                .from('conversations')
                                .select('unread_counts')
                                .eq('id', conversationId)
                                .single();

                            const newUnreadCounts = convoData?.unread_counts || {};
                            newUnreadCounts[student.id] = (newUnreadCounts[student.id] || 0) + 1;

                            await supabase
                                .from('conversations')
                                .update({
                                    last_message: messageContent,
                                    last_message_at: new Date().toISOString(),
                                    unread_counts: newUnreadCounts,
                                })
                                .eq('id', conversationId);
                        }
                    } catch (chatErr) {
                        console.error('Chat notification error:', chatErr);
                    }

                    // تسجيل في automation_logs
                    await supabase
                        .from('automation_logs')
                        .insert([{
                            rule_name: 'فحص غياب الطلاب',
                            status: 'success',
                            details: `الطالب: ${student.full_name} - لم يسلم المتابعة - ${targetDate}`,
                            affected_entity_id: student.id,
                            affected_entity_name: student.full_name,
                        }]);

                    results.push({ studentId: student.id, status: 'marked_absent' });
                } else if (existing.status !== 'absent') {
                    // موجود لكنه مسجل كحاضر - لا نغير
                    results.push({ studentId: student.id, status: 'already_present' });
                } else {
                    results.push({ studentId: student.id, status: 'already_absent' });
                }
            } else {
                // سلم المتابعة - إذا كان مسجل غياب تلقائي، احذفه
                if (existing?.is_automatic) {
                    await supabase
                        .from('attendance')
                        .delete()
                        .eq('student_id', student.id)
                        .eq('date', targetDate)
                        .eq('is_automatic', true);

                    results.push({ studentId: student.id, status: 'cleared_absence' });
                } else {
                    results.push({ studentId: student.id, status: 'has_listen' });
                }
            }
        }

        return NextResponse.json({
            date: targetDate,
            dayName: todayArabic,
            totalStudents: studentsWithAppointment.length,
            results,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

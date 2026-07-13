import { User, UserRole } from "@/types";// نوع المستخدم
import { supabase } from "@/lib/supabase";// قاعدة البيانات

/**
 * دالة محاكاة للتأخير (Delay)
 * تُستخدم لمحاكاة وقت استجابة الشبكة عند الاتصال بقاعدة البيانات
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * الدالة الرئيسية لتسجيل الدخول بناءً على الدور (Role)
 * تقوم بالتحقق من هوية المستخدم وكلمة مروره عبر قاعدة بيانات Supabase أو قيم ثابتة
 */
export const loginWithRole = async (identifier: string, password: string): Promise<User> => {
    // محاكاة تأخير بسيط للشبكة
    await delay(800);

    // --- تعريف المتغيرات الأساسية ---
    let role: UserRole = 'teacher';
    let teacherId: string | undefined;
    let phone: string | undefined;
    let responsibleSections: string[] = [];

    // --- 1. تحديد دور المستخدم بناءً على المعرف (Identifier) ---
    if (identifier === 'director') {
        role = 'director';
    } else if (identifier === 'supervisor') {
        role = 'supervisor';
    } else if (identifier.startsWith('teacher-')) {
        role = 'teacher';
        teacherId = identifier.replace('teacher-', '');
    } else if (identifier.startsWith('supervisor-')) {
        role = 'supervisor';
        teacherId = identifier.replace('supervisor-', '');
    } else if (identifier.startsWith('student-')) {
        role = 'parent';
        phone = identifier.replace('student-', '');
    } else if (/^\d{10,14}$/.test(identifier)) {
        // إذا كان المدخل رقماً فقط، نعتبره تلقائياً طالب
        role = 'parent';
        phone = identifier;
    }

    // --- 2. التحقق من كلمة مرور المدير (قيمة ثابتة) ---
    if (role === 'director' && password !== '996644') {
        throw new Error("كلمة مرور المدير غير صحيحة");
    }

    // تعيين اسم افتراضي للعرض
    let displayName = role === 'director' ? 'المدير العام' : role === 'supervisor' ? 'المشرف التربوي' : role === 'parent' ? (phone || 'طالب') : 'معلم المجموعة';

    // --- 3. التحقق من دخول الطالب (عبر قاعدة البيانات) ---
    if (role === 'parent' && phone) {
        // تجريد الرقم من كل الرموز غير الرقمية
        const digits = phone.replace(/[^0-9]/g, '');

        // توليد جميع الصيغ المصرية الممكنة
        const formats = new Set<string>();
        formats.add(digits);

        // آخر 11 رقم (يلتقط أي صيغة)
        if (digits.length > 11) formats.add(digits.slice(-11));
        // آخر 10 أرقام مع 0 (فقدان الصفر الأول)
        if (digits.length > 10) formats.add('0' + digits.slice(-10));
        // آخر 10 أرقام مع 2 (دولي بدون البادئة)
        if (digits.length > 10) formats.add('2' + digits.slice(-10));

        // صيغة محمول مصري 11 رقم (01XXXXXXXXX)
        if (digits.length === 11 && digits.startsWith('01')) {
            formats.add('2' + digits);
            formats.add('+2' + digits);
            formats.add('002' + digits);
        }

        // صيغة دولية 12 رقم (20XXXXXXXXXX)
        if (digits.length === 12 && digits.startsWith('2')) {
            formats.add('0' + digits.slice(2));
            formats.add('+' + digits);
            formats.add('00' + digits);
            formats.add('+20 ' + digits.slice(2, 4) + ' ' + digits.slice(4));
            formats.add('+20' + digits.slice(2, 4) + ' ' + digits.slice(4));
        }

        // صيغة مبتدئة بـ 20 بعد التجريد
        if (digits.startsWith('20')) {
            const local = '0' + digits.slice(2);
            if (local.length === 11) formats.add(local);
        }

        // البحث برقم الطالب فقط
        let { data: students, error } = await supabase
            .from('students')
            .select('full_name, student_phone')
            .in('student_phone', Array.from(formats))
            .limit(1);

        if (!students || students.length === 0) {
            // محاولة بحث أوسع: نجلب جميع الطلاب ونطابق بتجريد الأرقام
            const { data: allStudents } = await supabase
                .from('students')
                .select('full_name, student_phone')
                .limit(500);

            const matched = (allStudents || []).find(s => {
                const studentDigits = (s.student_phone || '').replace(/[^0-9]/g, '');
                return studentDigits === digits || studentDigits === digits.slice(-11) || studentDigits === '0' + digits.slice(-10);
            });

            if (!matched) {
                throw new Error("عذراً، هذا الرقم غير مسجل لدينا كطالب");
            }

            students = [matched];
        }

        if (error) {
            console.error("Supabase Error:", error);
            throw new Error("حدث خطأ أثناء الاتصال بقاعدة البيانات");
        }

        const dbStudent = students[0];
        const last6Digits = digits.slice(-6);

        // السماح بالدخول بكلمة 123456 أو آخر 6 أرقام من الهاتف
        if (password !== last6Digits && password !== '123456') {
            throw new Error(`كلمة المرور غير صحيحة. يرجى استخدام آخر 6 أرقام من رقم هاتفك المسجل.`);
        }

        displayName = dbStudent.full_name || phone;
    }

    // --- 4. التحقق من دخول المعلم أو المشرف (عبر قاعدة البيانات) ---
    if (role === 'teacher' || role === 'supervisor') {
        const searchId = teacherId || identifier.replace(`${role}-`, '');

        // جلب بيانات المعلم/المشرف من جدول المعلمين
        const { data: teacher, error } = await supabase
            .from('teachers')
            .select('id, full_name, password, role, responsible_sections')
            .eq('id', searchId)
            .single();

        if (error || !teacher) {
            throw new Error(`${role === 'teacher' ? 'المعلم' : 'المشرف'} غير موجود في قاعدة البيانات`);
        }

        // التحقق من تطابق كلمة المرور المخزنة
        if (teacher.password && teacher.password !== password) {
            throw new Error("كلمة المرور غير صحيحة");
        }

        // تحديث المتغيرات بالبيانات الحقيقية المسترجعة
        teacherId = teacher.id;
        displayName = teacher.full_name;
        responsibleSections = teacher.responsible_sections || [];
    }

    // --- 5. إرجاع كائن المستخدم النهائي ---
    return {
        uid: `mock-${teacherId || identifier}`,
        email: `${identifier}@almoalem.center`,
        displayName,
        role,
        teacherId,
        responsibleSections,
        createdAt: Date.now(),
        lastLogin: Date.now(),
    };
};

/**
 * دالة تسجيل الخروج
 */
export const logout = async () => {
    await delay(300);
};

/**
 * دالة تجريبية لإنشاء حساب جديد بناءً على الدور
 */
export const registerRoleAccount = async (role: string, password: string, displayName: string): Promise<User> => {
    await delay(500);
    return {
        uid: `mock-${role}`,
        email: `${role}@almoalem.center`,
        displayName,
        role: role as UserRole,
        createdAt: Date.now(),
        lastLogin: Date.now(),
    };
};

/**
 * جلب بيانات ملف المستخدم الشخصي بناءً على المعرف الفريد (UID)
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
    const role = uid.replace('mock-', '');
    return {
        uid: uid,
        email: `${role}@almoalem.center`,
        displayName: role === 'director' ? 'المدير العام' : role === 'teacher' ? 'معلم' : 'مستخدم',
        role: role as UserRole,
        createdAt: Date.now(),
        lastLogin: Date.now()
    };
};
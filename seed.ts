import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars manually
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.+)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { 'x-client-info': 'almoalem-seed' } },
});

async function seed() {
    console.log('🌱 بدء إضافة البيانات التجريبية...\n');

    // =============================================
    // 1. إضافة المعلمين
    // =============================================
    console.log('👨‍🏫 إضافة المعلمين...');
    const teachers = [
        { full_name: 'أحمد محمد علي', phone: '01000000001', role: 'director', password: '123456', status: 'active' },
        { full_name: 'خالد عبدالله', phone: '01000000002', role: 'supervisor', password: '123456', status: 'active' },
        { full_name: 'محمود حسن', phone: '01000000003', role: 'teacher', password: '123456', status: 'active' },
    ];

    const { data: createdTeachers, error: tErr } = await supabase
        .from('teachers')
        .insert(teachers)
        .select();

    if (tErr) { console.error('❌ فشل إضافة المعلمين:', tErr); return; }
    console.log(`✅ تم إضافة ${createdTeachers.length} معلمين`);

    // =============================================
    // 2. إضافة مجموعة
    // =============================================
    console.log('\n📚 إضافة المجموعات...');
    const { data: group, error: gErr } = await supabase
        .from('groups')
        .insert({ name: 'المجموعة الأولى', teacher_id: createdTeachers[2].id })
        .select();

    if (gErr) { console.error('❌ فشل إضافة المجموعة:', gErr); return; }
    console.log(`✅ تم إضافة المجموعة: ${group[0].name}`);

    // =============================================
    // 3. إضافة الطلاب
    // =============================================
    console.log('\n👦 إضافة الطلاب...');
    const students = [
        { full_name: 'عمر خالد', parent_phone: '01000000011', group_id: group[0].id, monthly_amount: 100, status: 'active' },
        { full_name: 'علي أحمد', parent_phone: '01000000012', group_id: group[0].id, monthly_amount: 100, status: 'active' },
        { full_name: 'يوسف محمود', parent_phone: '01000000013', group_id: group[0].id, monthly_amount: 80, status: 'active' },
        { full_name: 'أحمد علي', parent_phone: '01000000014', group_id: group[0].id, monthly_amount: 100, status: 'active' },
        { full_name: 'محمد سامي', parent_phone: '01000000015', group_id: group[0].id, monthly_amount: 80, status: 'active' },
        { full_name: 'عبدالله عمر', parent_phone: '01000000016', group_id: group[0].id, monthly_amount: 100, status: 'active' },
        { full_name: 'زياد خلف', parent_phone: '01000000017', group_id: group[0].id, monthly_amount: 80, status: 'active' },
        { full_name: 'حمزة أسامة', parent_phone: '01000000018', group_id: group[0].id, monthly_amount: 100, status: 'active' },
        { full_name: 'سيف الدين', parent_phone: '01000000019', group_id: group[0].id, monthly_amount: 80, status: 'active' },
        { full_name: 'إبراهيم عادل', parent_phone: '01000000020', group_id: group[0].id, monthly_amount: 100, status: 'active' },
    ];

    const { data: createdStudents, error: sErr } = await supabase
        .from('students')
        .insert(students)
        .select();

    if (sErr) { console.error('❌ فشل إضافة الطلاب:', sErr); return; }
    console.log(`✅ تم إضافة ${createdStudents.length} طلاب`);

    // =============================================
    // الخلاصة
    // =============================================
    console.log('\n🎉 تم إضافة البيانات التجريبية بنجاح!');
    console.log(`   📊 ${createdTeachers.length} معلمين`);
    console.log(`   📚 ${group.length} مجموعة`);
    console.log(`   👦 ${createdStudents.length} طالب`);
    console.log('\n🔑 كلمة المرور لكل المستخدمين: 123456');
}

seed().catch(console.error);

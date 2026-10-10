-- File: /supabase/migrations/0007_rls_policies.sql
-- Description: Security helpers and Row Level Security (RLS) policies for all tables

-- 1. Helper Functions (Security Definer with search_path pinned)
CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS UUID AS $$
    SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.auth_department_id()
RETURNS UUID AS $$
    SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_hod_of(dept_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'hod' AND department_id = dept_id AND is_active = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.my_batch_id()
RETURNS UUID AS $$
    SELECT batch_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_unavailability ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_dept_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. Departments Policies
DROP POLICY IF EXISTS "Departments: Read access" ON departments;
CREATE POLICY "Departments: Read access" ON departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Departments: Super Admin write" ON departments;
CREATE POLICY "Departments: Super Admin write" ON departments FOR ALL TO authenticated 
USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 3. Profiles Policies
DROP POLICY IF EXISTS "Profiles: View authenticated" ON profiles;
CREATE POLICY "Profiles: View authenticated" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles: Self or Admin/HOD update" ON profiles;
CREATE POLICY "Profiles: Self or Admin/HOD update" ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid() OR is_super_admin() OR (auth_role() = 'hod' AND department_id = auth_department_id()))
WITH CHECK (id = auth.uid() OR is_super_admin() OR (auth_role() = 'hod' AND department_id = auth_department_id()));

-- 4. Academic Terms, Periods, Rooms, Holidays
DROP POLICY IF EXISTS "Master data: View authenticated" ON academic_terms;
CREATE POLICY "Master data: View authenticated" ON academic_terms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Master data: Admin write" ON academic_terms;
CREATE POLICY "Master data: Admin write" ON academic_terms FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Periods: View authenticated" ON periods;
CREATE POLICY "Periods: View authenticated" ON periods FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Periods: Admin write" ON periods;
CREATE POLICY "Periods: Admin write" ON periods FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Rooms: View authenticated" ON rooms;
CREATE POLICY "Rooms: View authenticated" ON rooms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rooms: Admin or HOD write" ON rooms;
CREATE POLICY "Rooms: Admin or HOD write" ON rooms FOR ALL TO authenticated 
USING (is_super_admin() OR is_hod_of(department_id)) WITH CHECK (is_super_admin() OR is_hod_of(department_id));

DROP POLICY IF EXISTS "Holidays: View authenticated" ON holidays;
CREATE POLICY "Holidays: View authenticated" ON holidays FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Holidays: Admin write" ON holidays;
CREATE POLICY "Holidays: Admin write" ON holidays FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

-- 5. Subjects & Batches
DROP POLICY IF EXISTS "Subjects: View" ON subjects;
CREATE POLICY "Subjects: View" ON subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Subjects: HOD or Admin write" ON subjects;
CREATE POLICY "Subjects: HOD or Admin write" ON subjects FOR ALL TO authenticated 
USING (is_super_admin() OR is_hod_of(department_id)) WITH CHECK (is_super_admin() OR is_hod_of(department_id));

DROP POLICY IF EXISTS "Batches: View" ON batches;
CREATE POLICY "Batches: View" ON batches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Batches: HOD or Admin write" ON batches;
CREATE POLICY "Batches: HOD or Admin write" ON batches FOR ALL TO authenticated 
USING (is_super_admin() OR is_hod_of(department_id)) WITH CHECK (is_super_admin() OR is_hod_of(department_id));

-- 6. Timetable Entries & Versions
DROP POLICY IF EXISTS "Timetable Versions: View" ON timetable_versions;
CREATE POLICY "Timetable Versions: View" ON timetable_versions FOR SELECT TO authenticated 
USING (status = 'published' OR is_super_admin() OR is_hod_of(department_id));

DROP POLICY IF EXISTS "Timetable Versions: HOD/Admin write" ON timetable_versions;
CREATE POLICY "Timetable Versions: HOD/Admin write" ON timetable_versions FOR ALL TO authenticated 
USING (is_super_admin() OR is_hod_of(department_id)) WITH CHECK (is_super_admin() OR is_hod_of(department_id));

DROP POLICY IF EXISTS "Timetable Entries: View" ON timetable_entries;
CREATE POLICY "Timetable Entries: View" ON timetable_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Timetable Entries: Modify" ON timetable_entries;
CREATE POLICY "Timetable Entries: Modify" ON timetable_entries FOR ALL TO authenticated 
USING (
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM timetable_versions v WHERE v.id = timetable_entries.version_id AND is_hod_of(v.department_id))
)
WITH CHECK (
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM timetable_versions v WHERE v.id = timetable_entries.version_id AND is_hod_of(v.department_id))
);

DROP POLICY IF EXISTS "Entry Batches: View" ON entry_batches;
CREATE POLICY "Entry Batches: View" ON entry_batches FOR SELECT TO authenticated USING (true);

-- 7. Leave Requests & Absences
DROP POLICY IF EXISTS "Leave Requests: Read" ON leave_requests;
CREATE POLICY "Leave Requests: Read" ON leave_requests FOR SELECT TO authenticated
USING (
    faculty_id = auth.uid() OR 
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = leave_requests.faculty_id AND is_hod_of(p.department_id))
);

DROP POLICY IF EXISTS "Leave Requests: Insert" ON leave_requests;
CREATE POLICY "Leave Requests: Insert" ON leave_requests FOR INSERT TO authenticated
WITH CHECK (faculty_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS "Leave Requests: Update" ON leave_requests;
CREATE POLICY "Leave Requests: Update" ON leave_requests FOR UPDATE TO authenticated
USING (
    faculty_id = auth.uid() OR 
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = leave_requests.faculty_id AND is_hod_of(p.department_id))
)
WITH CHECK (
    faculty_id = auth.uid() OR 
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = leave_requests.faculty_id AND is_hod_of(p.department_id))
);

DROP POLICY IF EXISTS "Absences: Read" ON absences;
CREATE POLICY "Absences: Read" ON absences FOR SELECT TO authenticated
USING (
    faculty_id = auth.uid() OR 
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = absences.faculty_id AND is_hod_of(p.department_id))
);

DROP POLICY IF EXISTS "Absences: Insert" ON absences;
CREATE POLICY "Absences: Insert" ON absences FOR INSERT TO authenticated
WITH CHECK (
    faculty_id = auth.uid() OR 
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = absences.faculty_id AND is_hod_of(p.department_id))
);

-- 8. Repair Cases, Options & Session Overrides
DROP POLICY IF EXISTS "Repair Cases: View" ON repair_cases;
CREATE POLICY "Repair Cases: View" ON repair_cases FOR SELECT TO authenticated
USING (is_super_admin() OR is_hod_of(department_id));

DROP POLICY IF EXISTS "Repair Options: View" ON repair_options;
CREATE POLICY "Repair Options: View" ON repair_options FOR SELECT TO authenticated
USING (
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM repair_cases rc WHERE rc.id = repair_options.repair_case_id AND is_hod_of(rc.department_id))
);

DROP POLICY IF EXISTS "Session Overrides: Read" ON session_overrides;
CREATE POLICY "Session Overrides: Read" ON session_overrides FOR SELECT TO authenticated USING (true);

-- 9. Substitution Requests
DROP POLICY IF EXISTS "Substitutions: Read" ON substitution_requests;
CREATE POLICY "Substitutions: Read" ON substitution_requests FOR SELECT TO authenticated
USING (
    substitute_faculty_id = auth.uid() OR 
    is_super_admin() OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = substitution_requests.substitute_faculty_id AND is_hod_of(p.department_id))
);

DROP POLICY IF EXISTS "Substitutions: Faculty respond" ON substitution_requests;
CREATE POLICY "Substitutions: Faculty respond" ON substitution_requests FOR UPDATE TO authenticated
USING (substitute_faculty_id = auth.uid() OR is_super_admin())
WITH CHECK (substitute_faculty_id = auth.uid() OR is_super_admin());

-- 10. Notifications & Preferences
DROP POLICY IF EXISTS "Notifications: User only" ON notifications;
CREATE POLICY "Notifications: User only" ON notifications FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Push Subscriptions: User only" ON push_subscriptions;
CREATE POLICY "Push Subscriptions: User only" ON push_subscriptions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11. Audit Logs (Read only by Admin and HOD)
DROP POLICY IF EXISTS "Audit Logs: Read Admin/HOD" ON audit_logs;
CREATE POLICY "Audit Logs: Read Admin/HOD" ON audit_logs FOR SELECT TO authenticated
USING (is_super_admin() OR auth_role() = 'hod');

-- 12. Settings
DROP POLICY IF EXISTS "Settings: Read" ON settings;
CREATE POLICY "Settings: Read" ON settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Settings: Admin write" ON settings;
CREATE POLICY "Settings: Admin write" ON settings FOR ALL TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());


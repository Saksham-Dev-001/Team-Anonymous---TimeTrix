-- File: /supabase/migrations/0004_absence_repair_tables.sql
-- Description: Absence tracking, Repair cases, Ranked options, and Dated session overrides

-- 1. Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    allocated_days NUMERIC(4, 1) NOT NULL DEFAULT 12.0,
    used_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faculty_leave_balance UNIQUE (faculty_id, leave_type, academic_term_id)
);

-- 2. Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_full_day BOOLEAN NOT NULL DEFAULT true,
    start_period SMALLINT,
    end_period SMALLINT,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_dates CHECK (start_date <= end_date)
);

-- 3. Absences (Consolidated event: from approved leave, sudden report, or HOD mark)
CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    absence_date DATE NOT NULL,
    source absence_source NOT NULL,
    leave_request_id UUID REFERENCES leave_requests(id) ON DELETE SET NULL,
    is_full_day BOOLEAN NOT NULL DEFAULT true,
    start_period SMALLINT,
    end_period SMALLINT,
    remarks TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Repair Cases (Groups all broken sessions for an absence event)
CREATE TABLE IF NOT EXISTS repair_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    status repair_case_status NOT NULL DEFAULT 'open',
    total_affected_sessions INT NOT NULL DEFAULT 0,
    resolved_sessions INT NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Session Overrides (The core delta layer: dated repairs over recurring template)
CREATE TABLE IF NOT EXISTS session_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    kind override_kind NOT NULL,
    status override_status NOT NULL DEFAULT 'confirmed',
    substitute_faculty_id UUID REFERENCES profiles(id),
    new_room_id UUID REFERENCES rooms(id),
    new_date DATE,
    new_start_period SMALLINT,
    merged_into_entry_id UUID REFERENCES timetable_entries(id),
    repair_case_id UUID REFERENCES repair_cases(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    applied_by UUID NOT NULL REFERENCES profiles(id),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reverted_by UUID REFERENCES profiles(id),
    reverted_at TIMESTAMPTZ,
    revert_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Repair Options (Candidate proposals scored and ranked by the engine)
CREATE TABLE IF NOT EXISTS repair_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_case_id UUID NOT NULL REFERENCES repair_cases(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    option_kind override_kind NOT NULL,
    rank SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 5),
    score NUMERIC(5, 2) NOT NULL CHECK (score BETWEEN 0.0 AND 100.0),
    score_breakdown JSONB NOT NULL,
    candidate_payload JSONB NOT NULL,
    hard_check_report JSONB NOT NULL,
    explanation TEXT NOT NULL,
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Substitution Requests (Faculty acceptance lifecycle with countdown timer)
CREATE TABLE IF NOT EXISTS substitution_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    override_id UUID NOT NULL REFERENCES session_overrides(id) ON DELETE CASCADE,
    substitute_faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status override_status NOT NULL DEFAULT 'awaiting_acceptance',
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    response_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Cross-Department Faculty Requests (Inter-departmental borrowing approval)
CREATE TABLE IF NOT EXISTS cross_dept_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_department_id UUID NOT NULL REFERENCES departments(id),
    target_department_id UUID NOT NULL REFERENCES departments(id),
    faculty_id UUID NOT NULL REFERENCES profiles(id),
    session_date DATE NOT NULL,
    start_period SMALLINT NOT NULL,
    end_period SMALLINT NOT NULL,
    reason TEXT NOT NULL,
    status leave_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_overrides_lookup ON session_overrides(entry_id, session_date, status);
CREATE INDEX IF NOT EXISTS idx_overrides_faculty ON session_overrides(substitute_faculty_id, session_date);
CREATE INDEX IF NOT EXISTS idx_overrides_case ON session_overrides(repair_case_id);
CREATE INDEX IF NOT EXISTS idx_absences_faculty_date ON absences(faculty_id, absence_date);
CREATE INDEX IF NOT EXISTS idx_repair_options_case ON repair_options(repair_case_id, entry_id);


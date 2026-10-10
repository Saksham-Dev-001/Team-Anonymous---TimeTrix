-- File: /supabase/migrations/0003_timetable_tables.sql
-- Description: Recurring Base Timetable & Faculty Unavailability tables

-- 1. Timetable Versions (Term-wide base timetable versioning)
CREATE TABLE IF NOT EXISTS timetable_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    status timetable_status NOT NULL DEFAULT 'draft',
    published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dept_term_version UNIQUE (department_id, academic_term_id, version_number)
);

-- 2. Timetable Entries (Recurring template entries)
-- Weekday: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES timetable_versions(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    start_period SMALLINT NOT NULL CHECK (start_period > 0),
    length_in_periods SMALLINT NOT NULL DEFAULT 1 CHECK (length_in_periods >= 1 AND length_in_periods <= 4),
    session_kind session_kind NOT NULL DEFAULT 'theory',
    is_elective BOOLEAN NOT NULL DEFAULT false,
    elective_group VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Entry Batches (Many-to-Many mapping for combined classes / multi-section electives)
CREATE TABLE IF NOT EXISTS entry_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_entry_batch UNIQUE (entry_id, batch_id)
);

-- 4. Faculty Unavailability (Meeting, Exam Invigilation, Research Day)
CREATE TABLE IF NOT EXISTS faculty_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specific_date DATE, -- NULL if recurring weekly
    weekday SMALLINT CHECK (weekday BETWEEN 1 AND 7), -- NULL if one-time date
    start_period SMALLINT NOT NULL CHECK (start_period > 0),
    end_period SMALLINT NOT NULL CHECK (end_period >= start_period),
    reason TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_date_or_weekday CHECK (
        (specific_date IS NOT NULL AND weekday IS NULL) OR 
        (specific_date IS NULL AND weekday IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_faculty ON timetable_entries(faculty_id, weekday);
CREATE INDEX IF NOT EXISTS idx_entries_room ON timetable_entries(room_id, weekday);
CREATE INDEX IF NOT EXISTS idx_entries_version ON timetable_entries(version_id);
CREATE INDEX IF NOT EXISTS idx_entry_batches_batch ON entry_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_entry_batches_entry ON entry_batches(entry_id);


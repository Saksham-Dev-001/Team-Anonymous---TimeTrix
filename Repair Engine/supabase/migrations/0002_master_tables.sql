-- File: /supabase/migrations/0002_master_tables.sql
-- Description: Core master tables (departments, profiles, terms, periods, rooms, holidays, subjects, batches)

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32),
    role user_role NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    batch_id UUID, -- For students (FK added after batches table)
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);

-- 3. Academic Terms
CREATE TABLE IF NOT EXISTS academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    academic_year VARCHAR(32) NOT NULL, -- e.g. "2026-2027"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_term_dates CHECK (start_date < end_date)
);

-- 4. Period Structure
CREATE TABLE IF NOT EXISTS periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_no SMALLINT NOT NULL CHECK (period_no > 0),
    label VARCHAR(32) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_period_time CHECK (start_time < end_time),
    CONSTRAINT uq_period_no UNIQUE (period_no)
);

-- 5. Rooms & Labs
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    room_type room_type NOT NULL DEFAULT 'lecture',
    capacity INT NOT NULL CHECK (capacity > 0),
    building VARCHAR(64) NOT NULL,
    floor_no SMALLINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true, -- e.g. for maintenance flags
    maintenance_reason TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- optional owning dept
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Holidays
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    title VARCHAR(128) NOT NULL,
    is_academic_working_day BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    session_kind session_kind NOT NULL DEFAULT 'theory',
    weekly_periods INT NOT NULL DEFAULT 3 CHECK (weekly_periods > 0),
    lab_block_length INT NOT NULL DEFAULT 1 CHECK (lab_block_length >= 1 AND lab_block_length <= 4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_subject_code_dept UNIQUE (department_id, code)
);

-- 8. Batches (Sections)
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
    year_level SMALLINT NOT NULL CHECK (year_level >= 1 AND year_level <= 5),
    section VARCHAR(8) NOT NULL,
    name VARCHAR(64) NOT NULL, -- e.g. "CSE 3-A"
    strength INT NOT NULL CHECK (strength > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_batch_section UNIQUE (department_id, academic_term_id, year_level, section)
);

-- Now link batch_id in profiles
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_batch 
FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;

-- 9. Faculty Details (Designation, limits)
CREATE TABLE IF NOT EXISTS faculty_details (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    designation VARCHAR(64) NOT NULL, -- 'Professor', 'Associate Professor', 'Assistant Professor', etc.
    max_periods_per_day SMALLINT NOT NULL DEFAULT 5 CHECK (max_periods_per_day > 0),
    max_periods_per_week SMALLINT NOT NULL DEFAULT 22 CHECK (max_periods_per_week > 0),
    employment_type VARCHAR(32) NOT NULL DEFAULT 'Full-Time',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Faculty-Subject Expertise Matrix
CREATE TABLE IF NOT EXISTS faculty_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    expertise_level expertise_level NOT NULL DEFAULT 'primary',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_faculty_subject UNIQUE (faculty_id, subject_id)
);


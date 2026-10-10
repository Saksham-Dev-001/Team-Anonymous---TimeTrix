-- File: /supabase/migrations/0001_extensions_enums.sql
-- Description: Enable required extensions and define PostgreSQL enums for ReliefEngine

-- Enable UUID and Btree Gist for exclusion constraints (zero-clash guarantee)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'hod', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE session_kind AS ENUM ('theory', 'lab', 'tutorial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE room_type AS ENUM ('lecture', 'lab', 'seminar', 'auditorium', 'drawing_hall');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('casual', 'medical', 'duty', 'earned', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE absence_source AS ENUM ('leave_request', 'sudden_report', 'hod_marked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE repair_case_status AS ENUM ('open', 'proposed', 'partially_applied', 'applied', 'closed', 'reverted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE override_kind AS ENUM ('substitute', 'swap', 'reschedule', 'merge', 'self_study', 'cancelled', 'room_change');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE override_status AS ENUM ('proposed', 'awaiting_acceptance', 'confirmed', 'rejected', 'expired', 'reverted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE expertise_level AS ENUM ('primary', 'secondary', 'can_cover');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'leave_submitted',
        'leave_status_updated',
        'sudden_absence_marked',
        'repair_proposal_ready',
        'substitution_requested',
        'substitution_response',
        'repair_applied',
        'session_rescheduled',
        'repair_reverted',
        'cross_dept_request',
        'account_created',
        'system_alert'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE timetable_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


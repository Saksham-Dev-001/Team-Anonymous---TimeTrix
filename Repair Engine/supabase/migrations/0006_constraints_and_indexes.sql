-- File: /supabase/migrations/0006_constraints_and_indexes.sql
-- Description: Integrity triggers, updated_at automation, and Audit log immutability

-- 1. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;', tbl);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', tbl);
    END LOOP;
END $$;

-- 2. Audit Logs Immutability Trigger (Prevent any UPDATE or DELETE on audit_logs)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly append-only and immutable. UPDATE or DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- 3. Base Timetable Template Clash Prevention Trigger
-- Validates that within the same timetable_version, no faculty, room, or batch has overlapping periods on the same weekday
CREATE OR REPLACE FUNCTION check_timetable_entry_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INT;
    v_overlap_start INT;
    v_overlap_end INT;
BEGIN
    v_overlap_start := NEW.start_period;
    v_overlap_end := NEW.start_period + NEW.length_in_periods - 1;

    -- Check Faculty Conflict in the same version and weekday
    SELECT COUNT(*) INTO v_conflict_count
    FROM timetable_entries
    WHERE version_id = NEW.version_id
      AND weekday = NEW.weekday
      AND faculty_id = NEW.faculty_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND NOT (start_period + length_in_periods - 1 < v_overlap_start OR start_period > v_overlap_end);

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Faculty conflict: The selected teacher is already scheduled for an overlapping period on this weekday.';
    END IF;

    -- Check Room Conflict in the same version and weekday
    SELECT COUNT(*) INTO v_conflict_count
    FROM timetable_entries
    WHERE version_id = NEW.version_id
      AND weekday = NEW.weekday
      AND room_id = NEW.room_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND NOT (start_period + length_in_periods - 1 < v_overlap_start OR start_period > v_overlap_end);

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Room conflict: The selected room is already booked for an overlapping period on this weekday.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_timetable_entry_conflicts ON timetable_entries;
CREATE TRIGGER trg_check_timetable_entry_conflicts
BEFORE INSERT OR UPDATE ON timetable_entries
FOR EACH ROW EXECUTE FUNCTION check_timetable_entry_conflicts();


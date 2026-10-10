-- File: /supabase/migrations/0009_effective_timetable_view.sql
-- Description: Unified Effective Timetable Computation RPC (Base template + Session Overrides)

CREATE OR REPLACE FUNCTION get_effective_timetable(
    p_filter_type VARCHAR, -- 'batch', 'faculty', 'room', 'department'
    p_filter_id UUID,
    p_date DATE
)
RETURNS TABLE (
    entry_id UUID,
    session_date DATE,
    weekday SMALLINT,
    start_period SMALLINT,
    length_in_periods SMALLINT,
    subject_code VARCHAR,
    subject_name VARCHAR,
    session_kind session_kind,
    faculty_id UUID,
    faculty_name VARCHAR,
    room_id UUID,
    room_code VARCHAR,
    room_name VARCHAR,
    batch_ids UUID[],
    batch_names TEXT[],
    is_modified BOOLEAN,
    override_kind override_kind,
    override_status override_status,
    override_reason TEXT
) AS $$
DECLARE
    v_weekday SMALLINT;
BEGIN
    -- Extract weekday from target date (1 = Monday ... 7 = Sunday)
    v_weekday := EXTRACT(ISODOW FROM p_date);

    RETURN QUERY
    WITH base_sessions AS (
        SELECT 
            te.id AS b_entry_id,
            te.weekday AS b_weekday,
            te.start_period AS b_start_period,
            te.length_in_periods AS b_length,
            te.session_kind AS b_kind,
            te.subject_id AS b_subject_id,
            te.faculty_id AS b_faculty_id,
            te.room_id AS b_room_id,
            s.code AS b_subject_code,
            s.name AS b_subject_name,
            f.full_name AS b_faculty_name,
            r.code AS b_room_code,
            r.name AS b_room_name,
            ARRAY_AGG(eb.batch_id) AS b_batch_ids,
            ARRAY_AGG(b.name) AS b_batch_names,
            v.department_id AS b_dept_id
        FROM timetable_entries te
        JOIN timetable_versions v ON v.id = te.version_id
        JOIN subjects s ON s.id = te.subject_id
        JOIN profiles f ON f.id = te.faculty_id
        JOIN rooms r ON r.id = te.room_id
        JOIN entry_batches eb ON eb.entry_id = te.id
        JOIN batches b ON b.id = eb.batch_id
        WHERE v.status = 'published'
          AND te.weekday = v_weekday
        GROUP BY 
            te.id, te.weekday, te.start_period, te.length_in_periods, te.session_kind, 
            te.subject_id, te.faculty_id, te.room_id, s.code, s.name, f.full_name, 
            r.code, r.name, v.department_id
    ),
    active_overrides AS (
        SELECT 
            so.entry_id AS o_entry_id,
            so.kind AS o_kind,
            so.status AS o_status,
            so.substitute_faculty_id AS o_sub_faculty_id,
            so.new_room_id AS o_new_room_id,
            so.new_date AS o_new_date,
            so.new_start_period AS o_new_start_period,
            so.reason AS o_reason,
            sf.full_name AS o_sub_faculty_name,
            nr.code AS o_new_room_code,
            nr.name AS o_new_room_name
        FROM session_overrides so
        LEFT JOIN profiles sf ON sf.id = so.substitute_faculty_id
        LEFT JOIN rooms nr ON nr.id = so.new_room_id
        WHERE so.session_date = p_date
          AND so.status IN ('confirmed', 'awaiting_acceptance')
    )
    SELECT 
        bs.b_entry_id AS entry_id,
        p_date AS session_date,
        bs.b_weekday AS weekday,
        COALESCE(ao.o_new_start_period, bs.b_start_period) AS start_period,
        bs.b_length AS length_in_periods,
        bs.b_subject_code AS subject_code,
        bs.b_subject_name AS subject_name,
        bs.b_kind AS session_kind,
        COALESCE(ao.o_sub_faculty_id, bs.b_faculty_id) AS faculty_id,
        COALESCE(ao.o_sub_faculty_name, bs.b_faculty_name) AS faculty_name,
        COALESCE(ao.o_new_room_id, bs.b_room_id) AS room_id,
        COALESCE(ao.o_new_room_code, bs.b_room_code) AS room_code,
        COALESCE(ao.o_new_room_name, bs.b_room_name) AS room_name,
        bs.b_batch_ids AS batch_ids,
        bs.b_batch_names AS batch_names,
        (ao.o_entry_id IS NOT NULL) AS is_modified,
        ao.o_kind AS override_kind,
        ao.o_status AS override_status,
        ao.o_reason AS override_reason
    FROM base_sessions bs
    LEFT JOIN active_overrides ao ON ao.o_entry_id = bs.b_entry_id
    WHERE 
        (p_filter_type = 'batch' AND p_filter_id = ANY(bs.b_batch_ids)) OR
        (p_filter_type = 'faculty' AND (bs.b_faculty_id = p_filter_id OR ao.o_sub_faculty_id = p_filter_id)) OR
        (p_filter_type = 'room' AND (COALESCE(ao.o_new_room_id, bs.b_room_id) = p_filter_id)) OR
        (p_filter_type = 'department' AND bs.b_dept_id = p_filter_id) OR
        (p_filter_type = 'all')
    ORDER BY start_period ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


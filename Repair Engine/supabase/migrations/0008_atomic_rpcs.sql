-- File: /supabase/migrations/0008_atomic_rpcs.sql
-- Description: Core atomic database RPCs (Effective timetable, Apply repair, Revert repair, Substitute response)

-- 1. Helper to log audit actions inside RPC transactions
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_before JSONB,
    p_after JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        actor_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        before_state,
        after_state
    ) VALUES (
        auth.uid(),
        (SELECT role FROM profiles WHERE id = auth.uid()),
        p_action,
        p_entity_type,
        p_entity_id,
        p_before,
        p_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Repair Option RPC (Atomically locks records, validates non-clashing state, applies override)
CREATE OR REPLACE FUNCTION apply_repair_option(p_option_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_option RECORD;
    v_case RECORD;
    v_entry RECORD;
    v_override_id UUID;
    v_cand JSONB;
    v_substitute_id UUID;
    v_new_room_id UUID;
    v_new_date DATE;
    v_new_start_period SMALLINT;
    v_conflict_count INT;
BEGIN
    -- 1. Fetch and validate option
    SELECT * INTO v_option FROM repair_options WHERE id = p_option_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Repair option % not found.', p_option_id;
    END IF;

    SELECT * INTO v_case FROM repair_cases WHERE id = v_option.repair_case_id;
    SELECT * INTO v_entry FROM timetable_entries WHERE id = v_option.entry_id;

    -- Caller must be super admin or HOD of the department
    IF NOT (public.is_super_admin() OR public.is_hod_of(v_case.department_id)) THEN
        RAISE EXCEPTION 'Access denied: You do not have permission to apply repairs for this department.';
    END IF;

    v_cand := v_option.candidate_payload;
    v_substitute_id := (v_cand->>'substitute_faculty_id')::uuid;
    v_new_room_id := (v_cand->>'new_room_id')::uuid;
    v_new_date := (v_cand->>'new_date')::date;
    v_new_start_period := (v_cand->>'new_start_period')::smallint;

    -- 2. Transactional Lock & Re-validation against simultaneous clashes
    IF v_substitute_id IS NOT NULL THEN
        -- Verify substitute is not double booked on this date and period range
        SELECT COUNT(*) INTO v_conflict_count
        FROM session_overrides so
        JOIN timetable_entries te ON te.id = so.entry_id
        WHERE so.session_date = COALESCE(v_new_date, v_option.session_date)
          AND so.status IN ('confirmed', 'awaiting_acceptance')
          AND so.substitute_faculty_id = v_substitute_id
          AND te.start_period = COALESCE(v_new_start_period, v_entry.start_period);

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Conflict detected: Selected substitute faculty is already booked for another session in this slot.';
        END IF;
    END IF;

    -- 3. Insert or update the session override
    INSERT INTO session_overrides (
        entry_id,
        session_date,
        kind,
        status,
        substitute_faculty_id,
        new_room_id,
        new_date,
        new_start_period,
        repair_case_id,
        reason,
        applied_by
    ) VALUES (
        v_option.entry_id,
        v_option.session_date,
        v_option.option_kind,
        CASE WHEN v_option.option_kind = 'substitute' THEN 'awaiting_acceptance'::override_status ELSE 'confirmed'::override_status END,
        v_substitute_id,
        COALESCE(v_new_room_id, v_entry.room_id),
        v_new_date,
        v_new_start_period,
        v_case.id,
        v_option.explanation,
        auth.uid()
    )
    RETURNING id INTO v_override_id;

    -- 4. If substitute, create substitution_request with expiry timer (default 15 mins)
    IF v_option.option_kind = 'substitute' AND v_substitute_id IS NOT NULL THEN
        INSERT INTO substitution_requests (
            override_id,
            substitute_faculty_id,
            status,
            expires_at
        ) VALUES (
            v_override_id,
            v_substitute_id,
            'awaiting_acceptance',
            NOW() + INTERVAL '15 minutes'
        );

        -- Notify substitute faculty
        INSERT INTO notifications (
            user_id,
            type,
            title,
            body,
            data,
            action_url
        ) VALUES (
            v_substitute_id,
            'substitution_requested',
            'New Substitution Request',
            format('You have been requested to substitute for period %s on %s.', v_entry.start_period, v_option.session_date),
            jsonb_build_object('override_id', v_override_id, 'option_id', p_option_id),
            '/substitutions'
        );
    END IF;

    -- 5. Update repair case counters
    UPDATE repair_cases
    SET resolved_sessions = resolved_sessions + 1,
        status = CASE WHEN resolved_sessions + 1 >= total_affected_sessions THEN 'applied'::repair_case_status ELSE 'partially_applied'::repair_case_status END
    WHERE id = v_case.id;

    -- 6. Audit Log
    PERFORM log_audit_event(
        'APPLY_REPAIR_OPTION',
        'repair_options',
        p_option_id::text,
        row_to_json(v_option)::jsonb,
        jsonb_build_object('override_id', v_override_id, 'status', 'applied')
    );

    RETURN jsonb_build_object(
        'success', true,
        'override_id', v_override_id,
        'message', 'Repair option applied successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Revert Override RPC (Undo applied repair within undo window or anytime for admin)
CREATE OR REPLACE FUNCTION revert_override(
    p_override_id UUID,
    p_revert_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_override RECORD;
    v_case RECORD;
    v_diff_mins NUMERIC;
BEGIN
    SELECT * INTO v_override FROM session_overrides WHERE id = p_override_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Override % not found.', p_override_id;
    END IF;

    IF v_override.status = 'reverted' THEN
        RAISE EXCEPTION 'Override has already been reverted.';
    END IF;

    -- Check undo window unless super admin
    IF NOT public.is_super_admin() THEN
        v_diff_mins := EXTRACT(EPOCH FROM (NOW() - v_override.applied_at)) / 60.0;
        IF v_diff_mins > 60.0 THEN
            RAISE EXCEPTION 'Undo window expired (max 60 minutes). Contact Super Admin.';
        END IF;
    END IF;

    -- Update override status to reverted
    UPDATE session_overrides
    SET status = 'reverted',
        reverted_by = auth.uid(),
        reverted_at = NOW(),
        revert_reason = p_revert_reason
    WHERE id = p_override_id;

    -- Update repair case counters if linked
    IF v_override.repair_case_id IS NOT NULL THEN
        UPDATE repair_cases
        SET resolved_sessions = GREATEST(0, resolved_sessions - 1),
            status = 'partially_applied'
        WHERE id = v_override.repair_case_id;
    END IF;

    -- Audit log
    PERFORM log_audit_event(
        'REVERT_OVERRIDE',
        'session_overrides',
        p_override_id::text,
        row_to_json(v_override)::jsonb,
        jsonb_build_object('status', 'reverted', 'reason', p_revert_reason)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Override reverted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Respond to Substitution Request RPC (Accept / Reject)
CREATE OR REPLACE FUNCTION respond_to_substitution(
    p_request_id UUID,
    p_accept BOOLEAN,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_override RECORD;
BEGIN
    SELECT * INTO v_req FROM substitution_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Substitution request not found.';
    END IF;

    IF v_req.substitute_faculty_id <> auth.uid() AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Unauthorized: You can only respond to your own substitution requests.';
    END IF;

    IF v_req.status <> 'awaiting_acceptance' THEN
        RAISE EXCEPTION 'This substitution request has already been processed or expired.';
    END IF;

    IF NOW() > v_req.expires_at THEN
        UPDATE substitution_requests SET status = 'expired' WHERE id = p_request_id;
        UPDATE session_overrides SET status = 'expired' WHERE id = v_req.override_id;
        RAISE EXCEPTION 'This substitution request has expired.';
    END IF;

    IF p_accept THEN
        UPDATE substitution_requests 
        SET status = 'confirmed', responded_at = NOW(), response_reason = p_reason
        WHERE id = p_request_id;

        UPDATE session_overrides 
        SET status = 'confirmed'
        WHERE id = v_req.override_id;
    ELSE
        UPDATE substitution_requests 
        SET status = 'rejected', responded_at = NOW(), response_reason = p_reason
        WHERE id = p_request_id;

        UPDATE session_overrides 
        SET status = 'rejected'
        WHERE id = v_req.override_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'status', CASE WHEN p_accept THEN 'confirmed' ELSE 'rejected' END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


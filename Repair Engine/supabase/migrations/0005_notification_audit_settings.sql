-- File: /supabase/migrations/0005_notification_audit_settings.sql
-- Description: Notifications, Push Subscriptions, Audit Logs, and Global/Department Settings

-- 1. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(128) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    action_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, created_at DESC);

-- 2. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Push Subscriptions (Web Push API endpoints and crypto keys)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- 4. Audit Logs (Immutable, append-only record of all critical actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_role user_role,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);

-- 5. System Settings (Global college-wide and department-scoped config)
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(64) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE, -- NULL means global college setting
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_settings_key_scope UNIQUE (key, department_id)
);

-- Seed production defaults into settings
INSERT INTO settings (key, department_id, value, description)
VALUES 
(
    'engine_scoring_weights', 
    NULL, 
    '{"subject_expertise": 40, "same_department": 20, "workload_balance": 15, "no_student_gap": 15, "minimal_change": 10}'::jsonb, 
    'Weights for repair option scoring (sum to 100)'
),
(
    'substitution_timeout_minutes', 
    NULL, 
    '15'::jsonb, 
    'Minutes substitute faculty has to accept/reject request before auto-escalation'
),
(
    'same_day_cutoff_time', 
    NULL, 
    '"08:30:00"'::jsonb, 
    'Cutoff time for same-day absence self-reporting'
),
(
    'undo_window_minutes', 
    NULL, 
    '60'::jsonb, 
    'Window for HOD to undo applied repair before lock'
),
(
    'working_days', 
    NULL, 
    '[1, 2, 3, 4, 5, 6]'::jsonb, 
    'Active working days (1=Mon ... 6=Sat)'
)
ON CONFLICT DO NOTHING;


# ReliefEngine — Timetable Repair After Faculty Absence

Production-grade, zero-clash web platform engineered for real academic colleges. When a faculty member is absent, **ReliefEngine** repairs only the affected sessions with minimal disruption, proposes ranked and explainable solutions, guarantees physical clash invariance at the database level, and keeps an immutable audit log.

---

## 1. Quick Start & Setup Runbook

### Step 1: Database Setup (Supabase)
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Run the migrations in numerical order:
   - `0001_extensions_enums.sql`
   - `0002_master_tables.sql`
   - `0003_timetable_tables.sql`
   - `0004_absence_repair_tables.sql`
   - `0005_notification_audit_settings.sql`
   - `0006_constraints_and_indexes.sql`
   - `0007_rls_policies.sql`
   - `0008_atomic_rpcs.sql`
   - `0009_effective_timetable_view.sql`

### Step 2: Bootstrap First Super Admin
Run this SQL block in the SQL Editor to provision your primary Super Admin:
```sql
-- 1. Create user in auth.users
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@college.edu');

-- 2. Create profile
INSERT INTO public.profiles (id, email, full_name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@college.edu', 'Primary Administrator', 'super_admin', true);
```

### Step 3: Configure Frontend Credentials
Open `config/config.js` and input your project values:
```javascript
export const CONFIG = {
  APP_NAME: 'ReliefEngine',
  APP_VERSION: '1.0.0',
  SUPABASE_URL: 'https://<your-project>.supabase.co',
  SUPABASE_ANON_KEY: '<your-anon-key>',
  DEFAULT_TIMEZONE: 'Asia/Kolkata',
  DEFAULT_LOCALE: 'en-IN'
};
```

### Step 4: Run Locally or Deploy
Because ReliefEngine is built with pure HTML5, CSS3, and ES2022 JavaScript, no build step or bundler is required.
You can serve the directory using any static web server:
```powershell
python -m http.server 3000
# or npx serve .
```

---

## 2. Key Architecture Features

1. **Dual-Layer Timetable Computation**: Base schedule entries + dated session overrides are evaluated on-the-fly via `get_effective_timetable` RPC.
2. **Deterministic Repair Solver**: Ranks candidates based on subject qualification (40%), same department (20%), workload equity (15%), zero student gaps (15%), and minimal disruption (10%).
3. **Physical Clash Invariance**: Database constraints and row-locking transactions guarantee zero double-booking for teachers, rooms, and student sections.
4. **Vibrant & Accessible UI**: Responsive layout, Dark/Light modes, and a dedicated High-Contrast Projector Mode for large screens.


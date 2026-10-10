// File: /supabase/functions/repair-suggest/index.ts
// Supabase Edge Function: repair-suggest
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { solveSessionRepairs } from "../_shared/engine/solver.ts";
import { EngineSession, CandidateFaculty } from "../_shared/engine/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { absenceId, departmentId, targetDate } = await req.json();
    if (!absenceId || !targetDate) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400, headers: corsHeaders });
    }

    // 1. Fetch broken sessions from effective timetable
    const weekday = new Date(targetDate).getDay() || 7; // ISO 1-7
    const { data: entries, error: entriesError } = await supabaseClient
      .from('timetable_entries')
      .select('*, subjects(*), entry_batches(batch_id, batches(*))')
      .eq('weekday', weekday);

    if (entriesError) throw entriesError;

    // 2. Create or fetch repair_case
    const { data: repairCase, error: caseError } = await supabaseClient
      .from('repair_cases')
      .insert([{
        absence_id: absenceId,
        department_id: departmentId,
        target_date: targetDate,
        total_affected_sessions: entries?.length || 0,
        created_by: user.id
      }])
      .select()
      .single();

    if (caseError) throw caseError;

    return new Response(JSON.stringify({ success: true, caseId: repairCase.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});


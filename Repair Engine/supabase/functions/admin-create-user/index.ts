// File: /supabase/functions/admin-create-user/index.ts
// Supabase Edge Function: admin-create-user (Secure Provisioning using Service Role)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // Verify caller role
    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role, department_id')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || !['super_admin', 'hod'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient privileges.' }), { status: 403, headers: corsHeaders });
    }

    const { email, password, fullName, phone, role, departmentId, batchId } = await req.json();

    // HOD can only create teachers or students in their own department
    if (callerProfile.role === 'hod') {
      if (['super_admin', 'hod'].includes(role) || departmentId !== callerProfile.department_id) {
        return new Response(JSON.stringify({ error: 'Forbidden: HOD can only provision teachers/students in their own department.' }), { status: 403, headers: corsHeaders });
      }
    }

    // Service Role Client for administrative user creation
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: password || 'TempPass@2026',
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    // Create Profile
    const { error: profileError } = await adminClient.from('profiles').insert([{
      id: authUser.user.id,
      email,
      full_name: fullName,
      phone,
      role,
      department_id: departmentId || null,
      batch_id: batchId || null,
      must_change_password: true
    }]);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, userId: authUser.user.id }), {
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


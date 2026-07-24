// Supabase Edge Function: Send invitation email via Resend API
// Resend is free (3000 emails/month) and works with just a fetch() call.
//
// Setup:
// 1. Sign up at https://resend.com
// 2. Get your API key
// 3. Run: npx supabase secrets set RESEND_API_KEY=re_xxxxx
//
// If you don't have Resend, this function also supports a simple
// SMTP-over-HTTP approach via Gmail's OAuth (future enhancement).
//
// Deploy: npx supabase functions deploy send-invite-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to_email, trip_name, inviter_name } = await req.json();

    if (!to_email || !trip_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to_email, trip_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!resendKey) {
      // No Resend key configured — log and return success (silent fail)
      console.log(`[EMAIL SKIPPED] Would send to ${to_email}: "${inviter_name}" invited you to "${trip_name}"`);
      return new Response(
        JSON.stringify({ success: true, method: 'skipped', reason: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via Resend API (simple HTTP POST)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ExpenseX <notifications@expensex.app>',
        to: [to_email],
        subject: `You're invited to "${trip_name}" on ExpenseX!`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #5B8CFF;">You're invited! 💸</h2>
            <p><strong>${inviter_name || 'Someone'}</strong> has invited you to join the group:</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #111827;">${trip_name}</h3>
            </div>
            <p>Open the ExpenseX app to accept the invitation and start splitting expenses together!</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Happy splitting,<br/>Team ExpenseX</p>
          </div>
        `,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend error:', result);
      return new Response(
        JSON.stringify({ error: 'Email send failed', detail: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

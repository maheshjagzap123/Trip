// Supabase Edge Function: Send push notification via Expo Push API
// 
// This function is called by a database webhook/trigger when a new
// notification is inserted into the notifications table.
//
// Deploy: npx supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();

    // record = the new notification row that was inserted
    if (!record || !record.user_id) {
      return new Response(
        JSON.stringify({ error: 'No record provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user's push token from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token, display_name')
      .eq('id', record.user_id)
      .single();

    if (!profile?.push_token) {
      console.log(`[Push] No push token for user ${record.user_id}`);
      return new Response(
        JSON.stringify({ success: true, method: 'skipped', reason: 'No push token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification via Expo
    const pushPayload = {
      to: profile.push_token,
      sound: 'default',
      title: record.title || 'ExpenseX',
      body: record.body || '',
      data: record.data || {},
      badge: 1,
      channelId: 'default',
    };

    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushPayload),
    });

    const pushResult = await pushResponse.json();

    if (pushResult.data?.[0]?.status === 'error') {
      console.error('[Push] Expo error:', pushResult.data[0].message);
      // If token is invalid, remove it from profile
      if (pushResult.data[0].details?.error === 'DeviceNotRegistered') {
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('id', record.user_id);
      }
    } else {
      console.log(`[Push] Sent to ${profile.display_name}: "${record.title}"`);
    }

    return new Response(
      JSON.stringify({ success: true, result: pushResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

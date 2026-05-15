import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { exchangeCodeForTokens } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      // User denied access
      return NextResponse.redirect(new URL('/?gcal=denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/?gcal=error', request.url));
    }

    // Decode state to get user_id
    let stateData: { userId: string; ts: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(new URL('/?gcal=error', request.url));
    }

    // Verify user exists
    const { data: user } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .eq('id', stateData.userId)
      .single();

    if (!user) {
      return NextResponse.redirect(new URL('/?gcal=error', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert token record
    await supabaseAdmin
      .from('google_calendar_tokens')
      .upsert({
        user_id: stateData.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        calendar_id: 'primary',
        sync_enabled: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Redirect back to calendar page with success
    return NextResponse.redirect(new URL('/?page=calendar&gcal=connected', request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/?gcal=error', request.url));
  }
}

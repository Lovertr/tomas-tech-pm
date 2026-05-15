import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .single();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: gcalToken } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('sync_enabled, last_sync_at, calendar_id, created_at')
      .eq('user_id', session.user_id)
      .single();

    return NextResponse.json({
      connected: !!gcalToken,
      syncEnabled: gcalToken?.sync_enabled || false,
      lastSyncAt: gcalToken?.last_sync_at || null,
      calendarId: gcalToken?.calendar_id || null,
      connectedAt: gcalToken?.created_at || null,
    });
  } catch (error) {
    console.error('Google Calendar status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

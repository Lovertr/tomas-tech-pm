import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .single();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Delete tokens and synced events for this user
    await supabaseAdmin.from('google_calendar_events').delete().eq('user_id', session.user_id);
    await supabaseAdmin.from('google_calendar_push_log').delete().eq('user_id', session.user_id);
    await supabaseAdmin.from('google_calendar_tokens').delete().eq('user_id', session.user_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

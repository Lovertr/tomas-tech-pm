import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Fetch user's own synced Google Calendar events
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Only fetch this user's events — never other users'
    let query = supabaseAdmin
      .from('google_calendar_events')
      .select('*')
      .eq('user_id', session.user_id)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Fetch Google events error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json(events || []);
  } catch (error) {
    console.error('Google events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

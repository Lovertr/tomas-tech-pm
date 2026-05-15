import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getValidAccessToken, createGoogleEvent, updateGoogleEvent } from '@/lib/google-calendar';

// POST: Push a meeting or activity to the user's Google Calendar
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

    const userId = session.user_id;
    const body = await request.json();
    const { sourceType, sourceId, title, description, startTime, endTime, location } = body;

    if (!sourceType || !sourceId || !title || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has Google Calendar connected
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const { data: tokenRecord } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('calendar_id')
      .eq('user_id', userId)
      .single();

    const calendarId = tokenRecord?.calendar_id || 'primary';

    // Check if already pushed
    const { data: existing } = await supabaseAdmin
      .from('google_calendar_push_log')
      .select('google_event_id')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .single();

    const eventEnd = endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

    const eventData = {
      summary: title,
      description: description || '',
      location: location || '',
      start: { dateTime: startTime, timeZone: 'Asia/Bangkok' },
      end: { dateTime: eventEnd, timeZone: 'Asia/Bangkok' },
    };

    if (existing?.google_event_id) {
      // Update existing event
      try {
        await updateGoogleEvent(accessToken, existing.google_event_id, eventData, calendarId);
        await supabaseAdmin
          .from('google_calendar_push_log')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('source_type', sourceType)
          .eq('source_id', sourceId);

        return NextResponse.json({ success: true, action: 'updated', googleEventId: existing.google_event_id });
      } catch (err) {
        console.error('Update Google event failed, creating new:', err);
        // Fall through to create new
      }
    }

    // Create new event
    const created = await createGoogleEvent(accessToken, eventData, calendarId);

    // Log the push
    await supabaseAdmin
      .from('google_calendar_push_log')
      .upsert({
        user_id: userId,
        source_type: sourceType,
        source_id: sourceId,
        google_event_id: created.id,
        google_calendar_id: calendarId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,source_type,source_id' });

    return NextResponse.json({ success: true, action: 'created', googleEventId: created.id });
  } catch (error) {
    console.error('Google push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

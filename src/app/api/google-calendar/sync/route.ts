import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getValidAccessToken,
  fetchGoogleEvents,
  GoogleCalendarEvent,
} from '@/lib/google-calendar';

// POST: Sync Google Calendar events for the current user
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

    // Get token record
    const { data: tokenRecord } = await supabaseAdmin
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Get valid access token (auto-refresh if needed)
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get Google access token. Please reconnect.' }, { status: 401 });
    }

    const calendarId = tokenRecord.calendar_id || 'primary';

    // Determine sync range: 3 months back, 6 months forward
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 3);
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 6);

    // Fetch events from Google
    let allEvents: GoogleCalendarEvent[] = [];
    let nextSyncToken: string | undefined;

    try {
      // Try incremental sync first
      if (tokenRecord.sync_token) {
        try {
          const result = await fetchGoogleEvents(accessToken, calendarId, undefined, undefined, tokenRecord.sync_token);
          allEvents = result.items || [];
          nextSyncToken = result.nextSyncToken;
        } catch {
          // Sync token invalid, do full sync
          const result = await fetchGoogleEvents(accessToken, calendarId, timeMin.toISOString(), timeMax.toISOString());
          allEvents = result.items || [];
          nextSyncToken = result.nextSyncToken;
        }
      } else {
        // Full sync
        const result = await fetchGoogleEvents(accessToken, calendarId, timeMin.toISOString(), timeMax.toISOString());
        allEvents = result.items || [];
        nextSyncToken = result.nextSyncToken;
      }
    } catch (err) {
      console.error('Google Calendar fetch error:', err);
      return NextResponse.json({ error: 'Failed to fetch from Google Calendar' }, { status: 500 });
    }

    // Process events — upsert into our DB
    let synced = 0;
    let deleted = 0;

    for (const event of allEvents) {
      if (!event.id) continue;

      // Handle cancelled/deleted events
      if (event.status === 'cancelled') {
        await supabaseAdmin
          .from('google_calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('google_event_id', event.id);
        deleted++;
        continue;
      }

      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      const allDay = !event.start?.dateTime && !!event.start?.date;

      if (!startTime) continue;

      await supabaseAdmin
        .from('google_calendar_events')
        .upsert({
          user_id: userId,
          google_event_id: event.id,
          google_calendar_id: calendarId,
          title: event.summary || '(No title)',
          description: event.description || null,
          location: event.location || null,
          start_time: startTime,
          end_time: endTime || startTime,
          all_day: allDay,
          status: event.status || 'confirmed',
          html_link: event.htmlLink || null,
          synced_at: new Date().toISOString(),
          raw_data: event as unknown as Record<string, unknown>,
        }, { onConflict: 'user_id,google_event_id' });

      synced++;
    }

    // Update sync metadata
    await supabaseAdmin
      .from('google_calendar_tokens')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_token: nextSyncToken || tokenRecord.sync_token,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      synced,
      deleted,
      total: allEvents.length,
    });
  } catch (error) {
    console.error('Google sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Google Calendar API helper functions
import { supabaseAdmin } from './supabase-admin';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`
  : 'http://localhost:3000/api/google-calendar/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
  }>;
}

// Get valid access token for a user (auto-refresh if expired)
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: tokenRow } = await supabaseAdmin
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!tokenRow) return null;

  // Check if token is still valid (with 5 min buffer)
  const expiresAt = new Date(tokenRow.token_expires_at);
  if (expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  // Refresh the token
  try {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await supabaseAdmin
      .from('google_calendar_tokens')
      .update({
        access_token: refreshed.access_token,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return refreshed.access_token;
  } catch (err) {
    console.error('Failed to refresh Google token for user', userId, err);
    return null;
  }
}

// Fetch events from Google Calendar
export async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: string,
  timeMax?: string,
  syncToken?: string
) {
  const params = new URLSearchParams();
  if (syncToken) {
    params.set('syncToken', syncToken);
  } else {
    if (timeMin) params.set('timeMin', timeMin);
    if (timeMax) params.set('timeMax', timeMax);
    params.set('singleEvents', 'true');
    params.set('orderBy', 'startTime');
  }
  params.set('maxResults', '250');

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 410 && syncToken) {
    // Sync token expired — do a full sync
    return fetchGoogleEvents(accessToken, calendarId, timeMin, timeMax);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error: ${err}`);
  }

  return res.json() as Promise<{
    items: GoogleCalendarEvent[];
    nextSyncToken?: string;
    nextPageToken?: string;
  }>;
}

// Create an event on Google Calendar
export async function createGoogleEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: { email: string }[];
  },
  calendarId: string = 'primary'
) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Google event: ${err}`);
  }

  return res.json();
}

// Update an event on Google Calendar
export async function updateGoogleEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
  },
  calendarId: string = 'primary'
) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update Google event: ${err}`);
  }

  return res.json();
}

// Delete an event from Google Calendar
export async function deleteGoogleEvent(
  accessToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete Google event: ${err}`);
  }
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email: string; responseStatus?: string }[];
  organizer?: { email: string; displayName?: string };
}

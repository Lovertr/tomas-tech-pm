import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getGoogleAuthUrl } from '@/lib/google-calendar';

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

    // Use user_id as state parameter for security
    const state = Buffer.from(JSON.stringify({ userId: session.user_id, ts: Date.now() })).toString('base64url');
    const authUrl = getGoogleAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

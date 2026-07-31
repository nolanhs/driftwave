/*
  Supabase setup
  --------------
  1. Create a project at https://supabase.com
  2. Open Project Settings > API.
  3. Replace the two placeholder values below.
  4. Never place your service_role key in frontend code.

  Authentication requires Supabase to be configured. The audio dashboard
  can still display without uploaded audio files.
*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fwhimgnnfkridmxsnqgk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_OuDKjDCqUYrXC4q9bTGfqw_LLCYhd0H";

export const isSupabaseConfigured =
  !SUPABASE_URL.includes("YOUR_") &&
  !SUPABASE_ANON_KEY.includes("YOUR_");

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/*
  Run this SQL in the Supabase SQL Editor:

  create table public.sessions (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    vibe text not null,
    track_id text not null,
    track_title text not null,
    duration_minutes integer not null,
    completed_seconds integer not null default 0,
    created_at timestamptz not null default now()
  );

  alter table public.sessions enable row level security;

  create policy "Users can view their own sessions"
  on public.sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

  create policy "Users can create their own sessions"
  on public.sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

  create policy "Users can delete their own sessions"
  on public.sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
*/

/*
  Optional audio setup:

  Create a public Storage bucket named "audio".
  Upload files using paths such as:

  sleep/midnight-drift.mp3
  study/deep-library.mp3
  create/neon-canvas.mp3
  workout/afterburn.mp3
  calm/soft-rain.mp3
  learn/clear-mind.mp3

  The app can create public URLs for those tracks with getAudioUrl().
*/

export function getAudioUrl(storagePath) {
  if (!supabase || !storagePath) {
    return storagePath || "";
  }

  const { data } = supabase.storage
    .from("audio")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not load user:", error.message);
    return null;
  }

  return user;
}

export async function saveSessionToSupabase(session) {
  if (!supabase) {
    return { skipped: true };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      skipped: true,
      reason: "No authenticated Supabase user."
    };
  }

  const { error } = await supabase.from("sessions").insert({
    user_id: user.id,
    vibe: session.vibe,
    track_id: session.trackId,
    track_title: session.trackTitle,
    duration_minutes: session.durationMinutes,
    completed_seconds: session.completedSeconds
  });

  if (error) {
    throw error;
  }

  return { skipped: false };
}

export async function loadSessionsFromSupabase() {
  if (!supabase) {
    return [];
  }

  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, vibe, track_id, track_title, duration_minutes, completed_seconds, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return data.map((row) => ({
    id: row.id,
    vibe: row.vibe,
    trackId: row.track_id,
    trackTitle: row.track_title,
    durationMinutes: row.duration_minutes,
    completedSeconds: row.completed_seconds,
    createdAt: row.created_at
  }));
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

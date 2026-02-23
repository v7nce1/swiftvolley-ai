-- VolleyTrack Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- ─── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id                        uuid references auth.users(id) on delete cascade primary key,
  display_name              text,
  avatar_url                text,
  is_pro                    boolean not null default false,
  video_storage_preference  text not null default 'never'
                              check (video_storage_preference in ('always','never','ask')),
  created_at                timestamptz not null default now()
);

-- Auto-create profile on first sign-in
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Sessions ─────────────────────────────────────────────────────────────────
create table public.sessions (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  mode                      text not null check (mode in ('spike','block')),
  camera_angle              text not null check (camera_angle in ('sideline','behind_court')),
  recorded_at               timestamptz not null default now(),
  clip_duration_ms          bigint,

  -- Speed metrics
  speed_kmh                 numeric(6,2),
  peak_speed_kmh            numeric(6,2),
  speed_confidence          numeric(4,3) check (speed_confidence between 0 and 1),
  used_cloud_fallback       boolean not null default false,

  -- Form metrics
  form_score                numeric(5,2) check (form_score between 0 and 100),
  wrist_snap_score          numeric(5,2) check (wrist_snap_score between 0 and 100),
  arm_extension_score       numeric(5,2) check (arm_extension_score between 0 and 100),
  contact_point_score       numeric(5,2) check (contact_point_score between 0 and 100),

  -- Calibration
  calibration_px_per_meter  numeric(8,3),
  calibration_confidence    numeric(4,3) check (calibration_confidence between 0 and 1),

  -- Video
  video_path                text,
  video_stored              boolean not null default false,

  created_at                timestamptz not null default now()
);

create index sessions_user_recorded on public.sessions(user_id, recorded_at desc);

-- ─── Trajectory snapshots ─────────────────────────────────────────────────────
create table public.trajectory_snapshots (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references public.sessions(id) on delete cascade unique,
  frame_indices       integer[] not null default '{}',
  speeds_kmh          numeric[] not null default '{}',
  positions_x         numeric[],
  positions_y         numeric[],
  total_frames        integer not null default 0,
  fps                 integer not null default 60,
  contact_frame_index integer,
  created_at          timestamptz not null default now()
);

-- ─── Pose keypoints ───────────────────────────────────────────────────────────
create table public.pose_keypoints (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references public.sessions(id) on delete cascade unique,
  keypoint_names      text[] not null default '{}',
  positions_x         numeric[] not null default '{}',
  positions_y         numeric[] not null default '{}',
  scores              numeric[] not null default '{}',
  contact_frame_index integer,
  created_at          timestamptz not null default now()
);

-- ─── Trend view (aggregated daily stats per user) ─────────────────────────────
create or replace view public.session_trends as
select
  user_id,
  date_trunc('day', recorded_at)::date::text as day,
  round(avg(speed_kmh)::numeric, 1)          as avg_speed_kmh,
  round(max(speed_kmh)::numeric, 1)          as max_speed_kmh,
  round(avg(form_score)::numeric, 1)         as avg_form_score,
  count(*)::integer                          as session_count
from public.sessions
where recorded_at > now() - interval '30 days'
  and speed_kmh is not null
group by user_id, date_trunc('day', recorded_at)
order by day asc;

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.sessions             enable row level security;
alter table public.trajectory_snapshots enable row level security;
alter table public.pose_keypoints       enable row level security;

-- Profiles: users can only access their own
create policy "own profile"      on public.profiles             for all using (auth.uid() = id);

-- Sessions: users can only access their own
create policy "own sessions"     on public.sessions             for all using (auth.uid() = user_id);
create policy "own trajectories" on public.trajectory_snapshots for all
  using (exists (select 1 from public.sessions where id = session_id and user_id = auth.uid()));
create policy "own keypoints"    on public.pose_keypoints       for all
  using (exists (select 1 from public.sessions where id = session_id and user_id = auth.uid()));

-- Trend view: only returns requesting user's own rows
create policy "own trends"       on public.sessions             for select using (auth.uid() = user_id);

-- ─── Storage bucket for videos (optional) ─────────────────────────────────────
-- Run this only if you want video upload capability
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', false);

-- create policy "own videos upload" on storage.objects for insert
--   with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "own videos read" on storage.objects for select
--   using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "own videos delete" on storage.objects for delete
--   using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

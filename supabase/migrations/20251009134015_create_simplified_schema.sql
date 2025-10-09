-- Migration: create_simplified_schema
-- Description: Creates the initial database schema for the 10x Summary Dashboard using Supabase Auth directly
-- Tables: transcripts, summaries, analytics_events
-- Created: 2025-10-09

-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- Enable citext extension for case-insensitive text
create extension if not exists "citext";

-- Create transcripts table
create table "transcripts" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript_text text not null,
  created_at timestamptz not null default now()
);

comment on table "transcripts" is 'Meeting transcripts uploaded by users';
comment on column "transcripts"."user_id" is 'Foreign key to auth.users table, identifies the owner';
comment on column "transcripts"."transcript_text" is 'Full meeting transcript content';

-- Create summaries table
create table "summaries" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript_id uuid not null unique references transcripts(id) on delete cascade,
  summary_markdown text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table "summaries" is 'AI-generated summaries of meeting transcripts';
comment on column "summaries"."user_id" is 'Foreign key to auth.users table, identifies the owner';
comment on column "summaries"."transcript_id" is 'One-to-one relationship with transcript';
comment on column "summaries"."summary_markdown" is 'Markdown content including embedded tasks';

-- Create analytics_events table
create table "analytics_events" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('summary_generated', 'summary_accepted')),
  summary_id uuid null references summaries(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table "analytics_events" is 'User activity tracking for analytics';
comment on column "analytics_events"."user_id" is 'Foreign key to auth.users table';
comment on column "analytics_events"."event_type" is 'Type of event (summary_generated or summary_accepted)';
comment on column "analytics_events"."summary_id" is 'Optional reference to related summary';

-- Create indexes for performance optimization
create index idx_summaries_user_created on summaries (user_id, created_at desc);
create index idx_transcripts_user_created on transcripts (user_id, created_at desc);
create index idx_analytics_user_created on analytics_events (user_id, created_at desc);
create index idx_analytics_event_type on analytics_events (event_type);

-- Enable Row Level Security (RLS) on all tables
alter table transcripts enable row level security;
alter table summaries enable row level security;
alter table analytics_events enable row level security;

-- RLS policies for transcripts table
create policy "Users can select their own transcripts" on transcripts
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own transcripts" on transcripts
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own transcripts" on transcripts
  for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own transcripts" on transcripts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- RLS policies for summaries table
create policy "Users can select their own summaries" on summaries
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own summaries" on summaries
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own summaries" on summaries
  for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own summaries" on summaries
  for delete
  to authenticated
  using (user_id = auth.uid());

-- RLS policies for analytics_events table
create policy "Users can select their own analytics events" on analytics_events
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own analytics events" on analytics_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Note: No update/delete policies for analytics_events as these operations
-- should not be performed directly by users

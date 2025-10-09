-- Migration: disable_policies
-- Description: Disables all policies from transcripts, summaries, and analytics_events tables
-- Created: 2025-10-09

-- Drop policies for transcripts table
drop policy if exists "Users can select their own transcripts" on transcripts;
drop policy if exists "Users can insert their own transcripts" on transcripts;
drop policy if exists "Users can update their own transcripts" on transcripts;
drop policy if exists "Users can delete their own transcripts" on transcripts;

-- Drop policies for summaries table
drop policy if exists "Users can select their own summaries" on summaries;
drop policy if exists "Users can insert their own summaries" on summaries;
drop policy if exists "Users can update their own summaries" on summaries;
drop policy if exists "Users can delete their own summaries" on summaries;

-- Drop policies for analytics_events table
drop policy if exists "Users can select their own analytics events" on analytics_events;
drop policy if exists "Users can insert their own analytics events" on analytics_events;

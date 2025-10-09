# PostgreSQL Database Schema

## 1. Tables

### 1.1 `users`
- id: UUID PRIMARY KEY, DEFAULT `gen_random_uuid()` — maps to Supabase `auth.uid()`
- email: CITEXT NOT NULL, UNIQUE — case-insensitive
- created_at: TIMESTAMPTZ NOT NULL, DEFAULT `now()`
- updated_at: TIMESTAMPTZ NULL — maintained in application code

### 1.2 `transcripts`
- id: UUID PRIMARY KEY, DEFAULT `gen_random_uuid()`
- user_id: UUID NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE — owner
- transcript_text: TEXT NOT NULL — full meeting transcript
- created_at: TIMESTAMPTZ NOT NULL, DEFAULT `now()`

### 1.3 `summaries`
- id: UUID PRIMARY KEY, DEFAULT `gen_random_uuid()`
- user_id: UUID NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE
- transcript_id: UUID NOT NULL, UNIQUE, REFERENCES `transcripts(id)` ON DELETE CASCADE — one-to-one with transcript
- summary_markdown: TEXT NOT NULL — markdown including embedded tasks
- created_at: TIMESTAMPTZ NOT NULL, DEFAULT `now()`
- updated_at: TIMESTAMPTZ NOT NULL, DEFAULT `now()` — updated when edited

### 1.4 `analytics_events`
- id: UUID PRIMARY KEY, DEFAULT `gen_random_uuid()`
- user_id: UUID NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE
- event_type: TEXT NOT NULL, CHECK (`event_type` IN ('summary_generated','summary_accepted'))
- summary_id: UUID NULL, REFERENCES `summaries(id)` ON DELETE CASCADE — nullable
- created_at: TIMESTAMPTZ NOT NULL, DEFAULT `now()`

## 2. Relationships
1. **users ↔ transcripts**: one-to-many (`users.id` → `transcripts.user_id`).
2. **users ↔ summaries**: one-to-many (`users.id` → `summaries.user_id`).
3. **transcripts ↔ summaries**: one-to-one (`transcripts.id` ↔ `summaries.transcript_id`).
4. **users ↔ analytics_events**: one-to-many (`users.id` → `analytics_events.user_id`).
5. **summaries ↔ analytics_events**: many-to-one (`analytics_events.summary_id` → `summaries.id`).

## 3. Indexes
- Index on (user_id, created_at DESC) in table `summaries` — optimises newest-first dashboard queries
- Index on (user_id, created_at DESC) in table `transcripts` — fast transcript listing per user
- Index on (user_id, created_at DESC) in table `analytics_events` — user activity stream
- Index on (event_type) in table `analytics_events` — filter by event type

## 4. Row-Level Security (RLS) Policies
_Enable RLS on every table._

### 4.1 `users`
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow the owner to access their row
CREATE POLICY "Users are owners" ON users
  FOR ALL
  USING (id = auth.uid());
```

### 4.2 `transcripts`
```sql
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can CRUD transcripts" ON transcripts
  FOR ALL
  USING (user_id = auth.uid());
```

### 4.3 `summaries`
```sql
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can CRUD summaries" ON summaries
  FOR ALL
  USING (user_id = auth.uid());
```

### 4.4 `analytics_events`
```sql
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can SELECT events" ON analytics_events
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERTs are issued by server-side code (trusted role)
```

## 5. Additional Notes
- UUIDs are generated via the `pgcrypto` extension (`gen_random_uuid()`). Supabase includes this by default.
- Hard deletes are permitted; cascading deletes ensure related records are removed immediately.
- No triggers, status columns, versioning, or full-text search are included as per planning decisions.
- All timestamps are stored in UTC.
- Application logic enforces the 20-summary quota and duplicate transcript allowance; no DB constraints are applied for these rules.

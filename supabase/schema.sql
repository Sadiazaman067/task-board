-- =========================================
-- TASK BOARD SCHEMA
-- =========================================

-- ---------- tasks ----------
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  description  text,
  status       text not null default 'todo'
               check (status in ('todo','in_progress','in_review','done')),
  priority     text not null default 'normal'
               check (priority in ('low','normal','high')),
  due_date     date,
  position     double precision not null default 0,   -- order within a column
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tasks_user_idx on public.tasks(user_id);

-- ---------- team members ----------
create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);
create index team_members_user_idx on public.team_members(user_id);

-- many-to-many: tasks <-> members
create table public.task_assignees (
  task_id    uuid not null references public.tasks(id) on delete cascade,
  member_id  uuid not null references public.team_members(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (task_id, member_id)
);

-- ---------- labels ----------
create table public.labels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 30),
  color       text not null default '#64748b',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create table public.task_labels (
  task_id   uuid not null references public.tasks(id) on delete cascade,
  label_id  uuid not null references public.labels(id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (task_id, label_id)
);

-- ---------- comments ----------
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index comments_task_idx on public.comments(task_id);

-- ---------- activity log ----------
create table public.task_activity (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null,   -- created | status_changed | title_changed | priority_changed | due_date_changed
  from_value  text,
  to_value    text,
  created_at  timestamptz not null default now()
);
create index task_activity_task_idx on public.task_activity(task_id);

-- =========================================
-- ROW LEVEL SECURITY: users only touch their own rows
-- =========================================
alter table public.tasks          enable row level security;
alter table public.team_members   enable row level security;
alter table public.task_assignees enable row level security;
alter table public.labels         enable row level security;
alter table public.task_labels    enable row level security;
alter table public.comments       enable row level security;
alter table public.task_activity  enable row level security;

create policy "own tasks" on public.tasks
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own members" on public.team_members
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own assignees" on public.task_assignees
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own labels" on public.labels
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own task labels" on public.task_labels
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own comments" on public.comments
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- activity is read-only from the app; only the trigger writes it
create policy "read own activity" on public.task_activity
  for select using (user_id = (select auth.uid()));

-- =========================================
-- TRIGGERS
-- =========================================

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- auto activity log
create or replace function public.log_task_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into task_activity(task_id, user_id, action, to_value)
    values (new.id, new.user_id, 'created', new.status);
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into task_activity(task_id, user_id, action, from_value, to_value)
      values (new.id, new.user_id, 'status_changed', old.status, new.status);
    end if;
    if new.title is distinct from old.title then
      insert into task_activity(task_id, user_id, action, from_value, to_value)
      values (new.id, new.user_id, 'title_changed', old.title, new.title);
    end if;
    if new.priority is distinct from old.priority then
      insert into task_activity(task_id, user_id, action, from_value, to_value)
      values (new.id, new.user_id, 'priority_changed', old.priority, new.priority);
    end if;
    if new.due_date is distinct from old.due_date then
      insert into task_activity(task_id, user_id, action, from_value, to_value)
      values (new.id, new.user_id, 'due_date_changed', old.due_date::text, new.due_date::text);
    end if;
  end if;
  return new;
end $$;

create trigger tasks_activity after insert or update on public.tasks
  for each row execute function public.log_task_activity();

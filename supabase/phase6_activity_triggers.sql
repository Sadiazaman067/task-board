-- =========================================
-- PHASE 6: log assignee + label changes in the activity timeline
-- =========================================

create or replace function public.log_assignee_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  member_name text;
begin
  if tg_op = 'INSERT' then
    select name into member_name from team_members where id = new.member_id;
    insert into task_activity(task_id, user_id, action, to_value)
    values (new.task_id, new.user_id, 'assigned', member_name);
    return new;
  end if;

  -- DELETE: skip if the task or member itself is being deleted (cascade)
  select name into member_name from team_members where id = old.member_id;
  if member_name is not null and exists (select 1 from tasks where id = old.task_id) then
    insert into task_activity(task_id, user_id, action, from_value)
    values (old.task_id, old.user_id, 'unassigned', member_name);
  end if;
  return old;
end $$;

create trigger task_assignees_activity
  after insert or delete on public.task_assignees
  for each row execute function public.log_assignee_activity();

create or replace function public.log_label_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  label_name text;
begin
  if tg_op = 'INSERT' then
    select name into label_name from labels where id = new.label_id;
    insert into task_activity(task_id, user_id, action, to_value)
    values (new.task_id, new.user_id, 'labeled', label_name);
    return new;
  end if;

  select name into label_name from labels where id = old.label_id;
  if label_name is not null and exists (select 1 from tasks where id = old.task_id) then
    insert into task_activity(task_id, user_id, action, from_value)
    values (old.task_id, old.user_id, 'unlabeled', label_name);
  end if;
  return old;
end $$;

create trigger task_labels_activity
  after insert or delete on public.task_labels
  for each row execute function public.log_label_activity();

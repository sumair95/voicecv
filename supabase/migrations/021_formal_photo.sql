-- Formal-photo paywall. The AI "professional photo" conversion (remove.bg,
-- white background) is a paid add-on ($2). Credits live on the profile; one
-- credit is spent per successful conversion. Granted only by the Stripe webhook
-- (pack = "photo"); consumed by /api/photo/convert. Comped accounts skip it.

alter table profiles add column if not exists formal_photo_credits int not null default 0;

-- Consume one formal-photo credit. Returns true if a credit was spent.
-- SECURITY DEFINER + auth.uid()-scoped, matching the other consume_* RPCs, so a
-- client can never spend on someone else's behalf.
create or replace function consume_formal_photo_credit()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  update profiles
    set formal_photo_credits = formal_photo_credits - 1
    where id = uid and formal_photo_credits > 0;
  return found;
end;
$$;

-- Verify:
-- select formal_photo_credits from profiles where id = auth.uid();

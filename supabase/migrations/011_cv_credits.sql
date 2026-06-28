-- 011_cv_credits.sql
-- Free accounts get 3 CVs (enforced in code). Buying the $3 CV pack or the $5
-- Premium pack adds extra CV allowance here. allowance = 3 + cv_credits.

alter table profiles add column if not exists cv_credits int not null default 0;

-- Verify:
-- select cv_credits, premium_cv_credits, cover_letter_credits from profiles where id = auth.uid();

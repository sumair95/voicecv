# VoiceCV — Analytics

First-party, privacy-friendly analytics. Every funnel step writes a row to the
`events` table (migration `013`). No third-party tracker. Read it with SQL in
the **Supabase → SQL Editor** (owner-only; clients can insert but not read).

## Events we record

| event | where | props |
|---|---|---|
| `record_started` | record flow (Continue) | `lang`, `output` |
| `cv_generated` | `/api/generate-cv` | `isNew`, `language` |
| `pdf_downloaded` | CV page / dashboard / cover letter | `kind` (`cv` \| `cover_letter`), `cvId`, `template` |
| `cover_letter_generated` | `/api/generate-cover-letter` | `cvId` |
| `premium_unlocked` | `/api/unlock-cv-premium` | `cvId` |
| `checkout_started` | `/api/checkout` | `pack` (`cv` \| `premium`) |
| `purchase_completed` | Stripe webhook | `pack`, `amount` (cents), `currency` |

## The core funnel

```sql
-- Distinct users reaching each step (last 30 days)
with f as (
  select user_id, event from events
  where created_at > now() - interval '30 days'
)
select
  count(distinct user_id) filter (where event = 'record_started')   as started_recording,
  count(distinct user_id) filter (where event = 'cv_generated')      as generated_cv,
  count(distinct user_id) filter (where event = 'pdf_downloaded')    as downloaded_pdf,
  count(distinct user_id) filter (where event = 'checkout_started')  as started_checkout,
  count(distinct user_id) filter (where event = 'purchase_completed') as purchased
from f;
```

## Step-to-step conversion %

```sql
with f as (
  select
    count(distinct user_id) filter (where event = 'record_started')    as a,
    count(distinct user_id) filter (where event = 'cv_generated')       as b,
    count(distinct user_id) filter (where event = 'pdf_downloaded')     as c,
    count(distinct user_id) filter (where event = 'checkout_started')   as d,
    count(distinct user_id) filter (where event = 'purchase_completed') as e
  from events where created_at > now() - interval '30 days'
)
select
  round(100.0 * b / nullif(a,0), 1) as record_to_generate,
  round(100.0 * c / nullif(b,0), 1) as generate_to_download,
  round(100.0 * d / nullif(c,0), 1) as download_to_checkout,
  round(100.0 * e / nullif(d,0), 1) as checkout_to_purchase,
  round(100.0 * e / nullif(a,0), 1) as overall_record_to_purchase
from f;
```

## Revenue & pack split

```sql
select
  props->>'pack' as pack,
  count(*)               as purchases,
  sum((props->>'amount')::int) / 100.0 as revenue_usd
from events
where event = 'purchase_completed'
group by 1;
```

## Daily activity

```sql
select date_trunc('day', created_at)::date as day, event, count(*)
from events
where created_at > now() - interval '30 days'
group by 1, 2
order by 1 desc, 3 desc;
```

## Drop-off: started recording but never generated

```sql
select count(distinct user_id) from events e1
where event = 'record_started'
  and not exists (
    select 1 from events e2
    where e2.user_id = e1.user_id and e2.event = 'cv_generated'
  );
```

## Language mix of generated CVs

```sql
select props->>'language' as cv_language, count(*)
from events where event = 'cv_generated'
group by 1 order by 2 desc;
```

> Tip: save these as Supabase **SQL snippets** so they're one click away. When
> there's enough volume, these numbers should drive the pricing / free-limit
> tuning called out in `DECISIONS.md`.

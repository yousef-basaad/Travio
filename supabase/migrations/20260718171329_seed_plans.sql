-- =========================================
-- Default SaaS Plans
-- Travio
-- =========================================


insert into public.plans (
  name,
  slug,
  description,
  price,
  interval
)

values

(
  'Starter',
  'starter',
  'For small travel agencies getting started.',
  99,
  'monthly'
),


(
  'Business',
  'business',
  'For growing travel agencies with teams.',
  299,
  'monthly'
),


(
  'Enterprise',
  'enterprise',
  'Custom plan for large organizations.',
  0,
  'yearly'
);



-- =========================================
-- Plan Features
-- =========================================


insert into public.plan_features (
  plan_id,
  feature_key,
  feature_value
)

select
  id,
  'max_users',
  '5'
from public.plans
where slug = 'starter';



insert into public.plan_features (
  plan_id,
  feature_key,
  feature_value
)

select
  id,
  'max_bookings_monthly',
  '100'
from public.plans
where slug = 'starter';



insert into public.plan_features (
  plan_id,
  feature_key,
  feature_value
)

select
  id,
  'max_users',
  '25'
from public.plans
where slug = 'business';



insert into public.plan_features (
  plan_id,
  feature_key,
  feature_value
)

select
  id,
  'max_bookings_monthly',
  '1000'
from public.plans
where slug = 'business';



insert into public.plan_features (
  plan_id,
  feature_key,
  feature_value
)

select
  id,
  'max_users',
  'unlimited'
from public.plans
where slug = 'enterprise';



insert into public.plan_features (
  plan_id,
  feature_key,
  feature_value
)

select
  id,
  'max_bookings_monthly',
  'unlimited'
from public.plans
where slug = 'enterprise';
-- =========================================
-- Booking destination and traveler counts
-- =========================================
--
-- The Booking workspace (TRAVIO design 04) shows where a trip goes and
-- how many travel ("Istanbul - Turkey", "2 adults, 1 child"); the
-- Operations Center and Reports group bookings by destination country.
-- All four columns are optional, so existing bookings stay valid.
--
--   destination_country - ISO 3166-1 alpha-2 code ("TR"), so it can be
--                         grouped, flagged and named in any language
--   destination_city    - free text ("Istanbul")
--   adults / children   - traveler counts, never negative

alter table public.bookings
  add column destination_country text
    constraint bookings_destination_country_check check (destination_country ~ '^[A-Z]{2}$'),
  add column destination_city text
    constraint bookings_destination_city_check check (char_length(destination_city) <= 120),
  add column adults smallint
    constraint bookings_adults_check check (adults between 0 and 999),
  add column children smallint
    constraint bookings_children_check check (children between 0 and 999);

create index bookings_tenant_destination_country_idx
on public.bookings (tenant_id, destination_country)
where deleted_at is null;

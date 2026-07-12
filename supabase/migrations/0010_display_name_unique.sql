-- Case-insensitive uniqueness on profiles.display_name (SYSTEM.md §14a).
-- "jayron" and "Jayron" must collide. Plain `unique` on display_name would
-- be case-sensitive, so this is a unique index on lower(display_name)
-- instead. Enforced here as the source of truth; app/signup/page.tsx adds
-- a pre-check against this for a friendly error instead of a raw Postgres
-- constraint violation, but this index is what actually guarantees it.

create unique index profiles_display_name_lower_idx
  on profiles (lower(display_name));

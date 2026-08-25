-- MandatHunt - Initialisation de la base de données
-- Migration 0001_init.sql
-- (2026-08-26 : policies profiles alignées sur la production, sans récursion)

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table des agences
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  postal_code text not null,
  radius_km int not null default 20,
  criteria jsonb not null default '{"price_min":0,"price_max":999999,"year_min":1990,"mileage_max":300000,"has_phone":true,"sources":["lbc","lacentrale"]}',
  created_at timestamptz default now()
);

-- Type enum pour les rôles utilisateurs
create type user_role as enum ('superadmin','admin','agent');

-- Table des profils utilisateurs
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  agency_id uuid references agencies on delete set null,
  role user_role not null default 'agent',
  first_name text,
  last_name text,
  email text,
  phone text
);

-- Table des colonnes (personnalisables par agence)
create table columns (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies on delete cascade,
  name text not null,
  color text not null default '#2563eb',
  position int not null
);

-- Table des annonces (listings)
create table listings (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies on delete cascade,
  source text not null,               -- 'lbc' | 'lacentrale'
  source_id text not null,
  url text,
  title text,
  photo_url text,
  city text,
  postal_code text,
  distance_km numeric(5,1),
  price int,
  brand text,
  model text,
  year int,
  mileage int,
  fuel text,
  gearbox text,
  power text,
  condition text,
  description text,
  phone text,
  phone_e164 text,
  column_id uuid references columns on delete set null,
  assigned_to uuid references profiles on delete set null,
  rdv_date timestamptz,
  published_at timestamptz,
  first_seen_at timestamptz default now(),
  last_updated_at timestamptz,
  last_checked_at timestamptz,
  is_active boolean not null default true,
  unique (agency_id, source, source_id)
);

-- Historique des prix
create table price_history (
  id bigserial primary key,
  listing_id uuid not null references listings on delete cascade,
  price int not null,
  at timestamptz default now()
);

-- Historique des statuts (déplacements entre colonnes)
create table status_history (
  id bigserial primary key,
  listing_id uuid not null references listings on delete cascade,
  from_column_id uuid,
  to_column_id uuid,
  user_id uuid references profiles,
  at timestamptz default now()
);

-- Notes sur les annonces
create table notes (
  id bigserial primary key,
  listing_id uuid not null references listings on delete cascade,
  user_id uuid references profiles,
  text text not null,
  at timestamptz default now()
);

-- Rappels
create table reminders (
  id bigserial primary key,
  listing_id uuid not null references listings on delete cascade,
  user_id uuid references profiles,
  due_at timestamptz not null,
  done boolean default false
);

-- ============================================================================
-- FONCTION HELPER my_profile()
-- ============================================================================

create or replace function my_profile()
returns profiles
language sql
stable
security definer
as $$
  select * from profiles where id = auth.uid() limit 1;
$$;

-- ============================================================================
-- FONCTION seed_columns() - Crée les colonnes par défaut
-- ============================================================================

create or replace function seed_columns(a uuid) returns void as $$
  insert into columns (agency_id, name, color, position) values
   (a,'À contacter','#2563eb',1),
   (a,'PI','#64748b',2),
   (a,'RDV MANDAT','#16a34a',3),
   (a,'À rappeler','#dc2626',4),
   (a,'Vendu','#0ea5e9',5),
   (a,'Professionnel','#334155',6),
   (a,'Hors critères','#111827',7),
   (a,'À ne plus recontacter','#7f1d1d',8);
$$ language sql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
alter table agencies enable row level security;
alter table profiles enable row level security;
alter table columns enable row level security;
alter table listings enable row level security;
alter table price_history enable row level security;
alter table status_history enable row level security;
alter table notes enable row level security;
alter table reminders enable row level security;

-- ----------------------------------------------------------------------------
-- POLICIES: agencies
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_agencies" on agencies
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture de leur agence
create policy "read_own_agency_agencies" on agencies
  for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.agency_id = agencies.id
      and p.role in ('admin', 'agent')
    )
  );

-- admin: UPDATE sur agencies (name, city, postal_code, radius_km, criteria)
create policy "admin_update_agencies" on agencies
  for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.agency_id = agencies.id
      and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.agency_id = agencies.id
      and p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- POLICIES: profiles (version production 2026-08-25 — sans récursion)
-- ----------------------------------------------------------------------------

-- chacun lit son propre profil ; superadmin lit tout
create policy "profiles_select" on profiles
  for select
  using (id = auth.uid() or (my_profile()).role = 'superadmin');

-- superadmin : tous droits
create policy "profiles_superadmin" on profiles
  for all
  using ((my_profile()).role = 'superadmin')
  with check ((my_profile()).role = 'superadmin');

-- l'utilisateur peut mettre à jour son propre profil
create policy "profiles_update_self" on profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- POLICIES: columns
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_columns" on columns
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture des colonnes de leur agence
create policy "read_own_agency_columns" on columns
  for select
  using (
    exists (
      select 1 from profiles p
      join agencies a on a.id = columns.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
    )
  );

-- admin: INSERT/UPDATE/DELETE sur columns de son agence
create policy "admin_manage_columns" on columns
  for all
  using (
    exists (
      select 1 from profiles p
      join agencies a on a.id = columns.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles p
      join agencies a on a.id = columns.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and p.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- POLICIES: listings
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_listings" on listings
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture des listings de leur agence
create policy "read_own_agency_listings" on listings
  for select
  using (
    exists (
      select 1 from profiles p
      join agencies a on a.id = listings.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
    )
  );

-- agent: UPDATE sur listings de son agence (column_id, rdv_date) - assigned_to réservé admin/superadmin
create policy "agent_update_listings" on listings
  for update
  using (
    exists (
      select 1 from profiles p
      join agencies a on a.id = listings.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and p.role in ('agent', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      join agencies a on a.id = listings.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and p.role in ('agent', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- POLICIES: price_history
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_price_history" on price_history
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture de price_history lié aux listings de leur agence
create policy "read_own_agency_price_history" on price_history
  for select
  using (
    exists (
      select 1 from profiles p
      join listings l on l.id = price_history.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
    )
  );

-- ----------------------------------------------------------------------------
-- POLICIES: status_history
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_status_history" on status_history
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture de status_history lié aux listings de leur agence
create policy "read_own_agency_status_history" on status_history
  for select
  using (
    exists (
      select 1 from profiles p
      join listings l on l.id = status_history.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
    )
  );

-- agent: INSERT sur status_history avec user_id = auth.uid()
create policy "agent_insert_status_history" on status_history
  for insert
  with check (
    exists (
      select 1 from profiles p
      join listings l on l.id = status_history.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and status_history.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- POLICIES: notes
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_notes" on notes
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture des notes liées aux listings de leur agence
create policy "read_own_agency_notes" on notes
  for select
  using (
    exists (
      select 1 from profiles p
      join listings l on l.id = notes.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
    )
  );

-- agent: INSERT notes avec user_id = auth.uid()
create policy "agent_insert_notes" on notes
  for insert
  with check (
    exists (
      select 1 from profiles p
      join listings l on l.id = notes.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and notes.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- POLICIES: reminders
-- ----------------------------------------------------------------------------

-- superadmin: lecture/écriture partout
create policy "superadmin_full_reminders" on reminders
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
  );

-- admin et agent: lecture des reminders liés aux listings de leur agence
create policy "read_own_agency_reminders" on reminders
  for select
  using (
    exists (
      select 1 from profiles p
      join listings l on l.id = reminders.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
    )
  );

-- agent: INSERT/UPDATE sur reminders avec user_id = auth.uid()
create policy "agent_manage_reminders" on reminders
  for all
  using (
    exists (
      select 1 from profiles p
      join listings l on l.id = reminders.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and (reminders.user_id = auth.uid() or p.role = 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      join listings l on l.id = reminders.listing_id
      join agencies a on a.id = l.agency_id
      where p.id = auth.uid()
      and p.agency_id = a.id
      and (reminders.user_id = auth.uid() or p.role = 'admin')
    )
  );

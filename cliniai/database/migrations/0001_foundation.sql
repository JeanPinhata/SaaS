-- Phase 1: tenant, identity and dashboard foundation.
-- All application timestamps are stored as UTC timestamptz and rendered in the clinic timezone.

create type membership_role as enum ('OWNER', 'ADMIN', 'MANAGER', 'SECRETARY', 'DOCTOR');
create type entity_status as enum ('ACTIVE', 'INACTIVE');
create type appointment_status as enum ('SCHEDULED', 'CONFIRMED', 'WAITING_CONFIRMATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
create type appointment_source as enum ('MANUAL', 'WHATSAPP', 'AI', 'IMPORT');
create type payment_status as enum ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

create table organizations (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  phone text,
  whatsapp_phone text,
  email text,
  timezone text not null default 'America/Sao_Paulo',
  status entity_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  status entity_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role membership_role not null,
  status entity_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table specialties (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  status entity_status not null default 'ACTIVE',
  unique (organization_id, name)
);

create table professionals (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  specialty_id uuid not null references specialties(id),
  name text not null,
  professional_registration text,
  phone text,
  email text,
  default_appointment_duration integer not null default 30 check (default_appointment_duration between 5 and 480),
  status entity_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table patients (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  cpf text,
  birth_date date,
  insurance_name text,
  insurance_number text,
  notes text,
  status entity_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, cpf)
);

create table services (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  price numeric(12,2) not null check (price >= 0),
  status entity_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  status entity_status not null default 'ACTIVE',
  unique (organization_id, name)
);

create table appointments (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id),
  professional_id uuid not null references professionals(id),
  service_id uuid not null references services(id),
  room_id uuid references rooms(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'SCHEDULED',
  source appointment_source not null default 'MANUAL',
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table payments (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id),
  appointment_id uuid references appointments(id),
  amount numeric(12,2) not null check (amount >= 0),
  status payment_status not null default 'PENDING',
  payment_method text not null,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  description text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table waiting_list_entries (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  patient_id uuid not null references patients(id),
  professional_id uuid references professionals(id),
  service_id uuid references services(id),
  preferred_date date,
  preferred_period text,
  notes text,
  priority integer not null default 0,
  status text not null default 'WAITING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id),
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index memberships_organization_idx on memberships (organization_id);
create index professionals_organization_idx on professionals (organization_id);
create index patients_organization_name_idx on patients (organization_id, full_name);
create index patients_organization_phone_idx on patients (organization_id, phone);
create index appointments_organization_starts_at_idx on appointments (organization_id, starts_at);
create index appointments_organization_professional_starts_at_idx on appointments (organization_id, professional_id, starts_at);
create index payments_organization_status_idx on payments (organization_id, status);
create index notifications_organization_read_idx on notifications (organization_id, read_at);

create extension if not exists pgcrypto;

create table if not exists emr_users (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    full_name text not null,
    role text not null check (role in ('admin', 'doctor', 'nurse', 'lab_tech', 'scheduler')),
    email text not null unique,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists patients (
    id uuid primary key default gen_random_uuid(),
    mrn text not null unique,
    first_name text not null,
    last_name text not null,
    date_of_birth date not null,
    sex text not null check (sex in ('female', 'male', 'other', 'unknown')),
    phone text,
    email text,
    address_line1 text,
    city text,
    state text,
    postal_code text,
    created_at timestamptz not null default now()
);

create table if not exists doctors (
    id uuid primary key default gen_random_uuid(),
    license_number text not null unique,
    first_name text not null,
    last_name text not null,
    specialty text not null,
    phone text,
    email text,
    created_at timestamptz not null default now()
);

create table if not exists appointments (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete restrict,
    doctor_id uuid not null references doctors(id) on delete restrict,
    scheduled_start timestamptz not null,
    scheduled_end timestamptz not null,
    status text not null check (status in ('scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
    reason text,
    created_at timestamptz not null default now(),
    check (scheduled_end > scheduled_start)
);

create table if not exists encounters (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete restrict,
    doctor_id uuid not null references doctors(id) on delete restrict,
    appointment_id uuid unique references appointments(id) on delete restrict,
    encounter_date timestamptz not null,
    encounter_type text not null check (encounter_type in ('office_visit', 'follow_up', 'annual_exam', 'telehealth')),
    chief_complaint text,
    assessment text,
    plan text,
    status text not null check (status in ('open', 'signed', 'amended')),
    created_at timestamptz not null default now()
);

create table if not exists diagnoses (
    id uuid primary key default gen_random_uuid(),
    encounter_id uuid not null references encounters(id) on delete cascade,
    icd10_code text not null,
    diagnosis_name text not null,
    is_primary boolean not null default false,
    status text not null check (status in ('active', 'resolved')),
    onset_date date,
    resolution_date date,
    created_at timestamptz not null default now(),
    unique (encounter_id, icd10_code),
    check (resolution_date is null or onset_date is null or resolution_date >= onset_date)
);

create table if not exists medications (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete restrict,
    encounter_id uuid not null references encounters(id) on delete restrict,
    medication_name text not null,
    dose text not null,
    route text not null,
    frequency text not null,
    start_date date not null,
    end_date date,
    status text not null check (status in ('active', 'held', 'stopped', 'completed')),
    instructions text,
    created_at timestamptz not null default now(),
    check (end_date is null or end_date >= start_date)
);

create table if not exists allergies (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete restrict,
    allergen text not null,
    reaction text,
    severity text not null check (severity in ('mild', 'moderate', 'severe')),
    status text not null check (status in ('active', 'inactive', 'entered_in_error')),
    notes text,
    recorded_at timestamptz not null default now()
);

create table if not exists vitals (
    id uuid primary key default gen_random_uuid(),
    encounter_id uuid not null unique references encounters(id) on delete cascade,
    recorded_at timestamptz not null,
    height_cm numeric(5,2),
    weight_kg numeric(5,2),
    bmi numeric(5,2),
    systolic_bp smallint,
    diastolic_bp smallint,
    heart_rate smallint,
    respiratory_rate smallint,
    temperature_c numeric(4,1),
    oxygen_saturation smallint,
    check (height_cm is null or height_cm between 30 and 250),
    check (weight_kg is null or weight_kg between 1 and 400),
    check (bmi is null or bmi between 5 and 100),
    check (systolic_bp is null or systolic_bp between 40 and 300),
    check (diastolic_bp is null or diastolic_bp between 20 and 200),
    check (heart_rate is null or heart_rate between 20 and 250),
    check (respiratory_rate is null or respiratory_rate between 5 and 80),
    check (temperature_c is null or temperature_c between 30 and 45),
    check (oxygen_saturation is null or oxygen_saturation between 50 and 100)
);

create table if not exists lab_orders (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references patients(id) on delete restrict,
    encounter_id uuid not null references encounters(id) on delete restrict,
    ordering_doctor_id uuid not null references doctors(id) on delete restrict,
    test_name text not null,
    loinc_code text,
    priority text not null check (priority in ('routine', 'urgent', 'stat')),
    status text not null check (status in ('ordered', 'collected', 'resulted', 'cancelled')),
    ordered_at timestamptz not null default now()
);

create table if not exists lab_results (
    id uuid primary key default gen_random_uuid(),
    lab_order_id uuid not null references lab_orders(id) on delete cascade,
    result_name text not null,
    result_value text not null,
    unit text,
    reference_range text,
    abnormal_flag text not null check (abnormal_flag in ('normal', 'abnormal', 'low', 'high', 'critical')),
    resulted_at timestamptz not null,
    unique (lab_order_id, result_name)
);

create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references emr_users(id) on delete restrict,
    entity_name text not null,
    entity_id uuid not null,
    action text not null check (action in ('insert', 'update', 'delete', 'view', 'login', 'logout')),
    details jsonb not null default '{}'::jsonb,
    action_timestamp timestamptz not null default now()
);

create index if not exists idx_appointments_patient_id on appointments (patient_id);
create index if not exists idx_appointments_doctor_id on appointments (doctor_id);
create index if not exists idx_appointments_scheduled_start on appointments (scheduled_start);

create index if not exists idx_encounters_patient_id on encounters (patient_id);
create index if not exists idx_encounters_doctor_id on encounters (doctor_id);
create index if not exists idx_encounters_encounter_date on encounters (encounter_date desc);

create index if not exists idx_diagnoses_encounter_id on diagnoses (encounter_id);
create index if not exists idx_medications_patient_status on medications (patient_id, status);
create index if not exists idx_allergies_patient_status on allergies (patient_id, status);
create index if not exists idx_lab_orders_patient_ordered_at on lab_orders (patient_id, ordered_at desc);
create index if not exists idx_lab_orders_doctor_id on lab_orders (ordering_doctor_id);
create index if not exists idx_lab_results_resulted_at on lab_results (resulted_at desc);
create index if not exists idx_lab_results_abnormal_flag on lab_results (abnormal_flag);
create index if not exists idx_audit_logs_entity on audit_logs (entity_name, entity_id);
create index if not exists idx_audit_logs_timestamp on audit_logs (action_timestamp desc);

alter table emr_users disable row level security;
alter table patients disable row level security;
alter table doctors disable row level security;
alter table appointments disable row level security;
alter table encounters disable row level security;
alter table diagnoses disable row level security;
alter table medications disable row level security;
alter table allergies disable row level security;
alter table vitals disable row level security;
alter table lab_orders disable row level security;
alter table lab_results disable row level security;
alter table audit_logs disable row level security;

grant usage on schema public to anon, authenticated;
grant select on table emr_users to anon, authenticated;
grant select on table patients to anon, authenticated;
grant select on table doctors to anon, authenticated;
grant select on table appointments to anon, authenticated;
grant select on table encounters to anon, authenticated;
grant select on table diagnoses to anon, authenticated;
grant select on table medications to anon, authenticated;
grant select on table allergies to anon, authenticated;
grant select on table vitals to anon, authenticated;
grant select on table lab_orders to anon, authenticated;
grant select on table lab_results to anon, authenticated;
grant select on table audit_logs to anon, authenticated;

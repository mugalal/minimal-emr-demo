insert into emr_users (id, username, full_name, role, email, is_active)
values
    ('90000000-0000-4000-8000-000000000001', 'apatel', 'Dr. Aisha Patel', 'doctor', 'aisha.patel@demo-emr.local', true),
    ('90000000-0000-4000-8000-000000000002', 'nrivera', 'Nurse Nina Rivera', 'nurse', 'nina.rivera@demo-emr.local', true)
on conflict (id) do update
set username = excluded.username,
    full_name = excluded.full_name,
    role = excluded.role,
    email = excluded.email,
    is_active = excluded.is_active;

insert into doctors (id, license_number, first_name, last_name, specialty, phone, email)
values
    ('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'LIC-1001', 'Aisha', 'Patel', 'Family Medicine', '555-100-2001', 'aisha.patel@demo-emr.local'),
    ('bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'LIC-1002', 'Marcus', 'Chen', 'Internal Medicine', '555-100-2002', 'marcus.chen@demo-emr.local')
on conflict (id) do update
set license_number = excluded.license_number,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    specialty = excluded.specialty,
    phone = excluded.phone,
    email = excluded.email;

insert into patients (id, mrn, first_name, last_name, date_of_birth, sex, phone, email, address_line1, city, state, postal_code)
values
    ('11111111-1111-4111-8111-111111111111', 'MRN-000001', 'Elena', 'Garcia', '1988-04-12', 'female', '555-200-3001', 'elena.garcia@example.com', '124 Cedar Ave', 'Austin', 'TX', '78701'),
    ('22222222-2222-4222-8222-222222222222', 'MRN-000002', 'Michael', 'Johnson', '1976-09-23', 'male', '555-200-3002', 'michael.johnson@example.com', '98 Oak Street', 'Dallas', 'TX', '75201'),
    ('33333333-3333-4333-8333-333333333333', 'MRN-000003', 'Priya', 'Nair', '1993-01-05', 'female', '555-200-3003', 'priya.nair@example.com', '56 Maple Lane', 'Houston', 'TX', '77002')
on conflict (id) do update
set mrn = excluded.mrn,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    date_of_birth = excluded.date_of_birth,
    sex = excluded.sex,
    phone = excluded.phone,
    email = excluded.email,
    address_line1 = excluded.address_line1,
    city = excluded.city,
    state = excluded.state,
    postal_code = excluded.postal_code;

insert into appointments (id, patient_id, doctor_id, scheduled_start, scheduled_end, status, reason)
values
    ('44444444-4444-4444-8444-444444444441', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2026-05-01T09:00:00Z', '2026-05-01T09:30:00Z', 'completed', 'Sore throat and fever'),
    ('44444444-4444-4444-8444-444444444442', '22222222-2222-4222-8222-222222222222', 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '2026-04-28T14:00:00Z', '2026-04-28T14:30:00Z', 'completed', 'Hypertension follow-up'),
    ('44444444-4444-4444-8444-444444444443', '33333333-3333-4333-8333-333333333333', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2026-05-03T11:00:00Z', '2026-05-03T11:45:00Z', 'completed', 'Annual wellness exam'),
    ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '2026-05-15T10:30:00Z', '2026-05-15T10:45:00Z', 'scheduled', 'Post-treatment follow-up')
on conflict (id) do update
set patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    scheduled_start = excluded.scheduled_start,
    scheduled_end = excluded.scheduled_end,
    status = excluded.status,
    reason = excluded.reason;

insert into encounters (id, patient_id, doctor_id, appointment_id, encounter_date, encounter_type, chief_complaint, assessment, plan, status)
values
    ('55555555-5555-4555-8555-555555555551', '11111111-1111-4111-8111-111111111111', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '44444444-4444-4444-8444-444444444441', '2026-05-01T09:10:00Z', 'office_visit', 'Sore throat for 4 days', 'Likely bacterial pharyngitis without airway compromise.', 'Start azithromycin, increase fluids, and review CBC.', 'signed'),
    ('55555555-5555-4555-8555-555555555552', '22222222-2222-4222-8222-222222222222', 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '44444444-4444-4444-8444-444444444442', '2026-04-28T14:10:00Z', 'follow_up', 'Blood pressure review and diabetes follow-up', 'Hypertension remains stable; diabetes control above goal.', 'Continue lisinopril and metformin, repeat A1c in 3 months.', 'signed'),
    ('55555555-5555-4555-8555-555555555553', '33333333-3333-4333-8333-333333333333', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '44444444-4444-4444-8444-444444444443', '2026-05-03T11:15:00Z', 'annual_exam', 'Routine preventive visit', 'Overall well exam with borderline lipids.', 'Discuss diet, exercise, and lipid panel follow-up in 6 months.', 'signed')
on conflict (id) do update
set patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    appointment_id = excluded.appointment_id,
    encounter_date = excluded.encounter_date,
    encounter_type = excluded.encounter_type,
    chief_complaint = excluded.chief_complaint,
    assessment = excluded.assessment,
    plan = excluded.plan,
    status = excluded.status;

insert into diagnoses (id, encounter_id, icd10_code, diagnosis_name, is_primary, status, onset_date, resolution_date)
values
    ('66666666-6666-4666-8666-666666666661', '55555555-5555-4555-8555-555555555551', 'J02.9', 'Acute pharyngitis, unspecified', true, 'active', '2026-05-01', null),
    ('66666666-6666-4666-8666-666666666662', '55555555-5555-4555-8555-555555555552', 'I10', 'Essential (primary) hypertension', true, 'active', '2021-06-01', null),
    ('66666666-6666-4666-8666-666666666663', '55555555-5555-4555-8555-555555555552', 'E11.9', 'Type 2 diabetes mellitus without complications', false, 'active', '2020-03-15', null),
    ('66666666-6666-4666-8666-666666666664', '55555555-5555-4555-8555-555555555553', 'Z00.00', 'Encounter for general adult medical examination without abnormal findings', true, 'active', '2026-05-03', null)
on conflict (id) do update
set encounter_id = excluded.encounter_id,
    icd10_code = excluded.icd10_code,
    diagnosis_name = excluded.diagnosis_name,
    is_primary = excluded.is_primary,
    status = excluded.status,
    onset_date = excluded.onset_date,
    resolution_date = excluded.resolution_date;

insert into medications (id, patient_id, encounter_id, medication_name, dose, route, frequency, start_date, end_date, status, instructions)
values
    ('77777777-7777-4777-8777-777777777771', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555551', 'Azithromycin', '500 mg', 'oral', 'once daily', '2026-05-01', '2026-05-03', 'completed', 'Take after food for 3 days.'),
    ('77777777-7777-4777-8777-777777777772', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-555555555552', 'Lisinopril', '10 mg', 'oral', 'once daily', '2024-01-10', null, 'active', 'Monitor blood pressure at home.'),
    ('77777777-7777-4777-8777-777777777773', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-555555555552', 'Metformin', '500 mg', 'oral', 'twice daily', '2024-01-10', null, 'active', 'Take with breakfast and dinner.')
on conflict (id) do update
set patient_id = excluded.patient_id,
    encounter_id = excluded.encounter_id,
    medication_name = excluded.medication_name,
    dose = excluded.dose,
    route = excluded.route,
    frequency = excluded.frequency,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    status = excluded.status,
    instructions = excluded.instructions;

insert into allergies (id, patient_id, allergen, reaction, severity, status, notes, recorded_at)
values
    ('88888888-8888-4888-8888-888888888881', '11111111-1111-4111-8111-111111111111', 'Penicillin', 'Diffuse rash', 'severe', 'active', 'Avoid beta-lactam antibiotics until formally reviewed.', '2025-10-11T10:00:00Z'),
    ('88888888-8888-4888-8888-888888888882', '22222222-2222-4222-8222-222222222222', 'Peanuts', 'Anaphylaxis', 'severe', 'active', 'Carries epinephrine autoinjector.', '2022-02-14T15:00:00Z'),
    ('88888888-8888-4888-8888-888888888883', '33333333-3333-4333-8333-333333333333', 'Latex', 'Skin irritation', 'mild', 'active', 'Use non-latex gloves when possible.', '2024-07-09T13:30:00Z')
on conflict (id) do update
set patient_id = excluded.patient_id,
    allergen = excluded.allergen,
    reaction = excluded.reaction,
    severity = excluded.severity,
    status = excluded.status,
    notes = excluded.notes,
    recorded_at = excluded.recorded_at;

insert into vitals (id, encounter_id, recorded_at, height_cm, weight_kg, bmi, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_c, oxygen_saturation)
values
    ('99999999-9999-4999-8999-999999999991', '55555555-5555-4555-8555-555555555551', '2026-05-01T09:05:00Z', 165.00, 68.20, 25.10, 118, 76, 82, 18, 38.1, 98),
    ('99999999-9999-4999-8999-999999999992', '55555555-5555-4555-8555-555555555552', '2026-04-28T14:05:00Z', 178.00, 92.10, 29.10, 132, 84, 74, 16, 36.8, 97),
    ('99999999-9999-4999-8999-999999999993', '55555555-5555-4555-8555-555555555553', '2026-05-03T11:05:00Z', 162.00, 60.30, 23.00, 110, 70, 69, 15, 36.7, 99)
on conflict (id) do update
set encounter_id = excluded.encounter_id,
    recorded_at = excluded.recorded_at,
    height_cm = excluded.height_cm,
    weight_kg = excluded.weight_kg,
    bmi = excluded.bmi,
    systolic_bp = excluded.systolic_bp,
    diastolic_bp = excluded.diastolic_bp,
    heart_rate = excluded.heart_rate,
    respiratory_rate = excluded.respiratory_rate,
    temperature_c = excluded.temperature_c,
    oxygen_saturation = excluded.oxygen_saturation;

insert into lab_orders (id, patient_id, encounter_id, ordering_doctor_id, test_name, loinc_code, priority, status, ordered_at)
values
    ('12121212-1212-4212-8212-121212121211', '11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555551', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Complete Blood Count', '57021-8', 'routine', 'resulted', '2026-05-01T09:20:00Z'),
    ('12121212-1212-4212-8212-121212121212', '22222222-2222-4222-8222-222222222222', '55555555-5555-4555-8555-555555555552', 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'Hemoglobin A1c', '4548-4', 'routine', 'resulted', '2026-04-28T14:20:00Z'),
    ('12121212-1212-4212-8212-121212121213', '33333333-3333-4333-8333-333333333333', '55555555-5555-4555-8555-555555555553', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Lipid Panel', '24331-1', 'routine', 'resulted', '2026-05-03T11:25:00Z')
on conflict (id) do update
set patient_id = excluded.patient_id,
    encounter_id = excluded.encounter_id,
    ordering_doctor_id = excluded.ordering_doctor_id,
    test_name = excluded.test_name,
    loinc_code = excluded.loinc_code,
    priority = excluded.priority,
    status = excluded.status,
    ordered_at = excluded.ordered_at;

insert into lab_results (id, lab_order_id, result_name, result_value, unit, reference_range, abnormal_flag, resulted_at)
values
    ('13131313-1313-4313-8313-131313131311', '12121212-1212-4212-8212-121212121211', 'WBC', '11.2', '10^3/uL', '4.0-10.5', 'high', '2026-05-01T17:00:00Z'),
    ('13131313-1313-4313-8313-131313131312', '12121212-1212-4212-8212-121212121211', 'Hemoglobin', '13.4', 'g/dL', '12.0-15.5', 'normal', '2026-05-01T17:00:00Z'),
    ('13131313-1313-4313-8313-131313131313', '12121212-1212-4212-8212-121212121212', 'HbA1c', '7.4', '%', '4.0-5.6', 'high', '2026-04-29T08:30:00Z'),
    ('13131313-1313-4313-8313-131313131314', '12121212-1212-4212-8212-121212121213', 'LDL Cholesterol', '132', 'mg/dL', '<100', 'high', '2026-05-04T09:00:00Z'),
    ('13131313-1313-4313-8313-131313131315', '12121212-1212-4212-8212-121212121213', 'HDL Cholesterol', '52', 'mg/dL', '>40', 'normal', '2026-05-04T09:00:00Z')
on conflict (id) do update
set lab_order_id = excluded.lab_order_id,
    result_name = excluded.result_name,
    result_value = excluded.result_value,
    unit = excluded.unit,
    reference_range = excluded.reference_range,
    abnormal_flag = excluded.abnormal_flag,
    resulted_at = excluded.resulted_at;

insert into audit_logs (id, user_id, entity_name, entity_id, action, details, action_timestamp)
values
    ('14141414-1414-4414-8414-141414141411', '90000000-0000-4000-8000-000000000001', 'encounters', '55555555-5555-4555-8555-555555555551', 'insert', '{"note":"Encounter signed by attending physician"}', '2026-05-01T09:40:00Z'),
    ('14141414-1414-4414-8414-141414141412', '90000000-0000-4000-8000-000000000002', 'patients', '11111111-1111-4111-8111-111111111111', 'view', '{"screen":"patient_chart"}', '2026-05-01T09:45:00Z'),
    ('14141414-1414-4414-8414-141414141413', '90000000-0000-4000-8000-000000000001', 'lab_orders', '12121212-1212-4212-8212-121212121212', 'update', '{"status_from":"ordered","status_to":"resulted"}', '2026-04-29T08:35:00Z')
on conflict (id) do update
set user_id = excluded.user_id,
    entity_name = excluded.entity_name,
    entity_id = excluded.entity_id,
    action = excluded.action,
    details = excluded.details,
    action_timestamp = excluded.action_timestamp;

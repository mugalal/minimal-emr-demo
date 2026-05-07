-- 1. Patient timeline for a single MRN.
with selected_patient as (
    select id
    from patients
    where mrn = 'MRN-000001'
), timeline as (
    select e.encounter_date as event_time,
           'encounter' as event_type,
           concat('Encounter with Dr. ', d.last_name) as title,
           coalesce(e.chief_complaint, e.assessment, 'No encounter summary recorded.') as details
    from encounters e
    join doctors d on d.id = e.doctor_id
    join selected_patient sp on sp.id = e.patient_id

    union all

    select lo.ordered_at,
           'lab_order',
           lo.test_name,
           concat('Status: ', lo.status)
    from lab_orders lo
    join selected_patient sp on sp.id = lo.patient_id

    union all

    select lr.resulted_at,
           'lab_result',
           concat(lo.test_name, ' - ', lr.result_name),
           concat(lr.result_value, coalesce(' ' || lr.unit, ''), ' [', lr.abnormal_flag, ']')
    from lab_results lr
    join lab_orders lo on lo.id = lr.lab_order_id
    join selected_patient sp on sp.id = lo.patient_id

    union all

    select m.start_date::timestamptz,
           'medication',
           m.medication_name,
           concat(m.dose, ', ', m.route, ', ', m.frequency, ' (', m.status, ')')
    from medications m
    join selected_patient sp on sp.id = m.patient_id
)
select event_time, event_type, title, details
from timeline
order by event_time desc;

-- 2. Active medications by patient.
select p.mrn,
       concat(p.first_name, ' ', p.last_name) as patient_name,
       m.medication_name,
       m.dose,
       m.route,
       m.frequency,
       m.start_date,
       m.instructions
from medications m
join patients p on p.id = m.patient_id
where m.status = 'active'
order by p.last_name, m.medication_name;

-- 3. Most recent lab results.
select p.mrn,
       concat(p.first_name, ' ', p.last_name) as patient_name,
       lo.test_name,
       lr.result_name,
       lr.result_value,
       lr.unit,
       lr.reference_range,
       lr.abnormal_flag,
       lr.resulted_at
from lab_results lr
join lab_orders lo on lo.id = lr.lab_order_id
join patients p on p.id = lo.patient_id
order by lr.resulted_at desc
limit 10;

-- 4. Abnormal lab results only.
select p.mrn,
       concat(p.first_name, ' ', p.last_name) as patient_name,
       lo.test_name,
       lr.result_name,
       lr.result_value,
       lr.unit,
       lr.abnormal_flag,
       lr.resulted_at
from lab_results lr
join lab_orders lo on lo.id = lr.lab_order_id
join patients p on p.id = lo.patient_id
where lr.abnormal_flag in ('abnormal', 'low', 'high', 'critical')
order by lr.resulted_at desc;

-- 5. Scheduled appointments with patient and doctor names.
select a.scheduled_start,
       a.scheduled_end,
       a.status,
       a.reason,
       concat(p.first_name, ' ', p.last_name) as patient_name,
       concat('Dr. ', d.first_name, ' ', d.last_name) as doctor_name,
       d.specialty
from appointments a
join patients p on p.id = a.patient_id
join doctors d on d.id = a.doctor_id
where a.status = 'scheduled'
order by a.scheduled_start;

-- 6. Active allergy summary by patient.
select p.mrn,
       concat(p.first_name, ' ', p.last_name) as patient_name,
       string_agg(concat(al.allergen, ' (', al.severity, ')'), ', ' order by al.allergen) as active_allergies
from patients p
left join allergies al
    on al.patient_id = p.id
   and al.status = 'active'
group by p.mrn, p.first_name, p.last_name
order by p.last_name;

-- 7. Diagnosis volume by doctor.
select concat('Dr. ', d.first_name, ' ', d.last_name) as doctor_name,
       d.specialty,
       count(di.id) as diagnosis_count,
       count(distinct e.id) as encounter_count
from doctors d
left join encounters e on e.doctor_id = d.id
left join diagnoses di on di.encounter_id = e.id
group by d.first_name, d.last_name, d.specialty
order by diagnosis_count desc, doctor_name;

-- 8. Recent audit activity.
select al.action_timestamp,
       u.username,
       u.role,
       al.entity_name,
       al.entity_id,
       al.action,
       al.details
from audit_logs al
join emr_users u on u.id = al.user_id
order by al.action_timestamp desc;

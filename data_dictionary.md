# Minimal EMR Data Dictionary

`emr_users` is used instead of `users` in PostgreSQL to avoid confusion with Supabase auth tables.

| Entity | Purpose | PK | Foreign Keys | Required Fields | Unique / Important Rules |
| --- | --- | --- | --- | --- | --- |
| `patients` | Master patient demographic record | `id` | None | `mrn`, `first_name`, `last_name`, `date_of_birth`, `sex` | `mrn` unique; `sex` constrained to known values |
| `doctors` | Provider directory | `id` | None | `license_number`, `first_name`, `last_name`, `specialty` | `license_number` unique |
| `emr_users` | Application users for auditing and role tracking | `id` | None | `username`, `full_name`, `role`, `email` | `username` unique; `email` unique |
| `appointments` | Scheduled visits between patients and doctors | `id` | `patient_id -> patients.id`, `doctor_id -> doctors.id` | `patient_id`, `doctor_id`, `scheduled_start`, `scheduled_end`, `status` | `scheduled_end` must be after `scheduled_start` |
| `encounters` | Clinical visit documentation | `id` | `patient_id -> patients.id`, `doctor_id -> doctors.id`, `appointment_id -> appointments.id` | `patient_id`, `doctor_id`, `encounter_date`, `encounter_type`, `status` | `appointment_id` unique to enforce one encounter per appointment |
| `diagnoses` | Diagnoses attached to a single encounter | `id` | `encounter_id -> encounters.id` | `encounter_id`, `icd10_code`, `diagnosis_name`, `status` | One ICD-10 code per encounter is unique |
| `medications` | Prescribed medications for a patient, usually started during an encounter | `id` | `patient_id -> patients.id`, `encounter_id -> encounters.id` | `patient_id`, `encounter_id`, `medication_name`, `dose`, `route`, `frequency`, `start_date`, `status` | `end_date` cannot be before `start_date` |
| `allergies` | Patient allergy list | `id` | `patient_id -> patients.id` | `patient_id`, `allergen`, `severity`, `status` | Severity and status constrained |
| `vitals` | One vital-sign snapshot per encounter | `id` | `encounter_id -> encounters.id` | `encounter_id`, `recorded_at` | `encounter_id` unique; numeric ranges checked |
| `lab_orders` | Ordered lab studies | `id` | `patient_id -> patients.id`, `encounter_id -> encounters.id`, `ordering_doctor_id -> doctors.id` | `patient_id`, `encounter_id`, `ordering_doctor_id`, `test_name`, `priority`, `status`, `ordered_at` | Priority and status constrained |
| `lab_results` | Result rows belonging to a lab order | `id` | `lab_order_id -> lab_orders.id` | `lab_order_id`, `result_name`, `result_value`, `abnormal_flag`, `resulted_at` | One result name per lab order is unique |
| `audit_logs` | Append-only activity trail for compliance/demo evidence | `id` | `user_id -> emr_users.id` | `user_id`, `entity_name`, `entity_id`, `action` | `details` stored as JSONB; indexed by entity and timestamp |

## Cardinality Summary

| Relationship | Cardinality |
| --- | --- |
| Patient to appointments | One-to-many |
| Doctor to appointments | One-to-many |
| Patient to encounters | One-to-many |
| Doctor to encounters | One-to-many |
| Appointment to encounter | One-to-zero-or-one |
| Encounter to diagnoses | One-to-many |
| Encounter to vitals | One-to-one |
| Encounter to medications | One-to-many |
| Encounter to lab orders | One-to-many |
| Lab order to lab results | One-to-many |
| Patient to allergies | One-to-many |
| User to audit logs | One-to-many |

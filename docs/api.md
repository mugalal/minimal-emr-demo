# API Overview

The Express backend exposes a small read-only API for the frontend.

## Endpoints

### `GET /api/health`

Returns application status and whether PostgreSQL and MongoDB runtime configuration are available.

Example response:

```json
{
  "application": "Minimal EMR Demo",
  "status": "ok",
  "checkedAt": "2026-05-07T12:00:00.000Z",
  "dataSources": {
    "postgres": {
      "configured": true,
      "runtimeKey": "anon"
    },
    "mongo": {
      "configured": false,
      "mode": "scripts-only"
    }
  }
}
```

### `GET /api/dashboard`

Returns global dashboard data for the app homepage.

Includes:

- top-level metrics
- spotlight patients
- scheduled appointments
- abnormal lab results

### `GET /api/patients`

Returns patient summaries for the left-side explorer.

Optional query string:

- `search`: filters by patient name, MRN, location, and scenario text

### `POST /api/patients`

Creates a new patient record.

Expected body:

```json
{
  "firstName": "Sara",
  "lastName": "Bennett",
  "dateOfBirth": "1991-06-14",
  "sex": "female",
  "phone": "555-700-1001",
  "email": "sara.bennett@example.com",
  "city": "Austin",
  "state": "TX"
}
```

### `PATCH /api/patients/:patientId`

Updates patient demographics and contact information.

### `GET /api/patients/:patientId/chart`

Returns the full chart view for a single patient.

Includes:

- demographics
- story summary
- chart metrics
- clinical alerts
- allergies
- enriched encounters
- medications
- lab orders with results
- appointments

### `POST /api/patients/:patientId/allergies`

Creates a new allergy record for a patient.

### `PATCH /api/allergies/:allergyId`

Updates an allergy record. The current UI uses this to mark allergies inactive instead of deleting them.

### `POST /api/patients/:patientId/encounters`

Creates an encounter note for a patient.

The payload can include:

- encounter metadata
- note text
- one primary diagnosis
- an optional vital-sign snapshot

### `POST /api/patients/:patientId/medications`

Creates a medication tied to an existing encounter.

### `PATCH /api/medications/:medicationId`

Updates an existing medication. The current UI uses this to stop active medications.

### `POST /api/patients/:patientId/appointments`

Creates a new scheduled appointment for the selected patient.

Expected body:

```json
{
  "doctorId": "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  "scheduledStart": "2026-05-20T09:00",
  "scheduledEnd": "2026-05-20T09:30",
  "reason": "Backend verification follow-up"
}
```

### `PATCH /api/appointments/:appointmentId`

Updates an existing appointment.

Supported fields:

- `doctorId`
- `scheduledStart`
- `scheduledEnd`
- `reason`
- `status`

Typical use cases:

- reschedule an appointment
- change the assigned doctor
- cancel an appointment by setting `status` to `cancelled`

## Design Choice

The backend started as a read-only API and was expanded with a small set of write workflows that are realistic for a minimal EMR demo. The current implementation supports patient administration, appointment changes, allergy management, medication updates, and basic encounter creation without introducing full authentication and authorization complexity.

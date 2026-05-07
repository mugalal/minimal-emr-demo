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

The backend started as a read-only API on purpose. It now includes appointment editing as the first mutation workflow, which keeps the project more realistic while still avoiding a large amount of authentication and role-management complexity.

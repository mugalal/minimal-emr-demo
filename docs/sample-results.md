# Sample Query Results

This document shows example outputs based on the seeded demo data so a reviewer can understand what the project produces without running it immediately.

## PostgreSQL Examples

### Active Medications

| MRN | Patient | Medication | Dose | Frequency | Status |
| --- | --- | --- | --- | --- | --- |
| `MRN-000002` | Michael Johnson | Lisinopril | 10 mg | once daily | active |
| `MRN-000002` | Michael Johnson | Metformin | 500 mg | twice daily | active |

### Scheduled Appointment

| Patient | Doctor | Start | Reason |
| --- | --- | --- | --- |
| Elena Garcia | Dr. Aisha Patel | 2026-05-15 10:30 UTC | Post-treatment follow-up |

### Abnormal Lab Results

| Patient | Test | Result | Flag |
| --- | --- | --- | --- |
| Priya Nair | Lipid Panel / LDL Cholesterol | 132 mg/dL | high |
| Elena Garcia | Complete Blood Count / WBC | 11.2 10^3/uL | high |
| Michael Johnson | Hemoglobin A1c / HbA1c | 7.4% | high |

## MongoDB Examples

### Patient Summary by MRN

```javascript
{
  _id: '11111111-1111-4111-8111-111111111111',
  mrn: 'MRN-000001',
  firstName: 'Elena',
  lastName: 'Garcia',
  sex: 'female',
  allergies: [
    {
      allergen: 'Penicillin',
      severity: 'severe',
      status: 'active'
    }
  ]
}
```

### Encounter Timeline Summary

```javascript
[
  {
    encounterDate: ISODate('2026-05-01T09:10:00.000Z'),
    encounterType: 'office_visit',
    chiefComplaint: 'Sore throat for 4 days',
    diagnoses: ['Acute pharyngitis, unspecified'],
    medicationCount: 1
  }
]
```

### Diagnosis Count by Doctor

```javascript
[
  { _id: 'Dr. Aisha Patel', diagnosisCount: 2, encounterCount: 2 },
  { _id: 'Dr. Marcus Chen', diagnosisCount: 2, encounterCount: 1 }
]
```

## Why This Matters

The sample outputs help demonstrate that the data model is not just theoretical. The repository includes enough structure and seeded content to support meaningful clinical views in both relational and document-oriented styles.

const emr = db.getSiblingDB("minimal_emr");

function upsertMany(collectionName, docs) {
  if (!docs.length) {
    return;
  }

  const operations = docs.map((doc) => ({
    replaceOne: {
      filter: { _id: doc._id },
      replacement: doc,
      upsert: true,
    },
  }));

  emr.getCollection(collectionName).bulkWrite(operations, { ordered: true });
}

const users = [
  {
    _id: "90000000-0000-4000-8000-000000000001",
    username: "apatel",
    fullName: "Dr. Aisha Patel",
    role: "doctor",
    email: "aisha.patel@demo-emr.local",
    isActive: true,
    createdAt: new Date("2026-04-01T08:00:00Z"),
  },
  {
    _id: "90000000-0000-4000-8000-000000000002",
    username: "nrivera",
    fullName: "Nurse Nina Rivera",
    role: "nurse",
    email: "nina.rivera@demo-emr.local",
    isActive: true,
    createdAt: new Date("2026-04-01T08:15:00Z"),
  },
];

const doctors = [
  {
    _id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    licenseNumber: "LIC-1001",
    firstName: "Aisha",
    lastName: "Patel",
    specialty: "Family Medicine",
    phone: "555-100-2001",
    email: "aisha.patel@demo-emr.local",
    createdAt: new Date("2026-04-01T08:00:00Z"),
  },
  {
    _id: "bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    licenseNumber: "LIC-1002",
    firstName: "Marcus",
    lastName: "Chen",
    specialty: "Internal Medicine",
    phone: "555-100-2002",
    email: "marcus.chen@demo-emr.local",
    createdAt: new Date("2026-04-01T08:05:00Z"),
  },
];

const patients = [
  {
    _id: "11111111-1111-4111-8111-111111111111",
    mrn: "MRN-000001",
    firstName: "Elena",
    lastName: "Garcia",
    dateOfBirth: new Date("1988-04-12T00:00:00Z"),
    sex: "female",
    phone: "555-200-3001",
    email: "elena.garcia@example.com",
    address: {
      line1: "124 Cedar Ave",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
    },
    allergies: [
      {
        allergyId: "88888888-8888-4888-8888-888888888881",
        allergen: "Penicillin",
        reaction: "Diffuse rash",
        severity: "severe",
        status: "active",
        notes: "Avoid beta-lactam antibiotics until formally reviewed.",
        recordedAt: new Date("2025-10-11T10:00:00Z"),
      },
    ],
    createdAt: new Date("2026-04-01T09:00:00Z"),
    updatedAt: new Date("2026-05-01T09:45:00Z"),
  },
  {
    _id: "22222222-2222-4222-8222-222222222222",
    mrn: "MRN-000002",
    firstName: "Michael",
    lastName: "Johnson",
    dateOfBirth: new Date("1976-09-23T00:00:00Z"),
    sex: "male",
    phone: "555-200-3002",
    email: "michael.johnson@example.com",
    address: {
      line1: "98 Oak Street",
      city: "Dallas",
      state: "TX",
      postalCode: "75201",
    },
    allergies: [
      {
        allergyId: "88888888-8888-4888-8888-888888888882",
        allergen: "Peanuts",
        reaction: "Anaphylaxis",
        severity: "severe",
        status: "active",
        notes: "Carries epinephrine autoinjector.",
        recordedAt: new Date("2022-02-14T15:00:00Z"),
      },
    ],
    createdAt: new Date("2026-04-01T09:05:00Z"),
    updatedAt: new Date("2026-04-29T08:35:00Z"),
  },
  {
    _id: "33333333-3333-4333-8333-333333333333",
    mrn: "MRN-000003",
    firstName: "Priya",
    lastName: "Nair",
    dateOfBirth: new Date("1993-01-05T00:00:00Z"),
    sex: "female",
    phone: "555-200-3003",
    email: "priya.nair@example.com",
    address: {
      line1: "56 Maple Lane",
      city: "Houston",
      state: "TX",
      postalCode: "77002",
    },
    allergies: [
      {
        allergyId: "88888888-8888-4888-8888-888888888883",
        allergen: "Latex",
        reaction: "Skin irritation",
        severity: "mild",
        status: "active",
        notes: "Use non-latex gloves when possible.",
        recordedAt: new Date("2024-07-09T13:30:00Z"),
      },
    ],
    createdAt: new Date("2026-04-01T09:10:00Z"),
    updatedAt: new Date("2026-05-04T09:00:00Z"),
  },
];

const appointments = [
  {
    _id: "44444444-4444-4444-8444-444444444441",
    patientId: "11111111-1111-4111-8111-111111111111",
    doctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    scheduledStart: new Date("2026-05-01T09:00:00Z"),
    scheduledEnd: new Date("2026-05-01T09:30:00Z"),
    status: "completed",
    reason: "Sore throat and fever",
    createdAt: new Date("2026-04-29T13:00:00Z"),
  },
  {
    _id: "44444444-4444-4444-8444-444444444442",
    patientId: "22222222-2222-4222-8222-222222222222",
    doctorId: "bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    scheduledStart: new Date("2026-04-28T14:00:00Z"),
    scheduledEnd: new Date("2026-04-28T14:30:00Z"),
    status: "completed",
    reason: "Hypertension follow-up",
    createdAt: new Date("2026-04-20T10:00:00Z"),
  },
  {
    _id: "44444444-4444-4444-8444-444444444443",
    patientId: "33333333-3333-4333-8333-333333333333",
    doctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    scheduledStart: new Date("2026-05-03T11:00:00Z"),
    scheduledEnd: new Date("2026-05-03T11:45:00Z"),
    status: "completed",
    reason: "Annual wellness exam",
    createdAt: new Date("2026-04-25T12:00:00Z"),
  },
  {
    _id: "44444444-4444-4444-8444-444444444444",
    patientId: "11111111-1111-4111-8111-111111111111",
    doctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    scheduledStart: new Date("2026-05-15T10:30:00Z"),
    scheduledEnd: new Date("2026-05-15T10:45:00Z"),
    status: "scheduled",
    reason: "Post-treatment follow-up",
    createdAt: new Date("2026-05-01T09:35:00Z"),
  },
];

const encounters = [
  {
    _id: "55555555-5555-4555-8555-555555555551",
    patientId: "11111111-1111-4111-8111-111111111111",
    doctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    appointmentId: "44444444-4444-4444-8444-444444444441",
    encounterDate: new Date("2026-05-01T09:10:00Z"),
    encounterType: "office_visit",
    chiefComplaint: "Sore throat for 4 days",
    assessment: "Likely bacterial pharyngitis without airway compromise.",
    plan: "Start azithromycin, increase fluids, and review CBC.",
    status: "signed",
    diagnoses: [
      {
        diagnosisId: "66666666-6666-4666-8666-666666666661",
        icd10Code: "J02.9",
        name: "Acute pharyngitis, unspecified",
        isPrimary: true,
        status: "active",
        onsetDate: new Date("2026-05-01T00:00:00Z"),
        resolutionDate: null,
      },
    ],
    vitals: {
      vitalId: "99999999-9999-4999-8999-999999999991",
      recordedAt: new Date("2026-05-01T09:05:00Z"),
      heightCm: 165,
      weightKg: 68.2,
      bmi: 25.1,
      systolicBp: 118,
      diastolicBp: 76,
      heartRate: 82,
      respiratoryRate: 18,
      temperatureC: 38.1,
      oxygenSaturation: 98,
    },
    medications: [
      {
        medicationId: "77777777-7777-4777-8777-777777777771",
        medicationName: "Azithromycin",
        dose: "500 mg",
        route: "oral",
        frequency: "once daily",
        startDate: new Date("2026-05-01T00:00:00Z"),
        endDate: new Date("2026-05-03T00:00:00Z"),
        status: "completed",
        instructions: "Take after food for 3 days.",
      },
    ],
    createdAt: new Date("2026-05-01T09:40:00Z"),
  },
  {
    _id: "55555555-5555-4555-8555-555555555552",
    patientId: "22222222-2222-4222-8222-222222222222",
    doctorId: "bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    appointmentId: "44444444-4444-4444-8444-444444444442",
    encounterDate: new Date("2026-04-28T14:10:00Z"),
    encounterType: "follow_up",
    chiefComplaint: "Blood pressure review and diabetes follow-up",
    assessment: "Hypertension remains stable; diabetes control above goal.",
    plan: "Continue lisinopril and metformin, repeat A1c in 3 months.",
    status: "signed",
    diagnoses: [
      {
        diagnosisId: "66666666-6666-4666-8666-666666666662",
        icd10Code: "I10",
        name: "Essential (primary) hypertension",
        isPrimary: true,
        status: "active",
        onsetDate: new Date("2021-06-01T00:00:00Z"),
        resolutionDate: null,
      },
      {
        diagnosisId: "66666666-6666-4666-8666-666666666663",
        icd10Code: "E11.9",
        name: "Type 2 diabetes mellitus without complications",
        isPrimary: false,
        status: "active",
        onsetDate: new Date("2020-03-15T00:00:00Z"),
        resolutionDate: null,
      },
    ],
    vitals: {
      vitalId: "99999999-9999-4999-8999-999999999992",
      recordedAt: new Date("2026-04-28T14:05:00Z"),
      heightCm: 178,
      weightKg: 92.1,
      bmi: 29.1,
      systolicBp: 132,
      diastolicBp: 84,
      heartRate: 74,
      respiratoryRate: 16,
      temperatureC: 36.8,
      oxygenSaturation: 97,
    },
    medications: [
      {
        medicationId: "77777777-7777-4777-8777-777777777772",
        medicationName: "Lisinopril",
        dose: "10 mg",
        route: "oral",
        frequency: "once daily",
        startDate: new Date("2024-01-10T00:00:00Z"),
        endDate: null,
        status: "active",
        instructions: "Monitor blood pressure at home.",
      },
      {
        medicationId: "77777777-7777-4777-8777-777777777773",
        medicationName: "Metformin",
        dose: "500 mg",
        route: "oral",
        frequency: "twice daily",
        startDate: new Date("2024-01-10T00:00:00Z"),
        endDate: null,
        status: "active",
        instructions: "Take with breakfast and dinner.",
      },
    ],
    createdAt: new Date("2026-04-28T14:35:00Z"),
  },
  {
    _id: "55555555-5555-4555-8555-555555555553",
    patientId: "33333333-3333-4333-8333-333333333333",
    doctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    appointmentId: "44444444-4444-4444-8444-444444444443",
    encounterDate: new Date("2026-05-03T11:15:00Z"),
    encounterType: "annual_exam",
    chiefComplaint: "Routine preventive visit",
    assessment: "Overall well exam with borderline lipids.",
    plan: "Discuss diet, exercise, and lipid panel follow-up in 6 months.",
    status: "signed",
    diagnoses: [
      {
        diagnosisId: "66666666-6666-4666-8666-666666666664",
        icd10Code: "Z00.00",
        name: "Encounter for general adult medical examination without abnormal findings",
        isPrimary: true,
        status: "active",
        onsetDate: new Date("2026-05-03T00:00:00Z"),
        resolutionDate: null,
      },
    ],
    vitals: {
      vitalId: "99999999-9999-4999-8999-999999999993",
      recordedAt: new Date("2026-05-03T11:05:00Z"),
      heightCm: 162,
      weightKg: 60.3,
      bmi: 23,
      systolicBp: 110,
      diastolicBp: 70,
      heartRate: 69,
      respiratoryRate: 15,
      temperatureC: 36.7,
      oxygenSaturation: 99,
    },
    medications: [],
    createdAt: new Date("2026-05-03T11:50:00Z"),
  },
];

const labOrders = [
  {
    _id: "12121212-1212-4212-8212-121212121211",
    patientId: "11111111-1111-4111-8111-111111111111",
    encounterId: "55555555-5555-4555-8555-555555555551",
    orderingDoctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    testName: "Complete Blood Count",
    loincCode: "57021-8",
    priority: "routine",
    status: "resulted",
    orderedAt: new Date("2026-05-01T09:20:00Z"),
    results: [
      {
        labResultId: "13131313-1313-4313-8313-131313131311",
        resultName: "WBC",
        resultValue: "11.2",
        unit: "10^3/uL",
        referenceRange: "4.0-10.5",
        abnormalFlag: "high",
        resultedAt: new Date("2026-05-01T17:00:00Z"),
      },
      {
        labResultId: "13131313-1313-4313-8313-131313131312",
        resultName: "Hemoglobin",
        resultValue: "13.4",
        unit: "g/dL",
        referenceRange: "12.0-15.5",
        abnormalFlag: "normal",
        resultedAt: new Date("2026-05-01T17:00:00Z"),
      },
    ],
  },
  {
    _id: "12121212-1212-4212-8212-121212121212",
    patientId: "22222222-2222-4222-8222-222222222222",
    encounterId: "55555555-5555-4555-8555-555555555552",
    orderingDoctorId: "bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    testName: "Hemoglobin A1c",
    loincCode: "4548-4",
    priority: "routine",
    status: "resulted",
    orderedAt: new Date("2026-04-28T14:20:00Z"),
    results: [
      {
        labResultId: "13131313-1313-4313-8313-131313131313",
        resultName: "HbA1c",
        resultValue: "7.4",
        unit: "%",
        referenceRange: "4.0-5.6",
        abnormalFlag: "high",
        resultedAt: new Date("2026-04-29T08:30:00Z"),
      },
    ],
  },
  {
    _id: "12121212-1212-4212-8212-121212121213",
    patientId: "33333333-3333-4333-8333-333333333333",
    encounterId: "55555555-5555-4555-8555-555555555553",
    orderingDoctorId: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    testName: "Lipid Panel",
    loincCode: "24331-1",
    priority: "routine",
    status: "resulted",
    orderedAt: new Date("2026-05-03T11:25:00Z"),
    results: [
      {
        labResultId: "13131313-1313-4313-8313-131313131314",
        resultName: "LDL Cholesterol",
        resultValue: "132",
        unit: "mg/dL",
        referenceRange: "<100",
        abnormalFlag: "high",
        resultedAt: new Date("2026-05-04T09:00:00Z"),
      },
      {
        labResultId: "13131313-1313-4313-8313-131313131315",
        resultName: "HDL Cholesterol",
        resultValue: "52",
        unit: "mg/dL",
        referenceRange: ">40",
        abnormalFlag: "normal",
        resultedAt: new Date("2026-05-04T09:00:00Z"),
      },
    ],
  },
];

const auditLogs = [
  {
    _id: "14141414-1414-4414-8414-141414141411",
    userId: "90000000-0000-4000-8000-000000000001",
    entityName: "encounters",
    entityId: "55555555-5555-4555-8555-555555555551",
    action: "insert",
    details: {
      note: "Encounter signed by attending physician",
    },
    actionTimestamp: new Date("2026-05-01T09:40:00Z"),
  },
  {
    _id: "14141414-1414-4414-8414-141414141412",
    userId: "90000000-0000-4000-8000-000000000002",
    entityName: "patients",
    entityId: "11111111-1111-4111-8111-111111111111",
    action: "view",
    details: {
      screen: "patient_chart",
    },
    actionTimestamp: new Date("2026-05-01T09:45:00Z"),
  },
  {
    _id: "14141414-1414-4414-8414-141414141413",
    userId: "90000000-0000-4000-8000-000000000001",
    entityName: "lab_orders",
    entityId: "12121212-1212-4212-8212-121212121212",
    action: "update",
    details: {
      statusFrom: "ordered",
      statusTo: "resulted",
    },
    actionTimestamp: new Date("2026-04-29T08:35:00Z"),
  },
];

upsertMany("users", users);
upsertMany("doctors", doctors);
upsertMany("patients", patients);
upsertMany("appointments", appointments);
upsertMany("encounters", encounters);
upsertMany("lab_orders", labOrders);
upsertMany("audit_logs", auditLogs);

print("Mongo seed data upserted into minimal_emr.");

const emr = db.getSiblingDB("minimal_emr");

function ensureCollection(name, validator) {
  const exists = emr.getCollectionInfos({ name }).length > 0;

  if (!exists) {
    emr.createCollection(name, {
      validator,
      validationLevel: "moderate",
    });
    return;
  }

  emr.runCommand({
    collMod: name,
    validator,
    validationLevel: "moderate",
  });
}

function ensureIndex(collectionName, keys, options = {}) {
  emr.getCollection(collectionName).createIndex(keys, options);
}

ensureCollection("patients", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "mrn", "firstName", "lastName", "dateOfBirth", "sex", "allergies"],
    properties: {
      _id: { bsonType: "string" },
      mrn: { bsonType: "string" },
      firstName: { bsonType: "string" },
      lastName: { bsonType: "string" },
      dateOfBirth: { bsonType: "date" },
      sex: { enum: ["female", "male", "other", "unknown"] },
      phone: { bsonType: ["string", "null"] },
      email: { bsonType: ["string", "null"] },
      address: {
        bsonType: "object",
        properties: {
          line1: { bsonType: ["string", "null"] },
          city: { bsonType: ["string", "null"] },
          state: { bsonType: ["string", "null"] },
          postalCode: { bsonType: ["string", "null"] },
        },
      },
      allergies: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["allergyId", "allergen", "severity", "status", "recordedAt"],
          properties: {
            allergyId: { bsonType: "string" },
            allergen: { bsonType: "string" },
            reaction: { bsonType: ["string", "null"] },
            severity: { enum: ["mild", "moderate", "severe"] },
            status: { enum: ["active", "inactive", "entered_in_error"] },
            notes: { bsonType: ["string", "null"] },
            recordedAt: { bsonType: "date" },
          },
        },
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
});

ensureCollection("doctors", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "licenseNumber", "firstName", "lastName", "specialty"],
    properties: {
      _id: { bsonType: "string" },
      licenseNumber: { bsonType: "string" },
      firstName: { bsonType: "string" },
      lastName: { bsonType: "string" },
      specialty: { bsonType: "string" },
      phone: { bsonType: ["string", "null"] },
      email: { bsonType: ["string", "null"] },
      createdAt: { bsonType: "date" },
    },
  },
});

ensureCollection("users", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "username", "fullName", "role", "email", "isActive"],
    properties: {
      _id: { bsonType: "string" },
      username: { bsonType: "string" },
      fullName: { bsonType: "string" },
      role: { enum: ["admin", "doctor", "nurse", "lab_tech", "scheduler"] },
      email: { bsonType: "string" },
      isActive: { bsonType: "bool" },
      createdAt: { bsonType: "date" },
    },
  },
});

ensureCollection("appointments", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "patientId", "doctorId", "scheduledStart", "scheduledEnd", "status"],
    properties: {
      _id: { bsonType: "string" },
      patientId: { bsonType: "string" },
      doctorId: { bsonType: "string" },
      scheduledStart: { bsonType: "date" },
      scheduledEnd: { bsonType: "date" },
      status: { enum: ["scheduled", "checked_in", "completed", "cancelled", "no_show"] },
      reason: { bsonType: ["string", "null"] },
      createdAt: { bsonType: "date" },
    },
  },
});

ensureCollection("encounters", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "patientId", "doctorId", "encounterDate", "encounterType", "status", "diagnoses", "vitals", "medications"],
    properties: {
      _id: { bsonType: "string" },
      patientId: { bsonType: "string" },
      doctorId: { bsonType: "string" },
      appointmentId: { bsonType: ["string", "null"] },
      encounterDate: { bsonType: "date" },
      encounterType: { enum: ["office_visit", "follow_up", "annual_exam", "telehealth"] },
      chiefComplaint: { bsonType: ["string", "null"] },
      assessment: { bsonType: ["string", "null"] },
      plan: { bsonType: ["string", "null"] },
      status: { enum: ["open", "signed", "amended"] },
      diagnoses: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["diagnosisId", "icd10Code", "name", "isPrimary", "status"],
          properties: {
            diagnosisId: { bsonType: "string" },
            icd10Code: { bsonType: "string" },
            name: { bsonType: "string" },
            isPrimary: { bsonType: "bool" },
            status: { enum: ["active", "resolved"] },
            onsetDate: { bsonType: ["date", "null"] },
            resolutionDate: { bsonType: ["date", "null"] },
          },
        },
      },
      vitals: {
        bsonType: "object",
        required: ["vitalId", "recordedAt"],
        properties: {
          vitalId: { bsonType: "string" },
          recordedAt: { bsonType: "date" },
          heightCm: { bsonType: ["double", "int", "null"] },
          weightKg: { bsonType: ["double", "int", "null"] },
          bmi: { bsonType: ["double", "int", "null"] },
          systolicBp: { bsonType: ["int", "null"] },
          diastolicBp: { bsonType: ["int", "null"] },
          heartRate: { bsonType: ["int", "null"] },
          respiratoryRate: { bsonType: ["int", "null"] },
          temperatureC: { bsonType: ["double", "int", "null"] },
          oxygenSaturation: { bsonType: ["int", "null"] },
        },
      },
      medications: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["medicationId", "medicationName", "dose", "route", "frequency", "startDate", "status"],
          properties: {
            medicationId: { bsonType: "string" },
            medicationName: { bsonType: "string" },
            dose: { bsonType: "string" },
            route: { bsonType: "string" },
            frequency: { bsonType: "string" },
            startDate: { bsonType: "date" },
            endDate: { bsonType: ["date", "null"] },
            status: { enum: ["active", "held", "stopped", "completed"] },
            instructions: { bsonType: ["string", "null"] },
          },
        },
      },
      createdAt: { bsonType: "date" },
    },
  },
});

ensureCollection("lab_orders", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "patientId", "encounterId", "orderingDoctorId", "testName", "priority", "status", "orderedAt", "results"],
    properties: {
      _id: { bsonType: "string" },
      patientId: { bsonType: "string" },
      encounterId: { bsonType: "string" },
      orderingDoctorId: { bsonType: "string" },
      testName: { bsonType: "string" },
      loincCode: { bsonType: ["string", "null"] },
      priority: { enum: ["routine", "urgent", "stat"] },
      status: { enum: ["ordered", "collected", "resulted", "cancelled"] },
      orderedAt: { bsonType: "date" },
      results: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["labResultId", "resultName", "resultValue", "abnormalFlag", "resultedAt"],
          properties: {
            labResultId: { bsonType: "string" },
            resultName: { bsonType: "string" },
            resultValue: { bsonType: "string" },
            unit: { bsonType: ["string", "null"] },
            referenceRange: { bsonType: ["string", "null"] },
            abnormalFlag: { enum: ["normal", "abnormal", "low", "high", "critical"] },
            resultedAt: { bsonType: "date" },
          },
        },
      },
    },
  },
});

ensureCollection("audit_logs", {
  $jsonSchema: {
    bsonType: "object",
    required: ["_id", "userId", "entityName", "entityId", "action", "actionTimestamp"],
    properties: {
      _id: { bsonType: "string" },
      userId: { bsonType: "string" },
      entityName: { bsonType: "string" },
      entityId: { bsonType: "string" },
      action: { enum: ["insert", "update", "delete", "view", "login", "logout"] },
      details: { bsonType: ["object", "null"] },
      actionTimestamp: { bsonType: "date" },
    },
  },
});

ensureIndex("patients", { mrn: 1 }, { unique: true, name: "ux_patients_mrn" });
ensureIndex("doctors", { licenseNumber: 1 }, { unique: true, name: "ux_doctors_license_number" });
ensureIndex("users", { username: 1 }, { unique: true, name: "ux_users_username" });
ensureIndex("users", { email: 1 }, { unique: true, name: "ux_users_email" });
ensureIndex("appointments", { patientId: 1, scheduledStart: -1 }, { name: "idx_appointments_patient_start" });
ensureIndex("appointments", { doctorId: 1, scheduledStart: 1 }, { name: "idx_appointments_doctor_start" });
ensureIndex("encounters", { patientId: 1, encounterDate: -1 }, { name: "idx_encounters_patient_date" });
ensureIndex("encounters", { doctorId: 1, encounterDate: -1 }, { name: "idx_encounters_doctor_date" });
ensureIndex("lab_orders", { patientId: 1, orderedAt: -1 }, { name: "idx_lab_orders_patient_date" });
ensureIndex("lab_orders", { orderingDoctorId: 1, orderedAt: -1 }, { name: "idx_lab_orders_doctor_date" });
ensureIndex("lab_orders", { "results.abnormalFlag": 1, "results.resultedAt": -1 }, { name: "idx_lab_orders_result_flags" });
ensureIndex("audit_logs", { entityName: 1, entityId: 1, actionTimestamp: -1 }, { name: "idx_audit_logs_entity" });
ensureIndex("audit_logs", { userId: 1, actionTimestamp: -1 }, { name: "idx_audit_logs_user_time" });

print("Mongo validators and indexes applied to minimal_emr.");

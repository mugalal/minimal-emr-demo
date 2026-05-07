import { getCaseStory } from "./case-stories.js";
import { getSupabaseClient } from "./supabase.js";

const ABNORMAL_FLAGS = ["abnormal", "low", "high", "critical"];
const APPOINTMENT_STATUSES = ["scheduled", "checked_in", "completed", "cancelled", "no_show"];
const SYSTEM_USER_ID = "90000000-0000-4000-8000-000000000001";

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function calculateAge(dateValue) {
  const birthDate = new Date(dateValue);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function formatLocation(city, state) {
  return [city, state].filter(Boolean).join(", ") || "Location not recorded";
}

function formatDoctorName(doctor) {
  return `Dr. ${doctor.first_name} ${doctor.last_name}`;
}

function normalizeReason(value, { required }) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed && required) {
    throw createHttpError("Appointment reason is required.", 400);
  }

  return trimmed || null;
}

function normalizeDateTimeInput(value, fieldName) {
  if (!value) {
    throw createHttpError(`${fieldName} is required.`, 400);
  }

  const normalized = new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw createHttpError(`${fieldName} is invalid.`, 400);
  }

  return normalized.toISOString();
}

function validateAppointmentWindow(start, end) {
  if (new Date(end) <= new Date(start)) {
    throw createHttpError("Appointment end time must be after the start time.", 400);
  }
}

function getScheduledStart(appointment) {
  return appointment.scheduledStart ?? appointment.scheduled_start ?? null;
}

function groupBy(items, key) {
  return items.reduce((map, item) => {
    const bucket = map.get(item[key]) ?? [];
    bucket.push(item);
    map.set(item[key], bucket);
    return map;
  }, new Map());
}

function indexBy(items, key) {
  return new Map(items.map((item) => [item[key], item]));
}

function getLatestDate(items, key) {
  if (!items.length) {
    return null;
  }

  return items
    .map((item) => item[key])
    .filter(Boolean)
    .sort((left, right) => new Date(right) - new Date(left))[0] ?? null;
}

function getNextScheduledAppointment(appointments) {
  return appointments
    .filter((appointment) => appointment.status === "scheduled")
    .sort((left, right) => new Date(getScheduledStart(left)) - new Date(getScheduledStart(right)))[0] ?? null;
}

function mapDoctorDirectory(doctors) {
  return [...doctors]
    .sort((left, right) => `${left.last_name}${left.first_name}`.localeCompare(`${right.last_name}${right.first_name}`))
    .map((doctor) => ({
      id: doctor.id,
      fullName: formatDoctorName(doctor),
      specialty: doctor.specialty,
    }));
}

function mapAppointmentView(appointment, doctorsById) {
  const doctor = doctorsById.get(appointment.doctor_id);

  return {
    id: appointment.id,
    doctorId: appointment.doctor_id,
    scheduledStart: appointment.scheduled_start,
    scheduledEnd: appointment.scheduled_end,
    status: appointment.status,
    reason: appointment.reason,
    doctorName: doctor ? formatDoctorName(doctor) : "Unknown doctor",
    doctorSpecialty: doctor?.specialty ?? "Unknown specialty",
  };
}

function buildPatientSummary(patient, context) {
  const story = getCaseStory(patient.mrn);
  const patientEncounters = context.encountersByPatient.get(patient.id) ?? [];
  const activeMedicationCount = context.activeMedicationCountByPatient.get(patient.id) ?? 0;
  const abnormalLabCount = context.abnormalLabCountByPatient.get(patient.id) ?? 0;
  const patientAppointments = context.appointmentsByPatient.get(patient.id) ?? [];
  const nextAppointment = getNextScheduledAppointment(patientAppointments);

  return {
    id: patient.id,
    mrn: patient.mrn,
    firstName: patient.first_name,
    lastName: patient.last_name,
    fullName: `${patient.first_name} ${patient.last_name}`,
    age: calculateAge(patient.date_of_birth),
    sex: patient.sex,
    location: formatLocation(patient.city, patient.state),
    lastEncounterAt: getLatestDate(patientEncounters, "encounter_date"),
    nextAppointmentAt: nextAppointment ? getScheduledStart(nextAppointment) : null,
    activeMedicationCount,
    abnormalLabCount,
    scheduledAppointmentCount: patientAppointments.filter((appointment) => appointment.status === "scheduled").length,
    story,
  };
}

function buildAlerts(allergies, abnormalLabResults, nextAppointment) {
  const alerts = [];

  allergies
    .filter((allergy) => allergy.status === "active" && allergy.severity === "severe")
    .forEach((allergy) => {
      alerts.push({
        tone: "danger",
        title: `Severe allergy: ${allergy.allergen}`,
        detail: allergy.reaction || allergy.notes || "Review allergy details before prescribing.",
      });
    });

  abnormalLabResults.forEach((result) => {
    alerts.push({
      tone: result.abnormalFlag === "critical" ? "danger" : "warn",
      title: `${result.resultName} flagged ${result.abnormalFlag}`,
      detail: `${result.resultValue}${result.unit ? ` ${result.unit}` : ""} from ${result.testName}`,
    });
  });

  if (nextAppointment) {
    alerts.push({
      tone: "info",
      title: "Upcoming appointment scheduled",
      detail: `${nextAppointment.reason || "Follow-up review"} on ${nextAppointment.scheduledStart}`,
    });
  }

  return alerts;
}

async function fetchRows(table, columns, customize) {
  const client = getSupabaseClient();
  let query = client.from(table).select(columns);

  if (customize) {
    query = customize(query);
  }

  const { data, error } = await query;

  if (error) {
    error.statusCode = 500;
    throw error;
  }

  return data ?? [];
}

async function fetchSingle(table, columns, customize) {
  const client = getSupabaseClient();
  let query = client.from(table).select(columns).limit(1);

  if (customize) {
    query = customize(query);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    error.statusCode = 500;
    throw error;
  }

  return data ?? null;
}

async function fetchCount(table, customize) {
  const client = getSupabaseClient();
  let query = client.from(table).select("*", { count: "exact", head: true });

  if (customize) {
    query = customize(query);
  }

  const { count, error } = await query;

  if (error) {
    error.statusCode = 500;
    throw error;
  }

  return count ?? 0;
}

async function ensurePatient(patientId) {
  const patient = await fetchSingle(
    "patients",
    "id, mrn, first_name, last_name, date_of_birth, sex, phone, email, address_line1, city, state, postal_code",
    (query) => query.eq("id", patientId)
  );

  if (!patient) {
    throw createHttpError("Patient not found.", 404);
  }

  return patient;
}

async function ensureDoctor(doctorId) {
  const doctor = await fetchSingle("doctors", "id, first_name, last_name, specialty", (query) => query.eq("id", doctorId));

  if (!doctor) {
    throw createHttpError("Doctor not found.", 400);
  }

  return doctor;
}

async function ensureAppointment(appointmentId) {
  const appointment = await fetchSingle(
    "appointments",
    "id, patient_id, doctor_id, scheduled_start, scheduled_end, status, reason",
    (query) => query.eq("id", appointmentId)
  );

  if (!appointment) {
    throw createHttpError("Appointment not found.", 404);
  }

  return appointment;
}

async function writeAuditLog(entityName, entityId, action, details) {
  const client = getSupabaseClient();
  const { error } = await client.from("audit_logs").insert({
    user_id: SYSTEM_USER_ID,
    entity_name: entityName,
    entity_id: entityId,
    action,
    details,
  });

  if (error) {
    error.statusCode = 500;
    throw error;
  }
}

async function buildPatientSummaries(patients) {
  if (!patients.length) {
    return [];
  }

  const patientIds = patients.map((patient) => patient.id);

  const [encounters, activeMedications, appointments, labOrders] = await Promise.all([
    fetchRows("encounters", "id, patient_id, encounter_date", (query) => query.in("patient_id", patientIds)),
    fetchRows("medications", "id, patient_id, status", (query) => query.in("patient_id", patientIds).eq("status", "active")),
    fetchRows("appointments", "id, patient_id, scheduled_start, status", (query) => query.in("patient_id", patientIds)),
    fetchRows("lab_orders", "id, patient_id", (query) => query.in("patient_id", patientIds)),
  ]);

  const labOrderIds = labOrders.map((order) => order.id);
  const abnormalResults = labOrderIds.length
    ? await fetchRows("lab_results", "lab_order_id, abnormal_flag", (query) =>
        query.in("lab_order_id", labOrderIds).in("abnormal_flag", ABNORMAL_FLAGS)
      )
    : [];

  const encountersByPatient = groupBy(encounters, "patient_id");
  const appointmentsByPatient = groupBy(appointments, "patient_id");

  const activeMedicationCountByPatient = activeMedications.reduce((map, medication) => {
    map.set(medication.patient_id, (map.get(medication.patient_id) ?? 0) + 1);
    return map;
  }, new Map());

  const labOrderToPatient = new Map(labOrders.map((order) => [order.id, order.patient_id]));
  const abnormalLabCountByPatient = abnormalResults.reduce((map, result) => {
    const patientId = labOrderToPatient.get(result.lab_order_id);

    if (patientId) {
      map.set(patientId, (map.get(patientId) ?? 0) + 1);
    }

    return map;
  }, new Map());

  return patients.map((patient) =>
    buildPatientSummary(patient, {
      encountersByPatient,
      activeMedicationCountByPatient,
      appointmentsByPatient,
      abnormalLabCountByPatient,
    })
  );
}

function normalizeCreateAppointmentPayload(payload) {
  const doctorId = typeof payload.doctorId === "string" ? payload.doctorId.trim() : "";

  if (!doctorId) {
    throw createHttpError("Doctor is required.", 400);
  }

  const scheduledStart = normalizeDateTimeInput(payload.scheduledStart, "Appointment start time");
  const scheduledEnd = normalizeDateTimeInput(payload.scheduledEnd, "Appointment end time");
  validateAppointmentWindow(scheduledStart, scheduledEnd);

  return {
    doctor_id: doctorId,
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    reason: normalizeReason(payload.reason, { required: true }),
    status: "scheduled",
  };
}

function normalizeUpdateAppointmentPayload(payload, existingAppointment) {
  const updatePayload = {};
  const nextDoctorId = typeof payload.doctorId === "string" && payload.doctorId.trim() ? payload.doctorId.trim() : existingAppointment.doctor_id;
  const nextStart = payload.scheduledStart
    ? normalizeDateTimeInput(payload.scheduledStart, "Appointment start time")
    : existingAppointment.scheduled_start;
  const nextEnd = payload.scheduledEnd
    ? normalizeDateTimeInput(payload.scheduledEnd, "Appointment end time")
    : existingAppointment.scheduled_end;
  validateAppointmentWindow(nextStart, nextEnd);

  if (payload.doctorId !== undefined) {
    updatePayload.doctor_id = nextDoctorId;
  }

  if (payload.scheduledStart !== undefined) {
    updatePayload.scheduled_start = nextStart;
  }

  if (payload.scheduledEnd !== undefined) {
    updatePayload.scheduled_end = nextEnd;
  }

  if (payload.reason !== undefined) {
    updatePayload.reason = normalizeReason(payload.reason, { required: true });
  }

  if (payload.status !== undefined) {
    const status = typeof payload.status === "string" ? payload.status.trim() : "";

    if (!APPOINTMENT_STATUSES.includes(status)) {
      throw createHttpError("Appointment status is invalid.", 400);
    }

    updatePayload.status = status;
  }

  if (!Object.keys(updatePayload).length) {
    throw createHttpError("No appointment changes were provided.", 400);
  }

  return {
    updatePayload,
    nextDoctorId,
  };
}

export async function getHealthSnapshot() {
  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient.from("patients").select("id", { head: true, count: "exact" });

  if (error) {
    error.statusCode = 500;
    throw error;
  }

  return {
    status: "ok",
    checkedAt: new Date().toISOString(),
  };
}

export async function listDoctors() {
  const doctors = await fetchRows("doctors", "id, first_name, last_name, specialty", (query) =>
    query.order("last_name", { ascending: true }).order("first_name", { ascending: true })
  );

  return mapDoctorDirectory(doctors);
}

export async function getDashboardData() {
  const [patientCount, doctorCount, scheduledAppointmentsCount, activeMedicationsCount, abnormalLabCount, patients, doctors] = await Promise.all([
    fetchCount("patients"),
    fetchCount("doctors"),
    fetchCount("appointments", (query) => query.eq("status", "scheduled")),
    fetchCount("medications", (query) => query.eq("status", "active")),
    fetchCount("lab_results", (query) => query.in("abnormal_flag", ABNORMAL_FLAGS)),
    fetchRows("patients", "id, mrn, first_name, last_name, date_of_birth, sex, city, state", (query) =>
      query.order("last_name", { ascending: true }).order("first_name", { ascending: true })
    ),
    fetchRows("doctors", "id, first_name, last_name, specialty"),
  ]);

  const [spotlightPatients, scheduledAppointments, abnormalResults] = await Promise.all([
    buildPatientSummaries(patients),
    fetchRows(
      "appointments",
      "id, patient_id, doctor_id, scheduled_start, scheduled_end, status, reason",
      (query) => query.eq("status", "scheduled").order("scheduled_start", { ascending: true }).limit(6)
    ),
    fetchRows("lab_results", "lab_order_id, result_name, result_value, unit, abnormal_flag, resulted_at", (query) =>
      query.in("abnormal_flag", ABNORMAL_FLAGS).order("resulted_at", { ascending: false }).limit(6)
    ),
  ]);

  const doctorsById = indexBy(doctors, "id");
  const patientsById = indexBy(patients, "id");

  const scheduledAppointmentsView = scheduledAppointments.map((appointment) => {
    const patient = patientsById.get(appointment.patient_id);

    return {
      id: appointment.id,
      scheduledStart: appointment.scheduled_start,
      scheduledEnd: appointment.scheduled_end,
      reason: appointment.reason,
      patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown patient",
      patientMrn: patient?.mrn ?? "Unknown MRN",
      doctorName: doctorsById.get(appointment.doctor_id) ? formatDoctorName(doctorsById.get(appointment.doctor_id)) : "Unknown doctor",
      doctorSpecialty: doctorsById.get(appointment.doctor_id)?.specialty ?? "Unknown specialty",
    };
  });

  const abnormalLabOrderIds = [...new Set(abnormalResults.map((result) => result.lab_order_id))];
  const abnormalLabOrders = abnormalLabOrderIds.length
    ? await fetchRows("lab_orders", "id, patient_id, test_name", (query) => query.in("id", abnormalLabOrderIds))
    : [];
  const abnormalLabOrderMap = indexBy(abnormalLabOrders, "id");

  const abnormalLabsView = abnormalResults.map((result) => {
    const order = abnormalLabOrderMap.get(result.lab_order_id);
    const patient = order ? patientsById.get(order.patient_id) : null;

    return {
      id: `${result.lab_order_id}-${result.result_name}`,
      testName: order?.test_name ?? "Unknown test",
      resultName: result.result_name,
      resultValue: result.result_value,
      unit: result.unit,
      abnormalFlag: result.abnormal_flag,
      resultedAt: result.resulted_at,
      patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Unknown patient",
      patientMrn: patient?.mrn ?? "Unknown MRN",
    };
  });

  return {
    metrics: {
      patientCount,
      doctorCount,
      scheduledAppointmentsCount,
      activeMedicationsCount,
      abnormalLabCount,
    },
    spotlightPatients: spotlightPatients.slice(0, 3),
    scheduledAppointments: scheduledAppointmentsView,
    abnormalLabs: abnormalLabsView,
  };
}

export async function listPatients(search = "") {
  const patients = await fetchRows(
    "patients",
    "id, mrn, first_name, last_name, date_of_birth, sex, city, state",
    (query) => query.order("last_name", { ascending: true }).order("first_name", { ascending: true })
  );

  const summaries = await buildPatientSummaries(patients);
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return summaries;
  }

  return summaries.filter((patient) =>
    [patient.fullName, patient.mrn, patient.location, patient.story.title, patient.story.summary]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch)
  );
}

export async function getPatientChart(patientId) {
  const patient = await ensurePatient(patientId);

  const [allergies, encounters, medications, labOrders, appointments, doctors] = await Promise.all([
    fetchRows("allergies", "id, allergen, reaction, severity, status, notes, recorded_at", (query) =>
      query.eq("patient_id", patientId).order("recorded_at", { ascending: false })
    ),
    fetchRows(
      "encounters",
      "id, doctor_id, encounter_date, encounter_type, chief_complaint, assessment, plan, status",
      (query) => query.eq("patient_id", patientId).order("encounter_date", { ascending: false })
    ),
    fetchRows(
      "medications",
      "id, encounter_id, medication_name, dose, route, frequency, start_date, end_date, status, instructions",
      (query) => query.eq("patient_id", patientId).order("start_date", { ascending: false })
    ),
    fetchRows("lab_orders", "id, encounter_id, ordering_doctor_id, test_name, priority, status, ordered_at", (query) =>
      query.eq("patient_id", patientId).order("ordered_at", { ascending: false })
    ),
    fetchRows("appointments", "id, patient_id, doctor_id, scheduled_start, scheduled_end, status, reason", (query) =>
      query.eq("patient_id", patientId).order("scheduled_start", { ascending: false })
    ),
    fetchRows("doctors", "id, first_name, last_name, specialty"),
  ]);

  const encounterIds = encounters.map((encounter) => encounter.id);
  const labOrderIds = labOrders.map((order) => order.id);

  const [diagnoses, vitals, labResults] = await Promise.all([
    encounterIds.length
      ? fetchRows("diagnoses", "encounter_id, icd10_code, diagnosis_name, is_primary, status", (query) =>
          query.in("encounter_id", encounterIds)
        )
      : Promise.resolve([]),
    encounterIds.length
      ? fetchRows(
          "vitals",
          "encounter_id, recorded_at, height_cm, weight_kg, bmi, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_c, oxygen_saturation",
          (query) => query.in("encounter_id", encounterIds)
        )
      : Promise.resolve([]),
    labOrderIds.length
      ? fetchRows(
          "lab_results",
          "lab_order_id, result_name, result_value, unit, reference_range, abnormal_flag, resulted_at",
          (query) => query.in("lab_order_id", labOrderIds).order("resulted_at", { ascending: false })
        )
      : Promise.resolve([]),
  ]);

  const doctorsById = indexBy(doctors, "id");
  const diagnosesByEncounter = groupBy(diagnoses, "encounter_id");
  const medicationsByEncounter = groupBy(medications, "encounter_id");
  const labOrdersByEncounter = groupBy(labOrders, "encounter_id");
  const labResultsByOrder = groupBy(labResults, "lab_order_id");
  const vitalsByEncounter = new Map(vitals.map((vital) => [vital.encounter_id, vital]));

  const enrichedLabOrders = labOrders.map((order) => ({
    id: order.id,
    testName: order.test_name,
    priority: order.priority,
    status: order.status,
    orderedAt: order.ordered_at,
    orderingDoctor: doctorsById.get(order.ordering_doctor_id)
      ? formatDoctorName(doctorsById.get(order.ordering_doctor_id))
      : "Unknown doctor",
    results: (labResultsByOrder.get(order.id) ?? []).map((result) => ({
      resultName: result.result_name,
      resultValue: result.result_value,
      unit: result.unit,
      referenceRange: result.reference_range,
      abnormalFlag: result.abnormal_flag,
      resultedAt: result.resulted_at,
    })),
  }));

  const enrichedEncounters = encounters.map((encounter) => ({
    id: encounter.id,
    encounterDate: encounter.encounter_date,
    encounterType: encounter.encounter_type,
    chiefComplaint: encounter.chief_complaint,
    assessment: encounter.assessment,
    plan: encounter.plan,
    status: encounter.status,
    doctorName: doctorsById.get(encounter.doctor_id) ? formatDoctorName(doctorsById.get(encounter.doctor_id)) : "Unknown doctor",
    doctorSpecialty: doctorsById.get(encounter.doctor_id)?.specialty ?? "Unknown specialty",
    diagnoses: (diagnosesByEncounter.get(encounter.id) ?? []).map((diagnosis) => ({
      code: diagnosis.icd10_code,
      name: diagnosis.diagnosis_name,
      isPrimary: diagnosis.is_primary,
      status: diagnosis.status,
    })),
    vitals: vitalsByEncounter.get(encounter.id)
      ? {
          recordedAt: vitalsByEncounter.get(encounter.id).recorded_at,
          heightCm: vitalsByEncounter.get(encounter.id).height_cm,
          weightKg: vitalsByEncounter.get(encounter.id).weight_kg,
          bmi: vitalsByEncounter.get(encounter.id).bmi,
          systolicBp: vitalsByEncounter.get(encounter.id).systolic_bp,
          diastolicBp: vitalsByEncounter.get(encounter.id).diastolic_bp,
          heartRate: vitalsByEncounter.get(encounter.id).heart_rate,
          respiratoryRate: vitalsByEncounter.get(encounter.id).respiratory_rate,
          temperatureC: vitalsByEncounter.get(encounter.id).temperature_c,
          oxygenSaturation: vitalsByEncounter.get(encounter.id).oxygen_saturation,
        }
      : null,
    medications: (medicationsByEncounter.get(encounter.id) ?? []).map((medication) => ({
      medicationName: medication.medication_name,
      dose: medication.dose,
      route: medication.route,
      frequency: medication.frequency,
      startDate: medication.start_date,
      endDate: medication.end_date,
      status: medication.status,
      instructions: medication.instructions,
    })),
    labOrders: (labOrdersByEncounter.get(encounter.id) ?? [])
      .map((order) => enrichedLabOrders.find((labOrder) => labOrder.id === order.id))
      .filter(Boolean),
  }));

  const enrichedAppointments = appointments.map((appointment) => mapAppointmentView(appointment, doctorsById));
  const abnormalLabResults = enrichedLabOrders.flatMap((order) =>
    order.results
      .filter((result) => ABNORMAL_FLAGS.includes(result.abnormalFlag))
      .map((result) => ({
        ...result,
        testName: order.testName,
      }))
  );

  const nextAppointment = getNextScheduledAppointment(enrichedAppointments);
  const story = getCaseStory(patient.mrn);
  const alerts = buildAlerts(allergies, abnormalLabResults, nextAppointment);
  const activeMedicationCount = medications.filter((medication) => medication.status === "active").length;

  return {
    patient: {
      id: patient.id,
      mrn: patient.mrn,
      firstName: patient.first_name,
      lastName: patient.last_name,
      fullName: `${patient.first_name} ${patient.last_name}`,
      age: calculateAge(patient.date_of_birth),
      sex: patient.sex,
      email: patient.email,
      phone: patient.phone,
      addressLine1: patient.address_line1,
      city: patient.city,
      state: patient.state,
      postalCode: patient.postal_code,
      location: formatLocation(patient.city, patient.state),
    },
    story,
    metrics: {
      encounterCount: encounters.length,
      activeMedicationCount,
      allergyCount: allergies.length,
      abnormalLabCount: abnormalLabResults.length,
      scheduledAppointmentCount: enrichedAppointments.filter((appointment) => appointment.status === "scheduled").length,
    },
    alerts,
    doctorDirectory: mapDoctorDirectory(doctors),
    allergies: allergies.map((allergy) => ({
      allergen: allergy.allergen,
      reaction: allergy.reaction,
      severity: allergy.severity,
      status: allergy.status,
      notes: allergy.notes,
      recordedAt: allergy.recorded_at,
    })),
    encounters: enrichedEncounters,
    medications: medications.map((medication) => ({
      medicationName: medication.medication_name,
      dose: medication.dose,
      route: medication.route,
      frequency: medication.frequency,
      startDate: medication.start_date,
      endDate: medication.end_date,
      status: medication.status,
      instructions: medication.instructions,
    })),
    labOrders: enrichedLabOrders,
    appointments: enrichedAppointments,
  };
}

export async function createAppointment(patientId, payload) {
  await ensurePatient(patientId);
  const normalizedPayload = normalizeCreateAppointmentPayload(payload);
  const doctor = await ensureDoctor(normalizedPayload.doctor_id);
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("appointments")
    .insert({
      patient_id: patientId,
      ...normalizedPayload,
    })
    .select("id, patient_id, doctor_id, scheduled_start, scheduled_end, status, reason")
    .single();

  if (error) {
    error.statusCode = 500;
    throw error;
  }

  await writeAuditLog("appointments", data.id, "insert", {
    reason: data.reason,
    status: data.status,
    scheduledStart: data.scheduled_start,
    scheduledEnd: data.scheduled_end,
  });

  return {
    appointment: mapAppointmentView(data, new Map([[doctor.id, doctor]])),
  };
}

export async function updateAppointment(appointmentId, payload) {
  const existingAppointment = await ensureAppointment(appointmentId);
  const { updatePayload, nextDoctorId } = normalizeUpdateAppointmentPayload(payload, existingAppointment);
  const doctor = await ensureDoctor(nextDoctorId);
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("appointments")
    .update(updatePayload)
    .eq("id", appointmentId)
    .select("id, patient_id, doctor_id, scheduled_start, scheduled_end, status, reason")
    .single();

  if (error) {
    error.statusCode = 500;
    throw error;
  }

  await writeAuditLog("appointments", data.id, "update", {
    fields: Object.keys(updatePayload),
    status: data.status,
    scheduledStart: data.scheduled_start,
    scheduledEnd: data.scheduled_end,
  });

  return {
    appointment: mapAppointmentView(data, new Map([[doctor.id, doctor]])),
  };
}

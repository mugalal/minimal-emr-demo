import { toDateValue, toDatetimeLocalValue } from "../ui/formatters.js";

export function createInitialState() {
  return {
    dashboard: null,
    health: null,
    patients: [],
    selectedPatientId: null,
    selectedChart: null,
    filters: {
      patientSearch: "",
    },
    forms: {
      patient: createEmptyPatientForm(),
      appointment: createEmptyAppointmentForm(),
      allergy: createEmptyAllergyForm(),
      medication: createEmptyMedicationForm(),
      encounter: createEmptyEncounterForm(),
    },
  };
}

export function createEmptyPatientForm() {
  return {
    mode: "create",
    patientId: null,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "female",
    phone: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
  };
}

export function createEmptyAppointmentForm() {
  return {
    mode: "create",
    appointmentId: null,
    doctorId: "",
    scheduledStart: "",
    scheduledEnd: "",
    reason: "",
  };
}

export function createEmptyAllergyForm() {
  return {
    allergen: "",
    reaction: "",
    severity: "mild",
    notes: "",
  };
}

export function createEmptyMedicationForm() {
  return {
    encounterId: "",
    medicationName: "",
    dose: "",
    route: "oral",
    frequency: "once daily",
    startDate: todayDateValue(),
    endDate: "",
    status: "active",
    instructions: "",
  };
}

export function createEmptyEncounterForm() {
  return {
    doctorId: "",
    encounterDate: "",
    encounterType: "office_visit",
    status: "signed",
    chiefComplaint: "",
    assessment: "",
    plan: "",
    icd10Code: "",
    diagnosisName: "",
    heightCm: "",
    weightKg: "",
    bmi: "",
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    respiratoryRate: "",
    temperatureC: "",
    oxygenSaturation: "",
  };
}

export function setPatientCreateMode(state) {
  state.forms.patient = createEmptyPatientForm();
}

export function setPatientEditMode(state) {
  const patient = state.selectedChart?.patient;

  if (!patient) {
    state.forms.patient = createEmptyPatientForm();
    return;
  }

  state.forms.patient = {
    mode: "edit",
    patientId: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: toDateValue(patient.dateOfBirth),
    sex: patient.sex,
    phone: patient.phone || "",
    email: patient.email || "",
    addressLine1: patient.addressLine1 || "",
    city: patient.city || "",
    state: patient.state || "",
    postalCode: patient.postalCode || "",
  };
}

export function syncFormsFromChart(state) {
  setPatientEditMode(state);

  state.forms.appointment = {
    mode: "create",
    appointmentId: null,
    doctorId: state.selectedChart?.doctorDirectory?.[0]?.id ?? "",
    scheduledStart: "",
    scheduledEnd: "",
    reason: "",
  };

  state.forms.allergy = {
    allergen: "",
    reaction: "",
    severity: state.selectedChart?.referenceData?.allergySeverities?.[0] ?? "mild",
    notes: "",
  };

  state.forms.medication = {
    encounterId: state.selectedChart?.encounters?.[0]?.id ?? "",
    medicationName: "",
    dose: "",
    route: "oral",
    frequency: "once daily",
    startDate: todayDateValue(),
    endDate: "",
    status: state.selectedChart?.referenceData?.medicationStatuses?.[0] ?? "active",
    instructions: "",
  };

  state.forms.encounter = {
    doctorId: state.selectedChart?.doctorDirectory?.[0]?.id ?? "",
    encounterDate: toDatetimeLocalValue(new Date().toISOString()),
    encounterType: state.selectedChart?.referenceData?.encounterTypes?.[0] ?? "office_visit",
    status: state.selectedChart?.referenceData?.encounterStatuses?.find((status) => status === "signed") ?? "signed",
    chiefComplaint: "",
    assessment: "",
    plan: "",
    icd10Code: "",
    diagnosisName: "",
    heightCm: "",
    weightKg: "",
    bmi: "",
    systolicBp: "",
    diastolicBp: "",
    heartRate: "",
    respiratoryRate: "",
    temperatureC: "",
    oxygenSaturation: "",
  };
}

export function beginAppointmentEdit(state, appointmentId) {
  const appointment = state.selectedChart?.appointments?.find((entry) => entry.id === appointmentId);

  if (!appointment) {
    return;
  }

  state.forms.appointment = {
    mode: "edit",
    appointmentId: appointment.id,
    doctorId: appointment.doctorId,
    scheduledStart: toDatetimeLocalValue(appointment.scheduledStart),
    scheduledEnd: toDatetimeLocalValue(appointment.scheduledEnd),
    reason: appointment.reason || "",
  };
}

export function resetAppointmentForm(state) {
  state.forms.appointment = {
    mode: "create",
    appointmentId: null,
    doctorId: state.selectedChart?.doctorDirectory?.[0]?.id ?? "",
    scheduledStart: "",
    scheduledEnd: "",
    reason: "",
  };
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

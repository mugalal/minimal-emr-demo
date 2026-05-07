async function handleJsonResponse(response) {
  if (!response.ok) {
    let message = "Request failed.";

    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch {
      message = `${response.status} ${response.statusText}`;
    }

    throw new Error(message);
  }

  return response.json();
}

function resolveApiUrl(url) {
  return new URL(url, window.location.origin).toString();
}

export async function fetchJson(url) {
  const response = await fetch(resolveApiUrl(url), {
    headers: {
      Accept: "application/json",
    },
  });

  return handleJsonResponse(response);
}

export async function requestJson(url, options) {
  const response = await fetch(resolveApiUrl(url), {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(options.body),
  });

  return handleJsonResponse(response);
}

export const emrApi = {
  fetchHealth: () => fetchJson("/api/health"),
  fetchDashboard: () => fetchJson("/api/dashboard"),
  fetchPatients: () => fetchJson("/api/patients"),
  fetchPatientChart: (patientId) => fetchJson(`/api/patients/${patientId}/chart`),
  createPatient: (payload) => requestJson("/api/patients", { method: "POST", body: payload }),
  updatePatient: (patientId, payload) => requestJson(`/api/patients/${patientId}`, { method: "PATCH", body: payload }),
  createAppointment: (patientId, payload) => requestJson(`/api/patients/${patientId}/appointments`, { method: "POST", body: payload }),
  updateAppointment: (appointmentId, payload) => requestJson(`/api/appointments/${appointmentId}`, { method: "PATCH", body: payload }),
  createAllergy: (patientId, payload) => requestJson(`/api/patients/${patientId}/allergies`, { method: "POST", body: payload }),
  updateAllergy: (allergyId, payload) => requestJson(`/api/allergies/${allergyId}`, { method: "PATCH", body: payload }),
  createMedication: (patientId, payload) => requestJson(`/api/patients/${patientId}/medications`, { method: "POST", body: payload }),
  updateMedication: (medicationId, payload) => requestJson(`/api/medications/${medicationId}`, { method: "PATCH", body: payload }),
  createEncounter: (patientId, payload) => requestJson(`/api/patients/${patientId}/encounters`, { method: "POST", body: payload }),
};

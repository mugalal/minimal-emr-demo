import { emrApi } from "./api/emr-api.js";
import {
  beginAppointmentEdit,
  createInitialState,
  resetAppointmentForm,
  setPatientCreateMode,
  setPatientEditMode,
  syncFormsFromChart,
} from "./core/state.js";
import { getCurrentRoute, getRouteMeta, routes, setRoute } from "./core/router.js";
import { renderClinicalPage } from "./pages/clinical.js";
import { renderOperationsPage } from "./pages/operations.js";
import { renderOverviewPage } from "./pages/overview.js";
import { renderPatientsPage } from "./pages/patients.js";
import { renderSchedulingPage } from "./pages/scheduling.js";
import { renderMetrics, renderPatientExplorer, renderSidebarPatientSummary, renderSidebarSystemSummary, renderTabs } from "./ui/shared.js";

const refs = {
  refreshButton: document.querySelector("#refresh-button"),
  statusPill: document.querySelector("#status-pill"),
  metricsGrid: document.querySelector("#metrics-grid"),
  patientCountBadge: document.querySelector("#patient-count-badge"),
  patientSearch: document.querySelector("#patient-search"),
  patientList: document.querySelector("#patient-list"),
  routeTabs: document.querySelector("#route-tabs"),
  sidebarPatientSummary: document.querySelector("#sidebar-patient-summary"),
  sidebarSystemSummary: document.querySelector("#sidebar-system-summary"),
  pageContent: document.querySelector("#page-content"),
};

const state = createInitialState();

bindEvents();
boot();

function bindEvents() {
  refs.refreshButton.addEventListener("click", async () => {
    await boot(state.selectedPatientId);
  });

  refs.patientSearch.addEventListener("input", () => {
    state.filters.patientSearch = refs.patientSearch.value.trim().toLowerCase();
    renderPatientExplorerPanel();
  });

  refs.patientList.addEventListener("click", async (event) => {
    const trigger = event.target.closest("button[data-patient-id]");

    if (!trigger) {
      return;
    }

    await loadPatientChart(trigger.dataset.patientId);
  });

  refs.routeTabs.addEventListener("click", (event) => {
    const trigger = event.target.closest("button[data-route]");

    if (!trigger) {
      return;
    }

    setRoute(trigger.dataset.route);
  });

  window.addEventListener("hashchange", () => {
    renderCurrentPage();
  });

  document.body.addEventListener("click", handleGlobalClick);
  document.body.addEventListener("submit", handleGlobalSubmit);
}

async function boot(preferredPatientId = null) {
  setStatus("Loading backend workspace...", "info");

  try {
    const [health, dashboard, patients] = await Promise.all([
      emrApi.fetchHealth(),
      emrApi.fetchDashboard(),
      emrApi.fetchPatients(),
    ]);

    state.health = health;
    state.dashboard = dashboard;
    state.patients = patients;

    renderShell();

    if (!patients.length) {
      state.selectedPatientId = null;
      state.selectedChart = null;
      setPatientCreateMode(state);
      renderShell();
      setStatus("Workspace loaded with no patient data.", "warn");
      return;
    }

    const nextPatientId = patients.some((patient) => patient.id === preferredPatientId) ? preferredPatientId : patients[0].id;
    await loadPatientChart(nextPatientId);
    setStatus("Workspace ready.", "success");
  } catch (error) {
    renderFatalState(error);
    setStatus(error.message, "error");
  }
}

async function loadPatientChart(patientId) {
  const patient = state.patients.find((entry) => entry.id === patientId);
  state.selectedPatientId = patientId;
  renderShell();

  if (patient) {
    setStatus(`Loading chart for ${patient.fullName}...`, "info");
  }

  try {
    state.selectedChart = await emrApi.fetchPatientChart(patientId);
    syncFormsFromChart(state);
    renderShell();
    setStatus(`Loaded ${state.selectedChart.patient.fullName}.`, "success");
  } catch (error) {
    renderPatientError(error);
    setStatus(error.message, "error");
  }
}

function renderShell() {
  refs.metricsGrid.innerHTML = renderMetrics(state.dashboard?.metrics);
  refs.patientCountBadge.textContent = String(getFilteredPatients().length);
  renderPatientExplorerPanel();
  refs.routeTabs.innerHTML = renderTabs(routes, getCurrentRoute());
  refs.sidebarPatientSummary.innerHTML = renderSidebarPatientSummary(state.selectedChart, state.forms.patient.mode === "create");
  refs.sidebarSystemSummary.innerHTML = renderSidebarSystemSummary(state.health);
  renderCurrentPage();
}

function renderPatientExplorerPanel() {
  refs.patientList.innerHTML = renderPatientExplorer(getFilteredPatients(), state.selectedPatientId);
}

function renderCurrentPage() {
  const routeId = getCurrentRoute();
  const routeMeta = getRouteMeta(routeId);

  let html;

  switch (routeMeta.id) {
    case "patients":
      html = renderPatientsPage(state);
      break;
    case "scheduling":
      html = renderSchedulingPage(state);
      break;
    case "clinical":
      html = renderClinicalPage(state);
      break;
    case "operations":
      html = renderOperationsPage(state);
      break;
    case "overview":
    default:
      html = renderOverviewPage(state);
      break;
  }

  refs.pageContent.innerHTML = html;
}

function getFilteredPatients() {
  if (!state.filters.patientSearch) {
    return state.patients;
  }

  return state.patients.filter((patient) =>
    [patient.fullName, patient.mrn, patient.location, patient.story.title, patient.story.summary]
      .join(" ")
      .toLowerCase()
      .includes(state.filters.patientSearch)
  );
}

async function handleGlobalClick(event) {
  const trigger = event.target.closest("button[data-action]");

  if (!trigger) {
    return;
  }

  const action = trigger.dataset.action;

  if (action === "patient-create-mode") {
    setPatientCreateMode(state);
    setRoute("patients");
    renderShell();
    return;
  }

  if (action === "patient-edit-selected") {
    setPatientEditMode(state);
    setRoute("patients");
    renderShell();
    return;
  }

  if (action === "appointment-reset") {
    resetAppointmentForm(state);
    renderShell();
    return;
  }

  if (action === "appointment-edit") {
    beginAppointmentEdit(state, trigger.dataset.appointmentId);
    setRoute("scheduling");
    renderShell();
    return;
  }

  if (action === "appointment-cancel") {
    await cancelAppointment(trigger.dataset.appointmentId);
    return;
  }

  if (action === "allergy-deactivate") {
    await deactivateAllergy(trigger.dataset.allergyId);
    return;
  }

  if (action === "medication-stop") {
    await stopMedication(trigger.dataset.medicationId);
  }
}

async function handleGlobalSubmit(event) {
  const form = event.target.closest("form[data-form]");

  if (!form) {
    return;
  }

  event.preventDefault();

  switch (form.dataset.form) {
    case "patient":
      await submitPatientForm(form);
      break;
    case "appointment":
      await submitAppointmentForm(form);
      break;
    case "allergy":
      await submitAllergyForm(form);
      break;
    case "medication":
      await submitMedicationForm(form);
      break;
    case "encounter":
      await submitEncounterForm(form);
      break;
    default:
      break;
  }
}

async function submitPatientForm(form) {
  const formData = new FormData(form);
  const payload = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    sex: formData.get("sex"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    addressLine1: formData.get("addressLine1"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
  };

  const isCreate = state.forms.patient.mode === "create";
  setStatus(isCreate ? "Creating patient..." : "Saving patient changes...", "info");

  try {
    const result = isCreate
      ? await emrApi.createPatient(payload)
      : await emrApi.updatePatient(state.forms.patient.patientId, payload);

    await boot(result.patient.id);
    setRoute("patients");
    setStatus(isCreate ? "Patient created." : "Patient updated.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitAppointmentForm(form) {
  if (!state.selectedPatientId) {
    return;
  }

  const formData = new FormData(form);
  const payload = {
    doctorId: formData.get("doctorId"),
    scheduledStart: formData.get("scheduledStart"),
    scheduledEnd: formData.get("scheduledEnd"),
    reason: formData.get("reason"),
  };

  const isEditing = state.forms.appointment.mode === "edit" && Boolean(state.forms.appointment.appointmentId);
  setStatus(isEditing ? "Saving appointment changes..." : "Creating appointment...", "info");

  try {
    if (isEditing) {
      await emrApi.updateAppointment(state.forms.appointment.appointmentId, payload);
    } else {
      await emrApi.createAppointment(state.selectedPatientId, payload);
    }

    await boot(state.selectedPatientId);
    setRoute("scheduling");
    setStatus(isEditing ? "Appointment updated." : "Appointment created.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function cancelAppointment(appointmentId) {
  if (!window.confirm("Cancel this appointment?")) {
    return;
  }

  setStatus("Cancelling appointment...", "info");

  try {
    await emrApi.updateAppointment(appointmentId, { status: "cancelled" });
    await boot(state.selectedPatientId);
    setRoute("scheduling");
    setStatus("Appointment cancelled.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitAllergyForm(form) {
  if (!state.selectedPatientId) {
    return;
  }

  const formData = new FormData(form);
  const payload = {
    allergen: formData.get("allergen"),
    reaction: formData.get("reaction"),
    severity: formData.get("severity"),
    notes: formData.get("notes"),
  };

  setStatus("Adding allergy...", "info");

  try {
    await emrApi.createAllergy(state.selectedPatientId, payload);
    await boot(state.selectedPatientId);
    setRoute("clinical");
    setStatus("Allergy added.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function deactivateAllergy(allergyId) {
  if (!window.confirm("Mark this allergy as inactive?")) {
    return;
  }

  setStatus("Updating allergy...", "info");

  try {
    await emrApi.updateAllergy(allergyId, { status: "inactive" });
    await boot(state.selectedPatientId);
    setRoute("clinical");
    setStatus("Allergy updated.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitMedicationForm(form) {
  if (!state.selectedPatientId) {
    return;
  }

  const formData = new FormData(form);
  const payload = {
    encounterId: formData.get("encounterId"),
    medicationName: formData.get("medicationName"),
    dose: formData.get("dose"),
    route: formData.get("route"),
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    instructions: formData.get("instructions"),
  };

  setStatus("Adding medication...", "info");

  try {
    await emrApi.createMedication(state.selectedPatientId, payload);
    await boot(state.selectedPatientId);
    setRoute("clinical");
    setStatus("Medication added.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function stopMedication(medicationId) {
  if (!window.confirm("Stop this medication?")) {
    return;
  }

  setStatus("Updating medication...", "info");

  try {
    await emrApi.updateMedication(medicationId, { status: "stopped" });
    await boot(state.selectedPatientId);
    setRoute("clinical");
    setStatus("Medication updated.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function submitEncounterForm(form) {
  if (!state.selectedPatientId) {
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  setStatus("Creating encounter...", "info");

  try {
    await emrApi.createEncounter(state.selectedPatientId, payload);
    await boot(state.selectedPatientId);
    setRoute("clinical");
    setStatus("Encounter created.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderFatalState(error) {
  refs.metricsGrid.innerHTML = `<p class="empty-state">Metrics unavailable.</p>`;
  refs.patientCountBadge.textContent = "0";
  refs.patientList.innerHTML = `<p class="empty-state">Directory unavailable.</p>`;
  refs.routeTabs.innerHTML = renderTabs(routes, getCurrentRoute());
  refs.sidebarPatientSummary.innerHTML = `<div class="panel-tight">${error.message}</div>`;
  refs.sidebarSystemSummary.innerHTML = `<div class="panel-tight">${error.message}</div>`;
  refs.pageContent.innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <p class="eyebrow">Workspace Page</p>
        <h2>Application Error</h2>
        <p class="muted">${error.message}</p>
      </header>
    </div>
  `;
}

function renderPatientError(error) {
  refs.pageContent.innerHTML = `
    <div class="page-layout">
      <header class="page-header">
        <p class="eyebrow">Workspace Page</p>
        <h2>Chart Load Error</h2>
        <p class="muted">${error.message}</p>
      </header>
    </div>
  `;
}

function setStatus(message, tone) {
  refs.statusPill.textContent = message;
  refs.statusPill.className = `status-pill status-${tone}`;
}

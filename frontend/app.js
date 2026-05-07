const refs = {
  refreshButton: document.querySelector("#refresh-button"),
  statusPill: document.querySelector("#status-pill"),
  metricsGrid: document.querySelector("#metrics-grid"),
  patientCountBadge: document.querySelector("#patient-count-badge"),
  patientSearch: document.querySelector("#patient-search"),
  patientList: document.querySelector("#patient-list"),
  storyBrief: document.querySelector("#story-brief"),
  systemStatus: document.querySelector("#system-status"),
  patientHero: document.querySelector("#patient-hero"),
  alertsPanel: document.querySelector("#alerts-panel"),
  operationsPanel: document.querySelector("#operations-panel"),
  careTeamPanel: document.querySelector("#care-team-panel"),
  appointmentsPanel: document.querySelector("#appointments-panel"),
  medicationsPanel: document.querySelector("#medications-panel"),
  labsPanel: document.querySelector("#labs-panel"),
  timelinePanel: document.querySelector("#timeline-panel"),
};

const state = {
  dashboard: null,
  health: null,
  patients: [],
  selectedPatientId: null,
  selectedChart: null,
  search: "",
  appointmentForm: createEmptyAppointmentForm(),
};

bindEvents();
boot();

function bindEvents() {
  refs.refreshButton.addEventListener("click", async () => {
    await boot(state.selectedPatientId);
  });

  refs.patientSearch.addEventListener("input", () => {
    state.search = refs.patientSearch.value.trim().toLowerCase();
    renderPatientList();
  });

  refs.patientList.addEventListener("click", async (event) => {
    const trigger = event.target.closest("button[data-patient-id]");

    if (!trigger) {
      return;
    }

    await loadPatientChart(trigger.dataset.patientId);
  });

  refs.appointmentsPanel.addEventListener("click", async (event) => {
    const trigger = event.target.closest("button[data-action]");

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.action;

    if (action === "reset-appointment-form") {
      resetAppointmentForm();
      renderAppointmentsPanel();
      return;
    }

    if (action === "edit-appointment") {
      beginAppointmentEdit(trigger.dataset.appointmentId);
      renderAppointmentsPanel();
      return;
    }

    if (action === "cancel-appointment") {
      await cancelAppointment(trigger.dataset.appointmentId);
    }
  });

  refs.appointmentsPanel.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-appointment-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    await submitAppointmentForm(form);
  });
}

async function boot(preferredPatientId = null) {
  setStatus("Loading backend workspace...", "info");

  try {
    const [health, dashboard, patients] = await Promise.all([
      fetchJson("/api/health"),
      fetchJson("/api/dashboard"),
      fetchJson("/api/patients"),
    ]);

    state.health = health;
    state.dashboard = dashboard;
    state.patients = patients;

    renderMetrics();
    renderSystemStatus();
    renderOperationsPanel();
    renderPatientList();

    if (!patients.length) {
      renderEmptyWorkspace("No patient data is available yet.");
      setStatus("Workspace loaded with no patient data.", "warn");
      return;
    }

    const selectedPatientId = patients.some((patient) => patient.id === preferredPatientId)
      ? preferredPatientId
      : patients[0].id;

    await loadPatientChart(selectedPatientId);
    setStatus("Workspace ready.", "success");
  } catch (error) {
    renderFatalState(error);
    setStatus(error.message, "error");
  }
}

async function loadPatientChart(patientId) {
  const patient = state.patients.find((entry) => entry.id === patientId);
  state.selectedPatientId = patientId;
  renderPatientList();

  if (patient) {
    setStatus(`Loading chart for ${patient.fullName}...`, "info");
  }

  try {
    state.selectedChart = await fetchJson(`/api/patients/${patientId}/chart`);
    resetAppointmentForm();
    renderSelectedPatient();
    setStatus(`Loaded ${state.selectedChart.patient.fullName}.`, "success");
  } catch (error) {
    renderPatientError(error);
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

  const isEditing = state.appointmentForm.mode === "edit" && Boolean(state.appointmentForm.appointmentId);

  setStatus(isEditing ? "Saving appointment changes..." : "Creating appointment...", "info");

  try {
    await requestJson(
      isEditing ? `/api/appointments/${state.appointmentForm.appointmentId}` : `/api/patients/${state.selectedPatientId}/appointments`,
      {
        method: isEditing ? "PATCH" : "POST",
        body: payload,
      }
    );

    await boot(state.selectedPatientId);
    setStatus(isEditing ? "Appointment updated." : "Appointment created.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function cancelAppointment(appointmentId) {
  const appointment = state.selectedChart?.appointments?.find((entry) => entry.id === appointmentId);

  if (!appointment) {
    return;
  }

  const confirmed = window.confirm(`Cancel the appointment for ${appointment.reason || "this visit"}?`);

  if (!confirmed) {
    return;
  }

  setStatus("Cancelling appointment...", "info");

  try {
    await requestJson(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      body: { status: "cancelled" },
    });

    await boot(state.selectedPatientId);
    setStatus("Appointment cancelled.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function beginAppointmentEdit(appointmentId) {
  const appointment = state.selectedChart?.appointments?.find((entry) => entry.id === appointmentId);

  if (!appointment) {
    return;
  }

  state.appointmentForm = {
    mode: "edit",
    appointmentId: appointment.id,
    doctorId: appointment.doctorId,
    scheduledStart: toDatetimeLocalValue(appointment.scheduledStart),
    scheduledEnd: toDatetimeLocalValue(appointment.scheduledEnd),
    reason: appointment.reason || "",
  };
}

function resetAppointmentForm() {
  const firstDoctorId = state.selectedChart?.doctorDirectory?.[0]?.id ?? "";
  state.appointmentForm = {
    mode: "create",
    appointmentId: null,
    doctorId: firstDoctorId,
    scheduledStart: "",
    scheduledEnd: "",
    reason: "",
  };
}

function createEmptyAppointmentForm() {
  return {
    mode: "create",
    appointmentId: null,
    doctorId: "",
    scheduledStart: "",
    scheduledEnd: "",
    reason: "",
  };
}

async function fetchJson(url) {
  const response = await fetch(resolveApiUrl(url), {
    headers: {
      Accept: "application/json",
    },
  });

  return handleJsonResponse(response);
}

async function requestJson(url, options) {
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

function renderMetrics() {
  const metrics = state.dashboard?.metrics;

  if (!metrics) {
    refs.metricsGrid.innerHTML = metricCards([]);
    return;
  }

  refs.metricsGrid.innerHTML = metricCards([
    { label: "Patients", value: metrics.patientCount, accent: "teal" },
    { label: "Doctors", value: metrics.doctorCount, accent: "blue" },
    { label: "Scheduled Visits", value: metrics.scheduledAppointmentsCount, accent: "violet" },
    { label: "Active Medications", value: metrics.activeMedicationsCount, accent: "amber" },
    { label: "Abnormal Labs", value: metrics.abnormalLabCount, accent: "rose" },
  ]);
}

function metricCards(metrics) {
  if (!metrics.length) {
    return `<p class="empty-state">No metrics available.</p>`;
  }

  return metrics
    .map(
      (metric) => `
        <article class="metric-card metric-${metric.accent}">
          <span class="metric-label">${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(String(metric.value))}</strong>
        </article>
      `
    )
    .join("");
}

function renderPatientList() {
  const patients = getFilteredPatients();
  refs.patientCountBadge.textContent = String(patients.length);

  if (!patients.length) {
    refs.patientList.innerHTML = `<p class="empty-state">No patients match your search.</p>`;
    return;
  }

  refs.patientList.innerHTML = patients
    .map((patient) => {
      const isActive = patient.id === state.selectedPatientId;
      const meta = [patient.mrn, patient.location].filter(Boolean).join(" · ");
      const timelineHint = patient.nextAppointmentAt
        ? `Next visit ${formatDateTime(patient.nextAppointmentAt)}`
        : patient.lastEncounterAt
          ? `Last encounter ${formatDateTime(patient.lastEncounterAt)}`
          : "No encounters yet";

      return `
        <button type="button" class="patient-card ${isActive ? "active" : ""}" data-patient-id="${patient.id}">
          <div class="patient-card-top">
            <div>
              <strong>${escapeHtml(patient.fullName)}</strong>
              <p>${escapeHtml(meta)}</p>
            </div>
            <span class="mini-chip">${escapeHtml(patient.story.title)}</span>
          </div>

          <p class="patient-story">${escapeHtml(patient.story.summary)}</p>

          <div class="patient-card-bottom">
            <span>${escapeHtml(timelineHint)}</span>
            <span>${escapeHtml(String(patient.activeMedicationCount))} active meds</span>
            <span>${escapeHtml(String(patient.abnormalLabCount))} abnormal labs</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function getFilteredPatients() {
  if (!state.search) {
    return state.patients;
  }

  return state.patients.filter((patient) =>
    [patient.fullName, patient.mrn, patient.location, patient.story.title, patient.story.summary]
      .join(" ")
      .toLowerCase()
      .includes(state.search)
  );
}

function renderSelectedPatient() {
  renderStoryBrief();
  renderPatientHero();
  renderAlertsPanel();
  renderCareTeamPanel();
  renderAppointmentsPanel();
  renderMedicationsPanel();
  renderLabsPanel();
  renderTimelinePanel();
}

function renderStoryBrief() {
  const story = state.selectedChart?.story;

  if (!story) {
    refs.storyBrief.innerHTML = sectionMarkup("Selected Scenario", `<p class="empty-state">Select a patient to view case context.</p>`);
    return;
  }

  refs.storyBrief.innerHTML = sectionMarkup(
    "Selected Scenario",
    `
      <div class="stack">
        <div>
          <p class="eyebrow">Clinical Narrative</p>
          <h3>${escapeHtml(story.title)}</h3>
          <p class="body-copy">${escapeHtml(story.summary)}</p>
        </div>

        <div>
          <p class="subheading">Why it matters</p>
          <p class="muted">${escapeHtml(story.whyItMatters)}</p>
        </div>

        <div class="chip-row">
          ${story.focusAreas.map((focus) => `<span class="mini-chip">${escapeHtml(focus)}</span>`).join("")}
        </div>
      </div>
    `
  );
}

function renderSystemStatus() {
  const health = state.health;

  if (!health) {
    refs.systemStatus.innerHTML = sectionMarkup("System Status", `<p class="empty-state">Health data unavailable.</p>`);
    return;
  }

  refs.systemStatus.innerHTML = sectionMarkup(
    "System Status",
    `
      <div class="stack">
        <div class="system-row">
          <span>API</span>
          <span class="mini-chip status-${health.status === "ok" ? "success" : "warn"}">${escapeHtml(health.status)}</span>
        </div>
        <div class="system-row">
          <span>PostgreSQL</span>
          <span>${health.dataSources.postgres.configured ? `Configured via ${escapeHtml(health.dataSources.postgres.runtimeKey)}` : "Missing configuration"}</span>
        </div>
        <div class="system-row">
          <span>MongoDB</span>
          <span>${health.dataSources.mongo.configured ? "Atlas URI present" : "Design artifacts included"}</span>
        </div>
        <div class="system-row">
          <span>Checked</span>
          <span>${formatDateTime(health.checkedAt)}</span>
        </div>
        <div class="divider"></div>
        <p class="muted">Frontend requests go through the backend API. Appointment changes are now persisted through server-side routes instead of direct browser database calls.</p>
      </div>
    `
  );
}

function renderPatientHero() {
  const chart = state.selectedChart;

  if (!chart) {
    refs.patientHero.innerHTML = `<p class="empty-state">Select a patient to view the chart.</p>`;
    return;
  }

  const patient = chart.patient;
  const metrics = chart.metrics;

  refs.patientHero.innerHTML = `
    <div class="patient-hero-layout">
      <div>
        <p class="eyebrow">Active Chart</p>
        <h2>${escapeHtml(patient.fullName)}</h2>
        <p class="body-copy">${escapeHtml(patient.location)} · ${escapeHtml(patient.sex)} · Age ${escapeHtml(String(patient.age))}</p>
        <div class="chip-row">
          <span class="mini-chip">${escapeHtml(patient.mrn)}</span>
          <span class="mini-chip">${escapeHtml(chart.story.title)}</span>
        </div>
      </div>

      <div class="hero-contact">
        <div>
          <span class="subheading">Phone</span>
          <strong>${escapeHtml(patient.phone || "Not recorded")}</strong>
        </div>
        <div>
          <span class="subheading">Email</span>
          <strong>${escapeHtml(patient.email || "Not recorded")}</strong>
        </div>
      </div>
    </div>

    <div class="hero-metrics">
      <article class="hero-metric">
        <span>Encounters</span>
        <strong>${escapeHtml(String(metrics.encounterCount))}</strong>
      </article>
      <article class="hero-metric">
        <span>Active Meds</span>
        <strong>${escapeHtml(String(metrics.activeMedicationCount))}</strong>
      </article>
      <article class="hero-metric">
        <span>Allergies</span>
        <strong>${escapeHtml(String(metrics.allergyCount))}</strong>
      </article>
      <article class="hero-metric">
        <span>Abnormal Labs</span>
        <strong>${escapeHtml(String(metrics.abnormalLabCount))}</strong>
      </article>
      <article class="hero-metric">
        <span>Scheduled Visits</span>
        <strong>${escapeHtml(String(metrics.scheduledAppointmentCount))}</strong>
      </article>
    </div>
  `;
}

function renderAlertsPanel() {
  const alerts = state.selectedChart?.alerts ?? [];
  const allergies = state.selectedChart?.allergies ?? [];

  const allergySummary = allergies.length
    ? allergies
        .map((allergy) => `${allergy.allergen} (${allergy.severity})`)
        .join(", ")
    : "No allergies recorded";

  refs.alertsPanel.innerHTML = sectionMarkup(
    "Clinical Alerts",
    alerts.length
      ? `
          <div class="stack">
            <p class="muted">Known allergies: ${escapeHtml(allergySummary)}</p>
            ${alerts
              .map(
                (alert) => `
                  <article class="alert-card alert-${alert.tone}">
                    <strong>${escapeHtml(alert.title)}</strong>
                    <p>${escapeHtml(alert.detail)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        `
      : `<p class="empty-state">No active clinical alerts for the selected patient.</p>`
  );
}

function renderOperationsPanel() {
  const dashboard = state.dashboard;

  if (!dashboard) {
    refs.operationsPanel.innerHTML = sectionMarkup("Operations Board", `<p class="empty-state">Dashboard data unavailable.</p>`);
    return;
  }

  const appointments = dashboard.scheduledAppointments.length
    ? `<div class="stack compact-stack">${dashboard.scheduledAppointments
        .map(
          (appointment) => `
            <article class="mini-row-card">
              <strong>${escapeHtml(appointment.patientName)}</strong>
              <p>${escapeHtml(appointment.reason || "Scheduled visit")}</p>
              <span>${escapeHtml(appointment.doctorName)} · ${formatDateTime(appointment.scheduledStart)}</span>
            </article>
          `
        )
        .join("")}</div>`
    : `<p class="empty-state">No scheduled visits.</p>`;

  const abnormalLabs = dashboard.abnormalLabs.length
    ? `<div class="stack compact-stack">${dashboard.abnormalLabs
        .map(
          (result) => `
            <article class="mini-row-card tone-rose">
              <strong>${escapeHtml(result.patientName)} · ${escapeHtml(result.resultName)}</strong>
              <p>${escapeHtml(result.testName)}</p>
              <span>${escapeHtml(result.resultValue)} ${escapeHtml(result.unit || "")} · ${escapeHtml(result.abnormalFlag)}</span>
            </article>
          `
        )
        .join("")}</div>`
    : `<p class="empty-state">No abnormal lab results.</p>`;

  refs.operationsPanel.innerHTML = sectionMarkup(
    "Operations Board",
    `
      <div class="stack">
        <div>
          <p class="subheading">Upcoming schedule</p>
          ${appointments}
        </div>
        <div>
          <p class="subheading">Lab watchlist</p>
          ${abnormalLabs}
        </div>
      </div>
    `
  );
}

function renderCareTeamPanel() {
  const chart = state.selectedChart;

  if (!chart) {
    refs.careTeamPanel.innerHTML = sectionMarkup("Care Team", `<p class="empty-state">No patient selected.</p>`);
    return;
  }

  const careTeam = buildCareTeam(chart);

  refs.careTeamPanel.innerHTML = sectionMarkup(
    "Care Team",
    careTeam.length
      ? `<div class="stack">${careTeam
          .map(
            (member) => `
              <article class="mini-row-card">
                <strong>${escapeHtml(member.name)}</strong>
                <p>${escapeHtml(member.specialty)}</p>
              </article>
            `
          )
          .join("")}</div>`
      : `<p class="empty-state">No care team data available.</p>`
  );
}

function renderAppointmentsPanel() {
  const chart = state.selectedChart;

  if (!chart) {
    refs.appointmentsPanel.innerHTML = sectionMarkup("Appointments", `<p class="empty-state">No patient selected.</p>`);
    return;
  }

  const appointments = chart.appointments ?? [];
  const doctors = chart.doctorDirectory ?? [];
  const isEditing = state.appointmentForm.mode === "edit";
  const submitLabel = isEditing ? "Save Changes" : "Create Appointment";
  const heading = isEditing ? "Reschedule or Update Appointment" : "Schedule New Appointment";
  const helper = isEditing
    ? "Edit the selected appointment, then save the changes."
    : "Create a scheduled appointment for the current patient.";

  const formMarkup = `
    <section class="appointment-manager">
      <div class="appointment-form-shell">
        <div class="section-head section-head-compact">
          <div>
            <p class="eyebrow">Workflow</p>
            <h3>${escapeHtml(heading)}</h3>
          </div>
        </div>

        <p class="muted panel-note">${escapeHtml(helper)}</p>

        <form class="appointment-form" data-appointment-form>
          <div class="form-grid">
            <label class="field">
              <span class="subheading">Doctor</span>
              <select name="doctorId" required>
                ${doctors
                  .map(
                    (doctor) =>
                      `<option value="${doctor.id}" ${doctor.id === state.appointmentForm.doctorId ? "selected" : ""}>${escapeHtml(doctor.fullName)} · ${escapeHtml(doctor.specialty)}</option>`
                  )
                  .join("")}
              </select>
            </label>

            <label class="field">
              <span class="subheading">Reason</span>
              <input type="text" name="reason" value="${escapeHtml(state.appointmentForm.reason)}" placeholder="Follow-up review" required>
            </label>

            <label class="field">
              <span class="subheading">Start</span>
              <input type="datetime-local" name="scheduledStart" value="${escapeHtml(state.appointmentForm.scheduledStart)}" required>
            </label>

            <label class="field">
              <span class="subheading">End</span>
              <input type="datetime-local" name="scheduledEnd" value="${escapeHtml(state.appointmentForm.scheduledEnd)}" required>
            </label>
          </div>

          <div class="action-row">
            <button type="submit" class="button primary">${escapeHtml(submitLabel)}</button>
            ${isEditing ? '<button type="button" class="button secondary" data-action="reset-appointment-form">Switch to Create</button>' : ""}
          </div>
        </form>
      </div>

      <div class="stack">
        ${appointments.length
          ? appointments
              .map(
                (appointment) => `
                  <article class="mini-row-card ${appointment.status === "scheduled" ? "tone-blue" : ""}">
                    <strong>${escapeHtml(appointment.reason || "Visit")}</strong>
                    <p>${escapeHtml(appointment.doctorName)} · ${escapeHtml(appointment.doctorSpecialty)}</p>
                    <span>${formatDateTime(appointment.scheduledStart)} to ${formatDateTime(appointment.scheduledEnd)} · ${escapeHtml(appointment.status)}</span>
                    ${appointment.status === "scheduled"
                      ? `
                          <div class="action-row compact-actions">
                            <button type="button" class="button secondary" data-action="edit-appointment" data-appointment-id="${appointment.id}">Edit</button>
                            <button type="button" class="button danger" data-action="cancel-appointment" data-appointment-id="${appointment.id}">Cancel</button>
                          </div>
                        `
                      : ""}
                  </article>
                `
              )
              .join("")
          : '<p class="empty-state">No appointments recorded.</p>'}
      </div>
    </section>
  `;

  refs.appointmentsPanel.innerHTML = sectionMarkup("Appointments", formMarkup);
}

function renderMedicationsPanel() {
  const medications = state.selectedChart?.medications ?? [];

  refs.medicationsPanel.innerHTML = sectionMarkup(
    "Medication Plan",
    medications.length
      ? `
          <div class="table">
            <div class="table-head">
              <span>Medication</span>
              <span>Dose</span>
              <span>Route / Frequency</span>
              <span>Status</span>
            </div>
            ${medications
              .map(
                (medication) => `
                  <div class="table-row">
                    <div>
                      <strong>${escapeHtml(medication.medicationName)}</strong>
                      <span>${escapeHtml(medication.instructions || "No special instructions")}</span>
                    </div>
                    <div>${escapeHtml(medication.dose)}</div>
                    <div>${escapeHtml(medication.route)} · ${escapeHtml(medication.frequency)}</div>
                    <div><span class="mini-chip status-${medication.status === "active" ? "success" : "warn"}">${escapeHtml(medication.status)}</span></div>
                  </div>
                `
              )
              .join("")}
          </div>
        `
      : `<p class="empty-state">No medications recorded.</p>`
  );
}

function renderLabsPanel() {
  const labOrders = state.selectedChart?.labOrders ?? [];

  refs.labsPanel.innerHTML = sectionMarkup(
    "Labs",
    labOrders.length
      ? `<div class="stack">${labOrders
          .map(
            (order) => `
              <article class="lab-order-card">
                <div class="lab-order-top">
                  <div>
                    <strong>${escapeHtml(order.testName)}</strong>
                    <p>${escapeHtml(order.orderingDoctor)} · ${formatDateTime(order.orderedAt)}</p>
                  </div>
                  <div class="chip-row">
                    <span class="mini-chip">${escapeHtml(order.priority)}</span>
                    <span class="mini-chip status-${order.status === "resulted" ? "success" : "warn"}">${escapeHtml(order.status)}</span>
                  </div>
                </div>

                ${order.results.length
                  ? `<ul class="result-list">${order.results
                      .map(
                        (result) => `
                          <li>
                            <strong>${escapeHtml(result.resultName)}</strong>
                            <span>${escapeHtml(result.resultValue)} ${escapeHtml(result.unit || "")}</span>
                            <span class="mini-chip status-${result.abnormalFlag === "normal" ? "success" : result.abnormalFlag === "critical" || result.abnormalFlag === "high" ? "danger" : "warn"}">${escapeHtml(result.abnormalFlag)}</span>
                          </li>
                        `
                      )
                      .join("")}</ul>`
                  : `<p class="empty-state">No result rows recorded.</p>`}
              </article>
            `
          )
          .join("")}</div>`
      : `<p class="empty-state">No lab data recorded.</p>`
  );
}

function renderTimelinePanel() {
  const encounters = state.selectedChart?.encounters ?? [];

  refs.timelinePanel.innerHTML = sectionMarkup(
    "Encounter Timeline",
    encounters.length
      ? `<div class="timeline-list">${encounters
          .map(
            (encounter) => `
              <article class="timeline-card">
                <div class="timeline-top">
                  <div>
                    <strong>${formatDateTime(encounter.encounterDate)}</strong>
                    <p>${escapeHtml(encounter.doctorName)} · ${escapeHtml(encounter.doctorSpecialty)}</p>
                  </div>
                  <div class="chip-row">
                    <span class="mini-chip">${escapeHtml(encounter.encounterType.replaceAll("_", " "))}</span>
                    <span class="mini-chip status-${encounter.status === "signed" ? "success" : "warn"}">${escapeHtml(encounter.status)}</span>
                  </div>
                </div>

                <p class="body-copy">${escapeHtml(encounter.chiefComplaint || encounter.assessment || "No summary recorded.")}</p>
                <p class="muted">${escapeHtml(encounter.plan || "No care plan recorded.")}</p>

                <div class="detail-grid">
                  <div>
                    <p class="subheading">Diagnoses</p>
                    ${encounter.diagnoses.length
                      ? `<ul>${encounter.diagnoses
                          .map(
                            (diagnosis) =>
                              `<li>${escapeHtml(diagnosis.code)} · ${escapeHtml(diagnosis.name)}${diagnosis.isPrimary ? " (primary)" : ""}</li>`
                          )
                          .join("")}</ul>`
                      : `<p class="empty-state">No diagnoses linked.</p>`}
                  </div>

                  <div>
                    <p class="subheading">Vitals</p>
                    ${encounter.vitals
                      ? `<p class="muted">BP ${escapeHtml(String(encounter.vitals.systolicBp ?? "-"))}/${escapeHtml(String(encounter.vitals.diastolicBp ?? "-"))} · HR ${escapeHtml(String(encounter.vitals.heartRate ?? "-"))} · Temp ${escapeHtml(String(encounter.vitals.temperatureC ?? "-"))} C · SpO2 ${escapeHtml(String(encounter.vitals.oxygenSaturation ?? "-"))}%</p>`
                      : `<p class="empty-state">No vitals recorded.</p>`}
                  </div>
                </div>
              </article>
            `
          )
          .join("")}</div>`
      : `<p class="empty-state">No encounters recorded.</p>`
  );
}

function buildCareTeam(chart) {
  const members = new Map();

  chart.encounters.forEach((encounter) => {
    members.set(encounter.doctorName, {
      name: encounter.doctorName,
      specialty: encounter.doctorSpecialty,
    });
  });

  chart.appointments.forEach((appointment) => {
    members.set(appointment.doctorName, {
      name: appointment.doctorName,
      specialty: appointment.doctorSpecialty,
    });
  });

  return [...members.values()];
}

function renderEmptyWorkspace(message) {
  refs.storyBrief.innerHTML = sectionMarkup("Selected Scenario", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.patientHero.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  refs.alertsPanel.innerHTML = sectionMarkup("Clinical Alerts", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.careTeamPanel.innerHTML = sectionMarkup("Care Team", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.appointmentsPanel.innerHTML = sectionMarkup("Appointments", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.medicationsPanel.innerHTML = sectionMarkup("Medication Plan", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.labsPanel.innerHTML = sectionMarkup("Labs", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.timelinePanel.innerHTML = sectionMarkup("Encounter Timeline", `<p class="empty-state">${escapeHtml(message)}</p>`);
}

function renderFatalState(error) {
  const message = error.message || "Unable to load the workspace.";
  refs.metricsGrid.innerHTML = `<p class="empty-state">Metrics unavailable.</p>`;
  refs.patientList.innerHTML = `<p class="empty-state">Directory unavailable.</p>`;
  renderEmptyWorkspace(message);
  refs.systemStatus.innerHTML = sectionMarkup("System Status", `<p class="empty-state">${escapeHtml(message)}</p>`);
  refs.operationsPanel.innerHTML = sectionMarkup("Operations Board", `<p class="empty-state">${escapeHtml(message)}</p>`);
}

function renderPatientError(error) {
  const message = error.message || "Unable to load the patient chart.";
  renderEmptyWorkspace(message);
  refs.storyBrief.innerHTML = sectionMarkup("Selected Scenario", `<p class="empty-state">${escapeHtml(message)}</p>`);
}

function sectionMarkup(title, body) {
  return `
    <div class="section-head section-head-compact">
      <div>
        <p class="eyebrow">Workspace Panel</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
    </div>
    ${body}
  `;
}

function setStatus(message, tone) {
  refs.statusPill.textContent = message;
  refs.statusPill.className = `status-pill status-${tone}`;
}

function toDatetimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

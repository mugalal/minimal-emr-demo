import { escapeHtml, formatDate, formatDateTime } from "./formatters.js";

export function renderTabs(routes, currentRoute) {
  return routes
    .map(
      (route) =>
        `<button type="button" class="tab-button ${route.id === currentRoute ? "active" : ""}" data-route="${route.id}">${escapeHtml(route.label)}</button>`
    )
    .join("");
}

export function renderMetrics(metrics) {
  if (!metrics) {
    return `<p class="empty-state">No metrics available.</p>`;
  }

  const cards = [
    { label: "Patients", value: metrics.patientCount, accent: "teal" },
    { label: "Doctors", value: metrics.doctorCount, accent: "blue" },
    { label: "Scheduled Visits", value: metrics.scheduledAppointmentsCount, accent: "violet" },
    { label: "Active Medications", value: metrics.activeMedicationsCount, accent: "amber" },
    { label: "Abnormal Labs", value: metrics.abnormalLabCount, accent: "rose" },
  ];

  return cards
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

export function renderPatientExplorer(patients, selectedPatientId) {
  if (!patients.length) {
    return `<p class="empty-state">No patients match your search.</p>`;
  }

  return patients
    .map((patient) => {
      const isActive = patient.id === selectedPatientId;
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

export function renderSidebarPatientSummary(chart, onCreateMode = false) {
  if (onCreateMode || !chart?.patient) {
    return section(
      "Selected Patient",
      `
        <div class="sidebar-summary-card">
          <p class="muted">No active chart selected. Use the patient admin page to create a new record.</p>
        </div>
      `
    );
  }

  const patient = chart.patient;

  return section(
    "Selected Patient",
    `
      <div class="sidebar-summary-card">
        <div>
          <h3>${escapeHtml(patient.fullName)}</h3>
          <p class="muted">${escapeHtml(patient.mrn)} · ${escapeHtml(patient.location)}</p>
        </div>
        <div class="chip-row">
          <span class="mini-chip">Age ${escapeHtml(String(patient.age))}</span>
          <span class="mini-chip">${escapeHtml(patient.sex)}</span>
        </div>
        <div class="summary-list">
          <div>
            <span class="subheading">Phone</span>
            <strong>${escapeHtml(patient.phone || "Not recorded")}</strong>
          </div>
          <div>
            <span class="subheading">Date of Birth</span>
            <strong>${escapeHtml(formatDate(patient.dateOfBirth))}</strong>
          </div>
        </div>
        <div class="quick-actions">
          <button type="button" class="button secondary" data-action="start-edit-patient">Edit Patient</button>
          <button type="button" class="button secondary" data-action="start-create-patient">New Patient</button>
        </div>
      </div>
    `
  );
}

export function renderSidebarSystemSummary(health) {
  if (!health) {
    return section("System Status", `<p class="empty-state">Health data unavailable.</p>`);
  }

  return section(
    "System Status",
    `
      <div class="summary-list">
        <div class="system-row">
          <span>API</span>
          <span class="mini-chip status-${health.status === "ok" ? "success" : "warn"}">${escapeHtml(health.status)}</span>
        </div>
        <div class="system-row">
          <span>Database</span>
          <span class="mini-chip status-${health.dataSources.postgres.configured ? "success" : "warn"}">${health.dataSources.postgres.configured ? "Connected" : "Not configured"}</span>
        </div>
        <div class="system-row">
          <span>Last checked</span>
          <span>${formatDateTime(health.checkedAt)}</span>
        </div>
      </div>
    `
  );
}

export function renderPatientHero(chart) {
  if (!chart?.patient) {
    return `<div class="panel hero-card"><p class="empty-state">Select a patient to view chart details.</p></div>`;
  }

  const patient = chart.patient;
  const metrics = chart.metrics;

  return `
    <section class="panel hero-card">
      <div class="hero-layout">
        <div>
          <h2>${escapeHtml(patient.fullName)}</h2>
          <p class="body-copy">${escapeHtml(patient.location)} · ${escapeHtml(patient.sex)} · Age ${escapeHtml(String(patient.age))}</p>
          <div class="chip-row">
            <span class="mini-chip">${escapeHtml(patient.mrn)}</span>
            <span class="mini-chip">${escapeHtml(chart.story.title)}</span>
          </div>
        </div>
        <div class="summary-list">
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
        ${[
          ["Encounters", metrics.encounterCount],
          ["Active Meds", metrics.activeMedicationCount],
          ["Allergies", metrics.allergyCount],
          ["Abnormal Labs", metrics.abnormalLabCount],
          ["Scheduled Visits", metrics.scheduledAppointmentCount],
        ]
          .map(
            ([label, value]) => `
              <article class="hero-metric">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(String(value))}</strong>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

export function section(title, body) {
  return `
    <div class="section-head">
      <h2>${escapeHtml(title)}</h2>
    </div>
    ${body}
  `;
}

export function pageHeader(title, description) {
  return `
    <header class="page-header">
      <h2>${escapeHtml(title)}</h2>
      <p class="muted">${escapeHtml(description)}</p>
    </header>
  `;
}

export function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

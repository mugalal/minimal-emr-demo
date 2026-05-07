import { emptyState, pageHeader, renderPatientHero, section } from "../ui/shared.js";
import { escapeHtml, formatDateTime } from "../ui/formatters.js";

export function renderOverviewPage(state) {
  const dashboard = state.dashboard;
  const chart = state.selectedChart;

  const spotlight = dashboard?.spotlightPatients?.length
    ? dashboard.spotlightPatients
        .map(
          (patient) => `
            <article class="entity-card">
              <div class="entity-card-top">
                <div>
                  <strong>${escapeHtml(patient.fullName)}</strong>
                  <p>${escapeHtml(patient.mrn)} · ${escapeHtml(patient.location)}</p>
                </div>
                <span class="mini-chip">${escapeHtml(patient.story.title)}</span>
              </div>
              <p class="entity-note">${escapeHtml(patient.story.summary)}</p>
            </article>
          `
        )
        .join("")
    : emptyState("No spotlight patients available.");

  const abnormalLabs = dashboard?.abnormalLabs?.length
    ? dashboard.abnormalLabs
        .map(
          (lab) => `
            <article class="entity-card tone-rose">
              <strong>${escapeHtml(lab.patientName)} · ${escapeHtml(lab.resultName)}</strong>
              <p>${escapeHtml(lab.testName)}</p>
              <span>${escapeHtml(lab.resultValue)} ${escapeHtml(lab.unit || "")} · ${escapeHtml(lab.abnormalFlag)}</span>
            </article>
          `
        )
        .join("")
    : emptyState("No abnormal lab results.");

  const scheduled = dashboard?.scheduledAppointments?.length
    ? dashboard.scheduledAppointments
        .map(
          (appointment) => `
            <article class="entity-card">
              <strong>${escapeHtml(appointment.patientName)}</strong>
              <p>${escapeHtml(appointment.reason || "Scheduled visit")}</p>
              <span>${escapeHtml(appointment.doctorName)} · ${formatDateTime(appointment.scheduledStart)}</span>
            </article>
          `
        )
        .join("")
    : emptyState("No scheduled appointments.");

  return `
    <div class="page-layout">
      ${pageHeader("Overview", "High-level view of the current workspace.")}
      ${renderPatientHero(chart)}
      <div class="overview-grid">
        <section class="panel span-2">
          ${section(
            "Current Focus",
            chart?.story
              ? `
                <div class="page-two-col">
                  <div class="form-shell">
                    <h3>${escapeHtml(chart.story.title)}</h3>
                    <p class="body-copy">${escapeHtml(chart.story.summary)}</p>
                    <p class="muted">${escapeHtml(chart.story.whyItMatters)}</p>
                  </div>
                  <div class="form-shell">
                    <div class="chip-row">
                      ${chart.story.focusAreas.map((focus) => `<span class="mini-chip">${escapeHtml(focus)}</span>`).join("")}
                    </div>
                  </div>
                </div>
              `
              : emptyState("Select a patient to review the current chart context.")
          )}
        </section>

        <section class="panel">
          ${section("Spotlight Patients", `<div class="entity-list">${spotlight}</div>`)}
        </section>

        <section class="panel">
          ${section("Lab Watchlist", `<div class="entity-list">${abnormalLabs}</div>`)}
        </section>

        <section class="panel span-2">
          ${section("Scheduling Outlook", `<div class="entity-list">${scheduled}</div>`)}
        </section>
      </div>
    </div>
  `;
}

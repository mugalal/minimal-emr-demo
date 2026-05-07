import { emptyState, pageHeader, renderPatientHero, section } from "../ui/shared.js";
import { escapeHtml, formatDateTime } from "../ui/formatters.js";

function buildCareTeam(chart) {
  const members = new Map();

  chart?.encounters?.forEach((encounter) => {
    members.set(encounter.doctorName, {
      name: encounter.doctorName,
      specialty: encounter.doctorSpecialty,
    });
  });

  chart?.appointments?.forEach((appointment) => {
    members.set(appointment.doctorName, {
      name: appointment.doctorName,
      specialty: appointment.doctorSpecialty,
    });
  });

  return [...members.values()];
}

export function renderOperationsPage(state) {
  const dashboard = state.dashboard;
  const chart = state.selectedChart;
  const careTeam = buildCareTeam(chart);

  const alertsMarkup = chart?.alerts?.length
    ? chart.alerts
        .map(
          (alert) => `
            <article class="entity-card alert-${alert.tone}">
              <strong>${escapeHtml(alert.title)}</strong>
              <p>${escapeHtml(alert.detail)}</p>
            </article>
          `
        )
        .join("")
    : emptyState("No active clinical alerts for the selected patient.");

  const operationsMarkup = dashboard?.scheduledAppointments?.length
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
    : emptyState("No scheduled visits in the dashboard snapshot.");

  const careTeamMarkup = careTeam.length
    ? careTeam
        .map(
          (member) => `
            <article class="entity-card">
              <strong>${escapeHtml(member.name)}</strong>
              <p>${escapeHtml(member.specialty)}</p>
            </article>
          `
        )
        .join("")
    : emptyState("No care team data available.");

  const abnormalMarkup = dashboard?.abnormalLabs?.length
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
    : emptyState("No abnormal lab results in the current snapshot.");

  return `
    <div class="page-layout">
      ${pageHeader("Operations", "Monitor care coordination, open issues, and active chart alerts from one operational view.")}
      ${renderPatientHero(chart)}
      <div class="page-grid">
        <section class="panel">${section("Clinical Alerts", `<div class="entity-list">${alertsMarkup}</div>`)}</section>
        <section class="panel">${section("Care Team", `<div class="entity-list">${careTeamMarkup}</div>`)}</section>
        <section class="panel">${section("Upcoming Schedule", `<div class="entity-list">${operationsMarkup}</div>`)}</section>
        <section class="panel">${section("Abnormal Lab Watchlist", `<div class="entity-list">${abnormalMarkup}</div>`)}</section>
      </div>
    </div>
  `;
}

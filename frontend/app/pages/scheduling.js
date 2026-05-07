import { emptyState, pageHeader, renderPatientHero, section } from "../ui/shared.js";
import { escapeHtml, formatDateTime } from "../ui/formatters.js";

function renderAppointmentForm(state) {
  const chart = state.selectedChart;

  if (!chart?.patient) {
    return `<section class="panel">${section("Appointment Workflow", emptyState("Select a patient to manage scheduling."))}</section>`;
  }

  const form = state.forms.appointment;
  const isEditing = form.mode === "edit";

  return `
    <section class="panel">
      ${section(
        "Appointment Workflow",
        `
          <div class="manager-layout">
            <div class="form-shell">
              <p class="muted panel-note">${escapeHtml(isEditing ? "Update the selected appointment and save changes." : "Create a scheduled appointment for the active patient.")}</p>
              <form class="stack" data-form="appointment">
                <div class="form-grid">
                  <label class="field"><span class="subheading">Doctor</span><select name="doctorId" required>${chart.doctorDirectory.map((doctor) => `<option value="${doctor.id}" ${doctor.id === form.doctorId ? "selected" : ""}>${escapeHtml(doctor.fullName)} · ${escapeHtml(doctor.specialty)}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Reason</span><input type="text" name="reason" value="${escapeHtml(form.reason)}" required></label>
                  <label class="field"><span class="subheading">Start</span><input type="datetime-local" name="scheduledStart" value="${escapeHtml(form.scheduledStart)}" required></label>
                  <label class="field"><span class="subheading">End</span><input type="datetime-local" name="scheduledEnd" value="${escapeHtml(form.scheduledEnd)}" required></label>
                </div>
                <div class="action-row">
                  <button type="submit" class="button primary">${escapeHtml(isEditing ? "Save Changes" : "Create Appointment")}</button>
                  ${isEditing ? '<button type="button" class="button secondary" data-action="appointment-reset">Switch to Create</button>' : ""}
                </div>
              </form>
            </div>
            <div class="manager-stack">
              ${chart.appointments.length
                ? chart.appointments
                    .map(
                      (appointment) => `
                        <article class="entity-card ${appointment.status === "scheduled" ? "tone-blue" : ""}">
                          <div class="entity-card-top">
                            <div>
                              <strong>${escapeHtml(appointment.reason || "Visit")}</strong>
                              <p>${escapeHtml(appointment.doctorName)} · ${escapeHtml(appointment.doctorSpecialty)}</p>
                            </div>
                            <span class="mini-chip">${escapeHtml(appointment.status)}</span>
                          </div>
                          <p>${escapeHtml(formatDateTime(appointment.scheduledStart))} to ${escapeHtml(formatDateTime(appointment.scheduledEnd))}</p>
                          ${appointment.status === "scheduled" ? `<div class="action-row"><button type="button" class="button secondary" data-action="appointment-edit" data-appointment-id="${appointment.id}">Edit</button><button type="button" class="button danger" data-action="appointment-cancel" data-appointment-id="${appointment.id}">Cancel</button></div>` : ""}
                        </article>
                      `
                    )
                    .join("")
                : emptyState("No appointments recorded for the active patient.")}
            </div>
          </div>
        `
      )}
    </section>
  `;
}

function renderOrgSchedule(state) {
  const scheduledAppointments = state.dashboard?.scheduledAppointments ?? [];

  return `
    <section class="panel">
      ${section(
        "Cross-Patient Schedule",
        scheduledAppointments.length
          ? `<div class="entity-list">${scheduledAppointments
              .map(
                (appointment) => `
                  <article class="entity-card">
                    <strong>${escapeHtml(appointment.patientName)}</strong>
                    <p>${escapeHtml(appointment.reason || "Scheduled visit")}</p>
                    <span>${escapeHtml(appointment.doctorName)} · ${formatDateTime(appointment.scheduledStart)}</span>
                  </article>
                `
              )
              .join("")}</div>`
          : emptyState("No scheduled visits in the current dashboard snapshot.")
      )}
    </section>
  `;
}

export function renderSchedulingPage(state) {
  return `
    <div class="page-layout">
      ${pageHeader("Scheduling", "Coordinate patient visits, maintain the selected patient schedule, and review upcoming appointments across the workspace.")}
      ${renderPatientHero(state.selectedChart)}
      ${renderAppointmentForm(state)}
      ${renderOrgSchedule(state)}
    </div>
  `;
}

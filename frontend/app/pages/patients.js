import { emptyState, pageHeader, renderPatientHero, section } from "../ui/shared.js";
import { escapeHtml } from "../ui/formatters.js";

function renderPatientForm(state) {
  const form = state.forms.patient;
  const isCreate = form.mode === "create";
  const sexOptions = state.selectedChart?.referenceData?.patientSexes ?? ["female", "male", "other", "unknown"];

  return `
    <section class="panel">
      ${section(
        "Patient Administration",
        `
          <div class="page-two-col">
            <div class="form-shell">
              <p class="muted panel-note">${escapeHtml(isCreate ? "Create a new patient record. MRN is assigned automatically." : "Update the currently selected patient demographics and contact information.")}</p>
              <form class="stack" data-form="patient">
                <div class="form-grid">
                  <label class="field"><span class="subheading">First name</span><input type="text" name="firstName" value="${escapeHtml(form.firstName)}" required></label>
                  <label class="field"><span class="subheading">Last name</span><input type="text" name="lastName" value="${escapeHtml(form.lastName)}" required></label>
                  <label class="field"><span class="subheading">Date of birth</span><input type="date" name="dateOfBirth" value="${escapeHtml(form.dateOfBirth)}" required></label>
                  <label class="field"><span class="subheading">Sex</span><select name="sex" required>${sexOptions.map((sex) => `<option value="${sex}" ${sex === form.sex ? "selected" : ""}>${escapeHtml(sex)}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Phone</span><input type="text" name="phone" value="${escapeHtml(form.phone)}"></label>
                  <label class="field"><span class="subheading">Email</span><input type="email" name="email" value="${escapeHtml(form.email)}"></label>
                  <label class="field field-wide"><span class="subheading">Address</span><input type="text" name="addressLine1" value="${escapeHtml(form.addressLine1)}"></label>
                  <label class="field"><span class="subheading">City</span><input type="text" name="city" value="${escapeHtml(form.city)}"></label>
                  <label class="field"><span class="subheading">State</span><input type="text" name="state" value="${escapeHtml(form.state)}"></label>
                  <label class="field"><span class="subheading">Postal code</span><input type="text" name="postalCode" value="${escapeHtml(form.postalCode)}"></label>
                </div>
                <div class="action-row">
                  <button type="submit" class="button primary">${escapeHtml(isCreate ? "Create Patient" : "Save Patient")}</button>
                  ${isCreate ? '<button type="button" class="button secondary" data-action="patient-edit-selected">Edit Selected Patient</button>' : '<button type="button" class="button secondary" data-action="patient-create-mode">New Patient</button>'}
                </div>
              </form>
            </div>
            <div class="form-shell">
              <p class="eyebrow">Workflow Notes</p>
              <ul>
                <li>Patient creation assigns the next available demo MRN automatically.</li>
                <li>Patient edits update the chart view immediately after save.</li>
                <li>Demographics remain the entry point for downstream appointment and encounter workflows.</li>
              </ul>
            </div>
          </div>
        `
      )}
    </section>
  `;
}

export function renderPatientsPage(state) {
  const chart = state.selectedChart;

  return `
    <div class="page-layout">
      ${pageHeader("Patients", "Manage demographics and review the active patient chart without leaving the clinical workspace.")}
      ${renderPatientHero(chart)}
      ${renderPatientForm(state)}
      <section class="panel">
        ${section(
          "Patient Snapshot",
          chart?.patient
            ? `
              <div class="page-three-col">
                <div class="form-shell">
                  <p class="eyebrow">Contact</p>
                  <div class="summary-list">
                    <div><span class="subheading">Phone</span><strong>${escapeHtml(chart.patient.phone || "Not recorded")}</strong></div>
                    <div><span class="subheading">Email</span><strong>${escapeHtml(chart.patient.email || "Not recorded")}</strong></div>
                  </div>
                </div>
                <div class="form-shell">
                  <p class="eyebrow">Address</p>
                  <p class="body-copy">${escapeHtml(chart.patient.addressLine1 || "No address recorded")}</p>
                  <p class="muted">${escapeHtml(chart.patient.location)}</p>
                </div>
                <div class="form-shell">
                  <p class="eyebrow">Chart Summary</p>
                  <div class="summary-list">
                    <div><span class="subheading">Allergies</span><strong>${escapeHtml(String(chart.metrics.allergyCount))}</strong></div>
                    <div><span class="subheading">Encounters</span><strong>${escapeHtml(String(chart.metrics.encounterCount))}</strong></div>
                    <div><span class="subheading">Scheduled visits</span><strong>${escapeHtml(String(chart.metrics.scheduledAppointmentCount))}</strong></div>
                  </div>
                </div>
              </div>
            `
            : emptyState("Select a patient to view demographic and chart details.")
        )}
      </section>
    </div>
  `;
}

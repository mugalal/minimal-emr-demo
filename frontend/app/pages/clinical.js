import { emptyState, pageHeader, renderPatientHero, section } from "../ui/shared.js";
import { escapeHtml, formatDateTime } from "../ui/formatters.js";

function renderAllergyManager(chart, form) {
  if (!chart?.patient) {
    return `<section class="panel">${section("Allergies", emptyState("Select a patient to manage allergy data."))}</section>`;
  }

  return `
    <section class="panel">
      ${section(
        "Allergy Management",
        `
          <div class="manager-layout">
            <div class="form-shell">
              <form class="stack" data-form="allergy">
                <div class="form-grid">
                  <label class="field"><span class="subheading">Allergen</span><input type="text" name="allergen" value="${escapeHtml(form.allergen)}" required></label>
                  <label class="field"><span class="subheading">Severity</span><select name="severity" required>${chart.referenceData.allergySeverities.map((severity) => `<option value="${severity}" ${severity === form.severity ? "selected" : ""}>${escapeHtml(severity)}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Reaction</span><input type="text" name="reaction" value="${escapeHtml(form.reaction)}"></label>
                  <label class="field field-wide"><span class="subheading">Notes</span><textarea name="notes" rows="3">${escapeHtml(form.notes)}</textarea></label>
                </div>
                <div class="action-row"><button type="submit" class="button primary">Add Allergy</button></div>
              </form>
            </div>
            <div class="manager-stack">
              ${chart.allergies.length
                ? chart.allergies
                    .map(
                      (allergy) => `
                        <article class="entity-card ${allergy.severity === "severe" ? "alert-danger" : ""}">
                          <div class="entity-card-top">
                            <div>
                              <strong>${escapeHtml(allergy.allergen)}</strong>
                              <p>${escapeHtml(allergy.reaction || "Reaction not recorded")}</p>
                            </div>
                            <span class="mini-chip">${escapeHtml(allergy.status)}</span>
                          </div>
                          <p>${escapeHtml(allergy.severity)}</p>
                          ${allergy.notes ? `<p>${escapeHtml(allergy.notes)}</p>` : ""}
                          ${allergy.status === "active" ? `<div class="action-row"><button type="button" class="button secondary" data-action="allergy-deactivate" data-allergy-id="${allergy.id}">Mark Inactive</button></div>` : ""}
                        </article>
                      `
                    )
                    .join("")
                : emptyState("No allergies recorded.")}
            </div>
          </div>
        `
      )}
    </section>
  `;
}

function renderMedicationManager(chart, form) {
  if (!chart?.patient) {
    return `<section class="panel">${section("Medications", emptyState("Select a patient to manage medications."))}</section>`;
  }

  const encounterMap = new Map(chart.encounters.map((encounter) => [encounter.id, encounter]));

  return `
    <section class="panel">
      ${section(
        "Medication Management",
        `
          <div class="manager-layout">
            <div class="form-shell">
              <p class="muted panel-note">Medications are attached to an existing encounter in the active chart.</p>
              <form class="stack" data-form="medication">
                <div class="form-grid">
                  <label class="field"><span class="subheading">Encounter</span><select name="encounterId" required>${chart.encounters.map((encounter) => `<option value="${encounter.id}" ${encounter.id === form.encounterId ? "selected" : ""}>${formatDateTime(encounter.encounterDate)} · ${escapeHtml(encounter.encounterType.replaceAll("_", " "))}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Medication</span><input type="text" name="medicationName" value="${escapeHtml(form.medicationName)}" required></label>
                  <label class="field"><span class="subheading">Dose</span><input type="text" name="dose" value="${escapeHtml(form.dose)}" required></label>
                  <label class="field"><span class="subheading">Route</span><input type="text" name="route" value="${escapeHtml(form.route)}" required></label>
                  <label class="field"><span class="subheading">Frequency</span><input type="text" name="frequency" value="${escapeHtml(form.frequency)}" required></label>
                  <label class="field"><span class="subheading">Status</span><select name="status">${chart.referenceData.medicationStatuses.map((status) => `<option value="${status}" ${status === form.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Start date</span><input type="date" name="startDate" value="${escapeHtml(form.startDate)}" required></label>
                  <label class="field"><span class="subheading">End date</span><input type="date" name="endDate" value="${escapeHtml(form.endDate)}"></label>
                  <label class="field field-wide"><span class="subheading">Instructions</span><textarea name="instructions" rows="3">${escapeHtml(form.instructions)}</textarea></label>
                </div>
                <div class="action-row"><button type="submit" class="button primary">Add Medication</button></div>
              </form>
            </div>
            <div class="manager-stack">
              ${chart.medications.length
                ? chart.medications
                    .map((medication) => {
                      const encounter = encounterMap.get(medication.encounterId);
                      return `
                        <article class="entity-card ${medication.status === "active" ? "tone-blue" : ""}">
                          <div class="entity-card-top">
                            <div>
                              <strong>${escapeHtml(medication.medicationName)}</strong>
                              <p>${escapeHtml(medication.dose)} · ${escapeHtml(medication.route)} · ${escapeHtml(medication.frequency)}</p>
                            </div>
                            <span class="mini-chip">${escapeHtml(medication.status)}</span>
                          </div>
                          <p>${escapeHtml(medication.startDate)}${medication.endDate ? ` to ${escapeHtml(medication.endDate)}` : ""}</p>
                          ${encounter ? `<p>${escapeHtml(encounter.encounterType.replaceAll("_", " "))} on ${formatDateTime(encounter.encounterDate)}</p>` : ""}
                          ${medication.instructions ? `<p>${escapeHtml(medication.instructions)}</p>` : ""}
                          ${medication.status === "active" ? `<div class="action-row"><button type="button" class="button secondary" data-action="medication-stop" data-medication-id="${medication.id}">Stop Medication</button></div>` : ""}
                        </article>
                      `;
                    })
                    .join("")
                : emptyState("No medications recorded.")}
            </div>
          </div>
        `
      )}
    </section>
  `;
}

function renderLabs(chart) {
  if (!chart?.patient) {
    return `<section class="panel">${section("Labs", emptyState("Select a patient to review lab data."))}</section>`;
  }

  return `
    <section class="panel">
      ${section(
        "Labs",
        chart.labOrders.length
          ? `<div class="entity-list">${chart.labOrders
              .map(
                (order) => `
                  <article class="lab-card">
                    <div class="lab-top">
                      <div>
                        <strong>${escapeHtml(order.testName)}</strong>
                        <p>${escapeHtml(order.orderingDoctor)} · ${formatDateTime(order.orderedAt)}</p>
                      </div>
                      <div class="chip-row">
                        <span class="mini-chip">${escapeHtml(order.priority)}</span>
                        <span class="mini-chip">${escapeHtml(order.status)}</span>
                      </div>
                    </div>
                    ${order.results.length
                      ? `<ul>${order.results
                          .map(
                            (result) => `
                              <li>
                                <strong>${escapeHtml(result.resultName)}</strong>
                                <span>${escapeHtml(result.resultValue)} ${escapeHtml(result.unit || "")}</span>
                                <span class="mini-chip ${result.abnormalFlag === "normal" ? "status-success" : "status-warn"}">${escapeHtml(result.abnormalFlag)}</span>
                              </li>
                            `
                          )
                          .join("")}</ul>`
                      : emptyState("No result rows recorded.")}
                  </article>
                `
              )
              .join("")}</div>`
          : emptyState("No lab data recorded.")
      )}
    </section>
  `;
}

function renderEncounterManager(chart, form) {
  if (!chart?.patient) {
    return `<section class="panel">${section("Encounters", emptyState("Select a patient to manage encounters."))}</section>`;
  }

  return `
    <section class="panel span-2">
      ${section(
        "Encounter Workflow",
        `
          <div class="page-layout">
            <div class="form-shell">
              <p class="muted panel-note">Create a basic encounter with note text, an optional primary diagnosis, and an optional vital-sign snapshot.</p>
              <form class="stack" data-form="encounter">
                <div class="form-grid">
                  <label class="field"><span class="subheading">Doctor</span><select name="doctorId" required>${chart.doctorDirectory.map((doctor) => `<option value="${doctor.id}" ${doctor.id === form.doctorId ? "selected" : ""}>${escapeHtml(doctor.fullName)} · ${escapeHtml(doctor.specialty)}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Encounter date</span><input type="datetime-local" name="encounterDate" value="${escapeHtml(form.encounterDate)}" required></label>
                  <label class="field"><span class="subheading">Encounter type</span><select name="encounterType" required>${chart.referenceData.encounterTypes.map((type) => `<option value="${type}" ${type === form.encounterType ? "selected" : ""}>${escapeHtml(type.replaceAll("_", " "))}</option>`).join("")}</select></label>
                  <label class="field"><span class="subheading">Status</span><select name="status" required>${chart.referenceData.encounterStatuses.map((status) => `<option value="${status}" ${status === form.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select></label>
                  <label class="field field-wide"><span class="subheading">Chief complaint</span><input type="text" name="chiefComplaint" value="${escapeHtml(form.chiefComplaint)}"></label>
                  <label class="field field-wide"><span class="subheading">Assessment</span><textarea name="assessment" rows="3">${escapeHtml(form.assessment)}</textarea></label>
                  <label class="field field-wide"><span class="subheading">Plan</span><textarea name="plan" rows="3">${escapeHtml(form.plan)}</textarea></label>
                  <label class="field"><span class="subheading">Diagnosis code</span><input type="text" name="icd10Code" value="${escapeHtml(form.icd10Code)}"></label>
                  <label class="field"><span class="subheading">Diagnosis name</span><input type="text" name="diagnosisName" value="${escapeHtml(form.diagnosisName)}"></label>
                </div>
                <div class="field-row">
                  <label class="field"><span class="subheading">Height (cm)</span><input type="number" step="0.1" name="heightCm" value="${escapeHtml(form.heightCm)}"></label>
                  <label class="field"><span class="subheading">Weight (kg)</span><input type="number" step="0.1" name="weightKg" value="${escapeHtml(form.weightKg)}"></label>
                  <label class="field"><span class="subheading">BMI</span><input type="number" step="0.1" name="bmi" value="${escapeHtml(form.bmi)}"></label>
                  <label class="field"><span class="subheading">Systolic BP</span><input type="number" name="systolicBp" value="${escapeHtml(form.systolicBp)}"></label>
                  <label class="field"><span class="subheading">Diastolic BP</span><input type="number" name="diastolicBp" value="${escapeHtml(form.diastolicBp)}"></label>
                  <label class="field"><span class="subheading">Heart Rate</span><input type="number" name="heartRate" value="${escapeHtml(form.heartRate)}"></label>
                  <label class="field"><span class="subheading">Respiratory Rate</span><input type="number" name="respiratoryRate" value="${escapeHtml(form.respiratoryRate)}"></label>
                  <label class="field"><span class="subheading">Temperature (C)</span><input type="number" step="0.1" name="temperatureC" value="${escapeHtml(form.temperatureC)}"></label>
                  <label class="field"><span class="subheading">SpO2</span><input type="number" name="oxygenSaturation" value="${escapeHtml(form.oxygenSaturation)}"></label>
                </div>
                <div class="action-row"><button type="submit" class="button primary">Create Encounter</button></div>
              </form>
            </div>
            ${chart.encounters.length
              ? `<div class="timeline-list">${chart.encounters
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
                            <span class="mini-chip">${escapeHtml(encounter.status)}</span>
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
                              : emptyState("No diagnoses linked.")}
                          </div>
                          <div>
                            <p class="subheading">Vitals</p>
                            ${encounter.vitals
                              ? `<p class="muted">BP ${escapeHtml(String(encounter.vitals.systolicBp ?? "-"))}/${escapeHtml(String(encounter.vitals.diastolicBp ?? "-"))} · HR ${escapeHtml(String(encounter.vitals.heartRate ?? "-"))} · Temp ${escapeHtml(String(encounter.vitals.temperatureC ?? "-"))} C · SpO2 ${escapeHtml(String(encounter.vitals.oxygenSaturation ?? "-"))}%</p>`
                              : emptyState("No vitals recorded.")}
                          </div>
                        </div>
                      </article>
                    `
                  )
                  .join("")}</div>`
              : emptyState("No encounters recorded.")}
          </div>
        `
      )}
    </section>
  `;
}

export function renderClinicalPage(state) {
  const chart = state.selectedChart;

  return `
    <div class="page-layout">
      ${pageHeader("Clinical", "Manage chart-level clinical data, including allergies, medications, labs, and encounter documentation.")}
      ${renderPatientHero(chart)}
      <div class="page-grid">
        ${renderAllergyManager(chart, state.forms.allergy)}
        ${renderLabs(chart)}
      </div>
      ${renderMedicationManager(chart, state.forms.medication)}
      ${renderEncounterManager(chart, state.forms.encounter)}
    </div>
  `;
}

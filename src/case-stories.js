export const caseStoriesByMrn = {
  "MRN-000001": {
    title: "Acute Infection Follow-Up",
    summary:
      "Elena Garcia presents with acute pharyngitis, a severe penicillin allergy, antibiotic treatment, and a follow-up visit already on the calendar.",
    whyItMatters:
      "This case demonstrates how allergies, prescriptions, labs, and appointments connect in one short clinical workflow.",
    focusAreas: ["allergy safety", "acute visit documentation", "lab review", "follow-up scheduling"],
  },
  "MRN-000002": {
    title: "Chronic Disease Management",
    summary:
      "Michael Johnson is a chronic care follow-up patient with hypertension, type 2 diabetes, active medications, and a lab result that remains above goal.",
    whyItMatters:
      "This case demonstrates longitudinal care, active medication tracking, and ongoing disease monitoring.",
    focusAreas: ["chronic disease", "active medications", "trend monitoring", "care planning"],
  },
  "MRN-000003": {
    title: "Preventive Wellness Visit",
    summary:
      "Priya Nair represents preventive care with an annual exam, a mild allergy, and a lipid panel that surfaced elevated LDL.",
    whyItMatters:
      "This case adds variety beyond acute illness by showing preventive care and screening-based follow-up.",
    focusAreas: ["preventive care", "screening labs", "wellness documentation"],
  },
};

export function getCaseStory(mrn) {
  return (
    caseStoriesByMrn[mrn] ?? {
      title: "General EMR Case",
      summary: "This patient record is part of the shared EMR demo dataset.",
      whyItMatters: "It helps show how the overall data model fits together.",
      focusAreas: ["patient chart"],
    }
  );
}

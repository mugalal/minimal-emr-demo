export const routes = [
  {
    id: "overview",
    label: "Overview",
    description: "Global metrics, watchlists, and system state.",
  },
  {
    id: "patients",
    label: "Patients",
    description: "Patient administration and demographic management.",
  },
  {
    id: "scheduling",
    label: "Scheduling",
    description: "Appointment scheduling and visit management.",
  },
  {
    id: "clinical",
    label: "Clinical",
    description: "Allergies, medications, labs, and encounter workflows.",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Care team, alerts, and operational coordination.",
  },
];

export function getCurrentRoute() {
  const raw = window.location.hash.replace(/^#/, "") || routes[0].id;
  return routes.some((route) => route.id === raw) ? raw : routes[0].id;
}

export function setRoute(routeId) {
  window.location.hash = routeId;
}

export function getRouteMeta(routeId) {
  return routes.find((route) => route.id === routeId) ?? routes[0];
}

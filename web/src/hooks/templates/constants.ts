export const API_ROUTES = {
  templates: "/templates",
  applyTemplate: (id: string) => `/templates/${id}/use`,
} as const;

export const QUERY_KEYS = {
  all: ["templates"] as const,
  list: () => [...QUERY_KEYS.all, "list"] as const,
};

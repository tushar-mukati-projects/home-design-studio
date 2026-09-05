export const API_ROUTES = {
  templates: "/templates",
} as const;

export const QUERY_KEYS = {
  all: ["templates"] as const,
  list: () => [...QUERY_KEYS.all, "list"] as const,
};

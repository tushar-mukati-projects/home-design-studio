export const API_ROUTES = {
  designs: "/designs",
  design: (id: string) => `/designs/${id}`,
} as const;

export const QUERY_KEYS = {
  all: ["designs"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (filters?: unknown) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

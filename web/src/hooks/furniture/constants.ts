export const API_ROUTES = {
  furniture: "/furniture",
} as const;

export const QUERY_KEYS = {
  all: ["furniture"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (filters?: unknown) => [...QUERY_KEYS.lists(), filters] as const,
};

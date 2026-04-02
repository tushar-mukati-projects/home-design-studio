export const API_ROUTES = {
  furniture: "/furniture",
  furnitureItem: (id: string) => `/furniture/${id}`,
  placements: (designId: string) => `/designs/${designId}/furniture`,
  placement: (designId: string, placementId: string) =>
    `/designs/${designId}/furniture/${placementId}`,
} as const;

export const QUERY_KEYS = {
  all: ["furniture"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (filters?: unknown) => [...QUERY_KEYS.lists(), filters] as const,
  placements: (designId: string) => [...QUERY_KEYS.all, "placements", designId] as const,
};

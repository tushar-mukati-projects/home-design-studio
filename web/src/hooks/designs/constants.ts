export const API_ROUTES = {
  designs: "/designs",
  design: (id: string) => `/designs/${id}`,
  access: (id: string) => `/designs/${id}/access`,
  members: (id: string) => `/designs/${id}/members`,
  member: (id: string, memberId: string) => `/designs/${id}/members/${memberId}`,
  links: (id: string) => `/designs/${id}/links`,
  link: (id: string, linkId: string) => `/designs/${id}/links/${linkId}`,
  versions: (id: string) => `/designs/${id}/versions`,
  version: (id: string, versionId: string) => `/designs/${id}/versions/${versionId}`,
  restoreVersion: (id: string, versionId: string) => `/designs/${id}/versions/${versionId}/restore`,
} as const;

export const QUERY_KEYS = {
  all: ["designs"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (filters?: unknown) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

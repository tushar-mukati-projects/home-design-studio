const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

export const collaborationUrl = (apiUrl: string, wsUrl: string | undefined): string =>
  wsUrl || `${apiUrl.replace(/\/api\/?$/, "").replace(/^http/, "ws")}/collaboration`;

export const API_URL = required("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);
export const WS_URL = collaborationUrl(API_URL, process.env.NEXT_PUBLIC_WS_URL);
export const MOCKS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true";

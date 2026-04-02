const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const mockUrl = (path: string) => `${API_URL}${path}`;

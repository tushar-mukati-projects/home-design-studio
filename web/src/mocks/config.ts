import { API_URL } from "@/lib/env";

export const MOCK_DELAY_MS = 300;

export const mockUrl = (path: string) => `${API_URL}${path}`;

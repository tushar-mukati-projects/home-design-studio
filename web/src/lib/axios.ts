import axios from "axios";
import { auth } from "./firebase";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const getToken = async (): Promise<string | null> => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const user = auth.currentUser;
  if (!user) return null;

  try {
    cachedToken = await user.getIdToken();
    tokenExpiresAt = now + 55 * 60 * 1000;
    return cachedToken;
  } catch {
    cachedToken = null;
    tokenExpiresAt = 0;
    return null;
  }
};

export const clearJwtCache = () => {
  cachedToken = null;
  tokenExpiresAt = 0;
};

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        clearJwtCache();
      }
      const message = error.response?.data?.error || error.message;
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`,
      );
    }
    return Promise.reject(error);
  },
);

export { axiosInstance };

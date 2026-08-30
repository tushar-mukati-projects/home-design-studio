import axios from "axios";
import { auth } from "./firebase";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const getToken = async (forceRefresh = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
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
  async (error) => {
    if (axios.isAxiosError(error)) {
      const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

      if (error.response?.status === 401 && config && !config._retry && auth.currentUser) {
        config._retry = true;
        const fresh = await getToken(true);
        if (fresh) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${fresh}`;
          return axiosInstance(config);
        }
      }

      const message = error.response?.data?.error || error.message;
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`,
      );
    }
    return Promise.reject(error);
  },
);

export { axiosInstance, getToken };

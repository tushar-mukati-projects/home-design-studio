import axios from "axios";
import { API_URL } from "./env";
import { auth } from "./firebase";

const REQUEST_TIMEOUT_MS = 30_000;

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

const getToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
};

const retryWithFreshToken = async (error: unknown) => {
  const user = auth.currentUser;
  if (!axios.isAxiosError(error) || !error.config || !user) throw error;
  if (error.response?.status !== 401) throw error;
  error.config.headers.Authorization = `Bearer ${await user.getIdToken(true)}`;
  return axios.request(error.config);
};

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(undefined, retryWithFreshToken);

export { axiosInstance, getToken };

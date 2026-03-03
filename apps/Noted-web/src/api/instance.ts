import axios from "axios";
import { useAuthStore } from "../stores/auth.store";
import router from "../router"; 

const $api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

$api.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

$api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const authStore = useAuthStore();

      try {
        await authStore.refresh();

        const newToken = localStorage.getItem("access_token");
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return $api(originalRequest);
      } catch (refreshError) {
        authStore.logout();
        router.push("/login"); 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default $api;
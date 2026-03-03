import { defineStore } from "pinia";
import { ref, computed } from "vue";
import $api from "../api/instance";
import { AccountResponse, LoginRequest, RegisterRequest, TokenResponse } from "@noted/types/auth.types";
import axios from "axios";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string | null>(localStorage.getItem("access_token"));
    const user = ref<AccountResponse | null>(null);

    const isLogged = computed(() => !!token.value);

    async function login(credentials: LoginRequest) {
      const { data } = await $api.post<TokenResponse>("/api/auth/login", credentials);

      token.value = data.accessToken;
      localStorage.setItem("access_token", data.accessToken);

      await getMe();
      return true;
    }

    async function refresh() {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, {
          withCredentials: true 
        });
        token.value = response.data.accessToken;
        localStorage.setItem("access_token", response.data.accessToken);
      } catch (err) {
        logout();
        throw err;
      }
    }

    async function register(credentials: RegisterRequest) {
      const { data } = await $api.post<TokenResponse>("/api/auth/register", credentials);

      token.value = data.accessToken;
      localStorage.setItem("access_token", data.accessToken);

      await getMe();
      return true;
    }

    async function getMe() {
      try {
        const { data } = await $api.get<AccountResponse>("/api/auth/me");
        user.value = data;
      } catch (err) {
        logout();
      }
    }

    async function logout() {
      token.value = null;
      user.value = null;
      await $api.post("api/auth/logout")
      localStorage.removeItem("access_token");
    }

    return { token, user, isLogged, login, logout, getMe, register, refresh };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["user"],
    },
  },
);

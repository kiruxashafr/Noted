import { defineStore } from "pinia";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { useAuthStore } from "./auth.store";
import $api from "../api/instance";
import { UpdateUserRequest } from "@noted/types";
import { ref } from "vue";
import { useSocketStore } from "./socket.store";

export const useAccountStore = defineStore(
    "account",
    () => {
        const toast = useToast();
        const router = useRouter();
        const authStore = useAuthStore();
        const socketStore = useSocketStore();
        const isPending = ref(false);
        const error = ref<string | null>(null);

        async function deleteAccount() {
            try {
                await $api.delete("/api/users/me/delete");
                authStore.logout();
                toast.add({
                    severity: "success",
                    summary: "Успешно",
                    detail: "Ваш аккаунт удален",
                    life: 3000,
                });
                await router.push({ name: "login" });
            } catch (error) {
                toast.add({
                    severity: "error",
                    summary: "Ошибка",
                    detail: "Не удалось удалить аккаунт",
                    life: 3000,
                });
                throw error;
            }
        }

        async function updateAccount(body: UpdateUserRequest) {
            try {
                await $api.patch("/api/users/me", body);

                toast.add({
                    severity: "success",
                    summary: "Успешно",
                    detail: "Ваш аккаунт успешно обновлен",
                    life: 3000,
                });
                return;
            } catch (error) {
                toast.add({
                    severity: "error",
                    summary: "Ошибка",
                    detail: "Не удалось обновить аккаунт",
                    life: 3000,
                });
            }
        }

        async function upladAvatar(file: File) {
    if (!socketStore.socketId) {
      error.value = "Socket connection not established yet";
      return;
    }

    isPending.value = true;
    error.value = null;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("socketId", socketStore.socketId);

    try {
      const { data } = await $api.post("/api/users/me/avatar", formData);
      return data;
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message;
      throw e;
    } finally {
      isPending.value = false;
    }
        }

        return {
            isPending,
            error,
            updateAccount,
            deleteAccount,
            upladAvatar
        }
    }

)
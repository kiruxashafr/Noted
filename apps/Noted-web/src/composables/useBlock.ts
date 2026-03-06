import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import $api from "../api/instance";

export const useBlock = () => {
    const toast = useToast();
    const router = useRouter();
    const authStore = useAuthStore();

    const getPageTitle = async () => {
        try {
            const containers = await $api.get("/api/blocks/page/title")
            return containers
        } catch (error) {
        toast.add({
            severity: "error",
            summary: "Ошибка",
            detail: "Не удалось получить страницы",
         life: 3000,
        });
        }
    }
    return {
    getPageTitle
    };
}
import { useToast } from "primevue/usetoast"
import $api from "../api/instance"
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth.store"

export const useAccount = () => {
    const toast = useToast()
    const router = useRouter()
    const authStore = useAuthStore()

    const deleteAccount = async () => {
        try {
            await $api.delete('/api/users/me/delete')
            authStore.logout()
            toast.add({
                severity: 'success',
                summary: 'Успешно',
                detail: 'Ваш аккаунт удален',
                life: 3000
            })
            await router.push({name:"login"})
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: 'Не удалось удалить аккаунт',
                life: 3000
            })
            throw error
        }
    }

    return {
        deleteAccount
    }
}
 
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi'
import { LoginRequest, RegisterRequest, UserResponse } from '@noted/types/auth.types'

interface AuthResponse {
  accessToken: string
  user: UserResponse
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<UserResponse | null>(null)

  const isLogged = computed(() => !!accessToken.value && !!user.value)

  const setSession = (data: AuthResponse) => {
    accessToken.value = data.accessToken
    user.value = data.user
  }

  async function login(payload: LoginRequest) {
    try {
      const data = await useApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: payload
      })
      setSession(data)
      return true
    } catch (err) {
      logout()
      throw err
    }
  }

  async function register(payload: RegisterRequest) {
    const data = await useApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload
    })
    setSession(data)
    return true
  }

  async function fetchProfile() {
    if (!accessToken.value) return

    try {
      const data = await useApi<UserResponse>('/auth/me')
      user.value = data
    } catch (err) {
      logout()
    }
  }

  function logout() {
    accessToken.value = null
    user.value = null
  }

  return { 
    accessToken, 
    user, 
    isLogged, 
    login, 
    register,
    logout, 
    fetchProfile 
  }
}, {
  // Включаем сохранение состояния
  persist: true 
})
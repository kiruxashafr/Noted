import { ref } from 'vue'
import { useSocketStore } from '../stores/socket.store'
import $api from '../api/instance'

export function useAvatarUpload() {
  const socketStore = useSocketStore()
  const isPending = ref(false)
  const error = ref<string | null>(null)

  const uploadAvatar = async (file: File) => {
    if (!socketStore.socketId) {
      error.value = 'Socket connection not established yet'
      return
    }

    isPending.value = true
    error.value = null

    const formData = new FormData()
    formData.append('avatar', file) 
    formData.append('socketId', socketStore.socketId)

    try {
      const { data } = await $api.post('/api/users/me/avatar', formData)      
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      isPending.value = false
    }
  }

  return { uploadAvatar, isPending, error }
}
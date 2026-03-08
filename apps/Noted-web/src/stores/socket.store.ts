import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { NotificationEvent } from "@noted/types"

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const socketId = ref<string | null>(null)

  const SOCKET_URL = import.meta.env.VITE_API_URL
  function connect() {
    if (socket.value?.connected) return

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    socketInstance.on('connect', () => {
      isConnected.value = true
      socketId.value = socketInstance.id || null
      console.log('[Socket] Connected:', socketInstance.id)
    })

    socketInstance.on('disconnect', (reason) => {
      isConnected.value = false
      socketId.value = null
      console.log('[Socket] Disconnected:', reason)
    })

    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message)
    })

    socket.value = markRaw(socketInstance)
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      socketId.value = null
    }
  }

  function emit(event: string | NotificationEvent, ...args: any[]) {
    if (!socket.value) return
    socket.value.emit(event as string, ...args)
  }

  function on(event: string | NotificationEvent, callback: (...args: any[]) => void) {
    if (!socket.value) return
    socket.value.on(event as string, callback)
  }

  function off(event: string | NotificationEvent, callback: (...args: any[]) => void) {
    if (!socket.value) return
    socket.value.off(event as string, callback)
  }
  return {
    socket,
    isConnected,
    socketId,
    connect,
    disconnect,
    on,
    off,
    emit
  }
})
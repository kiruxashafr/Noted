import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

export function setupGuards(router: ReturnType<typeof useRouter>) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    const guestPrefixes = ['/auth']
    const protectedPrefixes = ['/admin', '/learn', '/studio', '/dashboard']

    const isGuestRoute = guestPrefixes.some(prefix => to.path.startsWith(prefix))
    const isProtectedRoute = protectedPrefixes.some(prefix => to.path.startsWith(prefix))

    if (authStore.isLogged && isGuestRoute) {
      return next('/dashboard')
    }

    if (!authStore.isLogged && isProtectedRoute) {
      authStore.logout() 
      return next('/auth/login') 
    }


    next()
  })
}
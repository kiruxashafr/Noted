import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";

export async function authMiddleware(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();

  if (authStore.token && !authStore.user) {
    try {
      await authStore.getMe();
    } catch (error) {
      authStore.logout();
      return next({ name: "login" });
    }
  }

  const isLogged = authStore.isLogged;
  const isGuestRoute = to.meta.isGuest;
  const isProtectedRoute = to.meta.requiresAuth;

  if (isLogged && isGuestRoute) {
    return next({ name: "dashboard" });
  }

  if (!isLogged && isProtectedRoute) {
    return next({ name: "login" });
  }

  next();
}

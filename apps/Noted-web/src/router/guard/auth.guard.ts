// auth.guard.ts
import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";

export async function authMiddleware(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore();
  const token = localStorage.getItem("access_token");

  const publicPages = ['/login', '/register'];
  const isPublic = publicPages.includes(to.path);

  if (token && !authStore.user) {
    try {
      await authStore.getMe();
    } catch (error) {
      authStore.logout(); 
      return next("/login");
    }
  }

  const isLogged = !!authStore.user; 

  if (!isLogged && !isPublic) {
    return next("/login");
  }

  if (isLogged && isPublic) {
    return next("/");
  }

  next();
}
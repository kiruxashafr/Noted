// auth.guard.ts
import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";
import { computed } from "vue";
import { useBlockStore } from "../../stores/block.store";
import { useSocketStore } from "../../stores/socket.store";

export async function authMiddleware(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
const authStore = useAuthStore();
  const socketStore = useSocketStore();
  const blockStore = useBlockStore(); 
  const token = authStore.token

  const publicPages = ["/login", "/register"];
  const isPublic = publicPages.includes(to.path);

  if (authStore.token && !authStore.user) {
    try {
      await authStore.getMe();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error("Session restoration failed");
    }
  }

  const isLogged = !!authStore.user;

  if (isLogged) {
    blockStore.getContainerTitle();
    socketStore.connect();
  }

  if (!isLogged && !isPublic) {
    return next("/login");
  }

  if (isLogged && isPublic) {
    return next("/");
  }

  next();
}

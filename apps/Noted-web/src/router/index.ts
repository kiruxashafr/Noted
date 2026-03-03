import { createRouter, createWebHistory } from "vue-router";
import { authMiddleware } from "./guard/auth.guard";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../pages/main/MainLayout.vue'),
     children: [
       {
          path: '',
          component: () => import('../pages/dashboard/Dashboard.vue')
       },
       {
          path: 'account',
          component: () => import('../pages/main/AccountSettings.vue')
       },
      ]
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../pages/auth/Register.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../pages/auth/Login.vue"),
      meta: { isGuest: true },
    }
  ],
});

router.beforeEach(authMiddleware);

export default router;

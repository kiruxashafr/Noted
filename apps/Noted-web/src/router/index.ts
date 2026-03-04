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
         name: 'home',
          component: () => import('../pages/dashboard/Dashboard.vue')
       },
       {
         path: 'account',
         name: 'account',
          component: () => import('../pages/main/content/AccountSettings.vue')
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

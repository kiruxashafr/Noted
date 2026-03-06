import { createRouter, createWebHistory } from "vue-router";
import { authMiddleware } from "./guard/auth.guard";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../layouts/MainLayout.vue"),
      children: [
        {
          path: "",
          name: "home-dashboard",
          component: () => import("../pages/block/MainPage.vue"),
        },
      ],
    },
    {
      path: "/setting",
      name: "account",
      component: () => import("../layouts/SettingsLayout.vue"),
      children: [
        {
          path: "account",
          name: "setting-account",
          component: () => import("../pages/setting/AccountSettings.vue"),
        },
      ],
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
    },
    {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/not-found/NotFound.vue')
    }
  ],
});

router.beforeEach(authMiddleware);

export default router;

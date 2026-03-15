import { createRouter, createWebHistory } from "vue-router";
import { authMiddleware } from "./guard/auth.guard";
import MainLayout from "../layouts/MainLayout.vue";
import Login from "../pages/auth/Login.vue";
import Register from "../pages/auth/Register.vue";
import AccountSettings from "../pages/setting/AccountSettings.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "home-dashboard",
          component: () => import("../pages/blocks/ListContainer.vue"),
        },
        {
          path: "note/:id",
          name: "note",
          component: () => import("../pages/blocks/ContainerPage.vue"),
          props: true,
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
          component: AccountSettings,
        },
      ],
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { isGuest: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../pages/not-found/NotFound.vue"),
    },
  ],
});

router.beforeEach(authMiddleware);

export default router;

import { createRouter, createWebHistory } from 'vue-router'
import { authMiddleware } from './guard/auth.guard'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard' 
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/auth/Register.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/auth/Login.vue'),
      meta: { isGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(authMiddleware)

export default router
<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();

const onLogout = () => {
  authStore.logout(); 
  router.push('/auth/login'); 
};
</script>

<template>
  <div class="flex justify-content-center align-items-center min-h-screen">
    <Card style="width: 25rem">
      <template #title>
        Привет, {{ authStore.user?.name || 'Пользователь' }}!
      </template>
      <template #content>
        <p class="mb-4">Вы успешно авторизованы по Access Token.</p>
        
        <div class="flex flex-column gap-2">
          <p><strong>Ваш Email:</strong> {{ authStore.user?.email }}</p>
          <p><strong>ID:</strong> {{ authStore.user?.id }}</p>
        </div>
      </template>
      <template #footer>
        <Button 
          label="Выйти" 
          icon="pi pi-sign-out" 
          severity="danger" 
          class="w-full" 
          @click="onLogout" 
        />
      </template>
    </Card>
  </div>
</template>
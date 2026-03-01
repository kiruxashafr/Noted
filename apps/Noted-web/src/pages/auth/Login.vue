<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import Message from 'primevue/message'
import { useAuthStore } from '../../stores/auth.store'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function onSubmit() {
  if (!email.value || !password.value) return

  isLoading.value = true
  errorMessage.value = ''
  
  try {
    await authStore.login({ 
      email: email.value, 
      password: password.value 
    })
    
    // Если логин успешен, редиректим на дашборд
    // Наш Guard в router/index.ts подхватит это
    router.push('/dashboard')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Ошибка входа'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex justify-content-center align-items-center min-h-screen">
    <Card style="width: 25rem">
      <template #title> Авторизация </template>
      <template #content>
        <form @submit.prevent="onSubmit" class="flex flex-column gap-3">
          
          <div class="flex flex-column gap-2">
            <label for="email">Email</label>
            <InputText id="email" v-model="email" type="email" required />
          </div>

          <div class="flex flex-column gap-2">
            <label for="password">Пароль</label>
            <InputText id="password" v-model="password" type="password" required />
          </div>

          <Message v-if="errorMessage" severity="error" variant="simple">
            {{ errorMessage }}
          </Message>

          <Button 
            type="submit" 
            label="Войти" 
            :loading="isLoading" 
            class="mt-2" 
          />
        </form>
      </template>
    </Card>
  </div>
</template>
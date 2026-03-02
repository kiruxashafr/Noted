<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../../stores/auth.store'
import Password from 'primevue/password'
import Divider from 'primevue/divider'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function onSubmit() {
  if (!email.value || !password.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Внимание', 
      detail: 'Заполните все поля', 
      life: 3000 
    })
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  
  try {
    await authStore.login({ 
      email: email.value, 
      password: password.value 
    })

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Вы вошли в систему',
      life: 3000
    })
    
    router.push('/dashboard')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Ошибка входа'
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: `${errorMessage.value}`,
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <Card style="width: 35rem">
      <template #title>
        <div class="title">
          Авторизация
        </div> 
      </template>
      
      <template #content>
        <div class="auth-wrapper">
          <div class="auth-left">
            <form 
              class="auth-form" 
              @submit.prevent="onSubmit"
            >
              <div class="auth-comp">
                <InputText 
                  v-model="email" 
                  type="email" 
                  placeholder="Email" 
                />
              </div>

              <div class="auth-comp">
                <Password 
                  v-model="password" 
                  :feedback="false" 
                  placeholder="Password" 
                  toggle-mask 
                />
              </div>

              <Button 
                type="submit" 
                label="Войти" 
                :loading="isLoading" 
                class="w-full" 
              />
            </form>
          </div>

          <Divider layout="vertical">
            <b>ИЛИ</b>
          </Divider>

          <div class="auth-right">
            <p>Нет аккаунта?</p>
            <Button 
              label="Зарегистрироваться" 
              icon="pi pi-user-plus" 
              severity="secondary" 
              @click="router.push('/register')" 
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
  .auth-container {
    display: flex;
    width: 100%;
    height: 100vh;
    justify-content: center;
    align-items: center;
  }

  .auth-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-left, .auth-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
  }

  .auth-comp {
    width: 100%;
  }

  :deep(.p-inputtext), :deep(.p-password), :deep(.p-password-input) {
    width: 100%;
  }

  .title {
    text-align: center;
    margin-bottom: 1rem;
  }
</style>
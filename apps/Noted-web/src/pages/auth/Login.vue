<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "../../stores/auth.store";

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

async function onSubmit() {
  if (!email.value || !password.value) {
    toast.add({
      severity: "warn",
      summary: "Внимание",
      detail: "Заполните все поля",
      life: 3000,
    });
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });

    toast.add({
      severity: "success",
      summary: "Успешно",
      detail: "Вы вошли в систему",
      life: 3000,
    });

    router.push("/");
  } catch (error: any) {
    if (error.response.status == 401 || error.response.status == 400) {
      toast.add({
        severity: "error",
        summary: "Incorrect login or password",
        detail: `${errorMessage.value}`,
        life: 3000,
      });
    } else {
      toast.add({
        severity: "error",
        summary: "Sign up error",
        detail: `${errorMessage.value}`,
        life: 3000,
      });
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section class="auth-container">
    <Card style="width: 50%">
      <template #title>
        <div class="title-container">
          <img src="../../public//images/logo/noted-min-light.png" alt="Logo" class="auth-logo" />
          <span class="title-text">Sign in to your account</span>
        </div>
      </template>

      <template #content>
        <div class="auth-wrapper">
          <div class="auth-left">
            <form class="auth-form" @submit.prevent="onSubmit">
              <div class="auth-comp">
                <InputText v-model="email" type="email" placeholder="Email" />
              </div>

              <div class="auth-comp">
                <Password v-model="password" :feedback="false" placeholder="Password" toggle-mask />
              </div>

              <Button type="submit" label="Sign in" :loading="isLoading" class="w-full" icon="pi pi-user" />
            </form>
          </div>

          <Divider layout="vertical">
            <b>OR</b>
          </Divider>

          <div class="auth-right">
            <p>New user?</p>
            <Button label="Sign up" icon="pi pi-user" severity="secondary" @click="router.push('/register')" />
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<style scoped>
.auth-container {
  display: flex;
  width: 100%;
  height: 100vh;
  justify-content: center;
  align-items: center;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.auth-logo {
  width: 100px;
  object-fit: contain;
}

.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
}

.auth-left,
.auth-right {
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

:deep(.p-inputtext),
:deep(.p-password),
:deep(.p-password-input) {
  width: 100%;
}

:deep(.p-card-body) {
  gap: 24px;
  padding-bottom: 27px;
}

.title {
  text-align: center;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .auth-wrapper {
    flex-direction: column;
  }

  .p-divider-vertical {
    display: none;
  }

  :deep(.p-card) {
    width: 90vw !important;
  }

  .auth-right {
    border-top: 1px solid var(--surface-border);
    padding-top: 1.5rem;
    width: 100%;
    display: flex;
    flex-direction: row;
  }
}
</style>

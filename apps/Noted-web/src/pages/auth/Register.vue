<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import PasswordForm from "../../components/auth/PasswordForm.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const name = ref("");
const password = ref("");
const email = ref("");
const isLoading = ref(false);

async function onSubmit() {
  if (!email.value || !name.value || !password.value) {
    toast.add({
      severity: "warn",
      summary: t("notification.warning"),
      detail: t("auth.register.fill-all-fields"),
      life: 3000,
    });
    return;
  }

  isLoading.value = true;

  try {
    await authStore.register({
      email: email.value,
      name: name.value,
      password: password.value,
    });

    toast.add({
      severity: "success",
      summary: t("notification.success"),
      detail: t("auth.register.success"),
      life: 3000,
    });
    router.push({ name: "home-dashboard" });
  } catch (error: any) {
    let msg = t("auth.register.error-title");
    if (error?.response?.status === 409) {
      msg = t("auth.register.email-exists");
    }
    toast.add({
      severity: "error",
      summary: t("notification.error"),
      detail: msg,
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <section class="register-container">
    <Card style="width: 50%">
      <template #title>
        <div class="title-container">
          <img src="../../public/images/logo/noted-min-light.png" alt="Logo" class="reg-logo" />
          <span class="title-text">{{ t("auth.register.title") }}</span>
        </div>
      </template>
      <template #content>
        <form class="reg-form" @submit.prevent="onSubmit">
          <div class="auth-comp">
            <InputText v-model="name" :placeholder="t('auth.register.name-placeholder')" />
          </div>
          <div class="auth-comp">
            <InputText v-model="email" type="email" :placeholder="t('auth.register.email-placeholder')" />
          </div>
          <div class="auth-comp">
            <PasswordForm v-model:password="password" />
          </div>
          <Button
            type="submit"
            :label="t('auth.sign-up')"
            :loading="isLoading"
            class="w-full"
            icon="pi pi-user"
          />
          <Button
            type="button"
            :label="t('auth.already-have-account')"
            icon="pi pi-angle-left"
            severity="secondary"
            @click="router.push({ name: 'login' })"
          />
        </form>
      </template>
    </Card>
  </section>
</template>

<style scoped>
.register-container {
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

.reg-logo {
  width: 100px;
  object-fit: contain;
}

.reg-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}
.reg-comp {
  width: 100%;
}

:deep(.p-component) {
  width: 100%;
}

:deep(.p-card-body) {
  gap: 24px;
  padding-bottom: 24px;
}

:deep(.p-button) {
  background-color: #455dd3;
  border: 1px solid #fff0;
  color: white;
}

:deep(.p-button:hover) {
  background-color: #3752dd;
  border: 1px solid #fff0;
  color: white;
}
</style>

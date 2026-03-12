<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import Dialog from "primevue/dialog";
import PasswordForm from "../../components/auth/PasswordForm.vue";
import AvatarUploader from "../../components/user/AvatarUploader.vue";
import { useAccountStore } from "../../stores/account.store";

const accountStore = useAccountStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const editPasswordVisible = ref(false);
const isPasswordValid = ref(false);

const name = ref(authStore.user?.name || "");
const email = ref(authStore.user?.email || "");
const password = ref("");

const handleUpdatePassword = async () => {
  await accountStore.updateAccount({password: password.value})
};
const handleUpdateName = async () => {
  if (name.value === authStore.user?.name) return;
  await accountStore.updateAccount({name: name.value})
};

const handleUpdateEmail = async () => {
  if (email.value === authStore.user?.email) return;
  await accountStore.updateAccount({email: email.value})
};

const showTemplate = () => {
  confirm.require({
    group: "templating",
    header: "Внимание!",
    message: "Пожалуйста подтвердите что хотите удалить свой аккаунт",
    rejectProps: {
      label: "Отмена",
      icon: "pi pi-times",
      outlined: true,
      size: "small",
    },
    acceptProps: {
      label: "Удалить",
      icon: "pi pi-check",
      size: "small",
    },
    accept: () => {
      accountStore.deleteAccount();
    },
    reject: () => {},
  });
};
</script>
<template>
  <section class="settings-section">
    <div class="photo-row row">
      <div class="label-wrapper">
        <label>Фото профиля</label>
        <span class="label-hint">
          Ваше изображение будет отображаться в комментариях и заметках. Наведите на фото, чтобы изменить его.
        </span>
      </div>
      <div class="input-wrapper avatar-input-container">
        <AvatarUploader />
      </div>
    </div>
    <form
      style="width: 100%"
      @submit.prevent="handleUpdateName"
    >
      <div class="form-row row">
        <div class="label-wrapper">
          <label for="username">Имя пользователя</label>
          <span class="label-hint">
            Это может быть ваше настоящее имя или псевдоним - как бы вы хотели, чтобы люди обращались к вам
          </span>
        </div>
        <div class="input-wrapper">
          <InputText
            id="username"
            v-model="name"
            :default-value="name"
            class="username-input"
          />
          <Button
            v-if="name !== authStore.user?.name"
            type="submit"
            label="Изменить имя"
            class="submit-button"
          />
        </div>
      </div>
    </form>
    <form
      style="width: 100%"
      @submit.prevent="handleUpdateEmail"
    >
      <div class="form-row">
        <div class="label-wrapper">
          <label for="username">Email пользователя</label>
          <span class="label-hint"> Почта по которой осуществляется вход в аккаунт </span>
        </div>
        <div class="input-wrapper">
          <InputText
            id="username"
            v-model="email"
            :default-value="email"
            class="username-input"
          />
          <Button
            v-if="email !== authStore.user?.email"
            type="submit"
            label="Изменить Email"
            class="submit-button"
          />
        </div>
      </div>
    </form>
    <div style="display: flex; gap: 15px; width: 100%; justify-content: flex-start">
      <Button
        label="Сменить пароль"
        class="delete-button"
        @click="editPasswordVisible = !editPasswordVisible"
      />
      <Button
        label="Удалить мой аккаунт"
        class="delete-button"
        @click="showTemplate()"
      />
      <ConfirmDialog group="templating">
        <template #message="slotProps">
          <div class="flex flex-col items-center w-full gap-4 border-b border-surface-200 dark:border-surface-700">
            <p>{{ slotProps.message.message }}</p>
          </div>
        </template>
      </ConfirmDialog>
      <Dialog
        v-model:visible="editPasswordVisible"
        modal
        header="Изменить пароль"
      >
        <PasswordForm v-model:password="password" v-model:is-valid="isPasswordValid" />
        <Button
          label="Изменить пароль"
          style="margin-top: 15px"
          @click="handleUpdatePassword()"
          :disabled="!isPasswordValid"
        />
      </Dialog>
    </div>
  </section>
</template>

<style scoped>
.settings-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  gap: 40px !important;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.photo-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
}

.label-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label-wrapper label {
  font-weight: 600;
  color: #ffffff;
}
.row {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #3f3f46;
}

.avatar-input-container {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.settings-section {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.label-hint {
  font-size: 0.875rem;
  color: #acacac;
  line-height: 1.4;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.username-input {
  width: 100%;
}

.submit-button {
  align-self: flex-start;
}

.delete-button {
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .input-wrapper {
    align-items: center;
  }

  .photo-row {
    grid-template-columns: 1fr;
  }

  .submit-button {
    align-self: stretch;
  }

  .username-input {
    width: 100%;
  }

  .avatar-input-container {
    justify-content: center;
  }
}
</style>

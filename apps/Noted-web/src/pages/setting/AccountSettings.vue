<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "../../stores/auth.store";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import Dialog from "primevue/dialog";
import PasswordForm from "../../components/auth/PasswordForm.vue";
import AvatarUploader from "../../components/user/AvatarUploader.vue";
import { useAccountStore } from "../../stores/account.store";

const accountStore = useAccountStore()
const authStore = useAuthStore();
const confirm = useConfirm();
const oldEmail = ref(authStore.user?.email);
const newEmail = ref("");
const oldName = ref(authStore.user?.name);
const newName = ref("");
const editPasswordVisible = ref(false);
const newPassword = ref("");
const updatePassword = computed(() => ({ password: newPassword.value }));
const handleUpdatePassword = async () => {
  await accountStore.updateAccount(updatePassword.value);
};
const updateName = computed(() => ({ name: newName.value }));
const handleUpdateName = async () => {
  await accountStore.updateAccount(updateName.value);
  if (authStore.user) {
    authStore.user.name = newName.value;
    oldName.value = newName.value;
    newName.value = "";
  }
};
const updateEmail = computed(() => ({ email: newEmail.value }));
const handleUpdateEmail = async () => {
  await accountStore.updateAccount(updateEmail.value);
  if (authStore.user) {
    authStore.user.email = newEmail.value;
    oldEmail.value = newEmail.value;
    newEmail.value = "";
  }
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
            v-model="newName"
            :default-value="oldName"
            class="username-input"
          />
          <Button
            v-if="newName !== ''"
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
            v-model="newEmail"
            :default-value="oldEmail"
            class="username-input"
          />
          <Button
            v-if="newEmail !== ''"
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
        <PasswordForm v-model:password="newPassword" />
        <Button
          label="Изменить пароль"
          style="margin-top: 15px"
          @click="handleUpdatePassword()"
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

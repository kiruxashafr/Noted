<script setup lang="ts">
import FileUpload, { type FileUploadUploaderEvent } from "primevue/fileupload";
import { useToast } from "primevue/usetoast";
import { useSocketStore } from "../../stores/socket.store";
import { useAuthStore } from "../../stores/auth.store";
import { NotificationEvent } from "@noted/types";
import { computed, ref } from "vue";
import { useAccountStore } from "../../stores/account.store";

const toast = useToast();
const socketStore = useSocketStore();
const authStore = useAuthStore();
const accountStore = useAccountStore();

const imageError = ref(false);

const hasAvatar = computed(() => {
  return !!authStore.user?.avatars && !imageError.value;
});

const handleUpload = async (event: FileUploadUploaderEvent) => {
  const files = event.files;
  const file = Array.isArray(files) ? files[0] : files;

  imageError.value = false;

  if (!socketStore.isConnected) {
    toast.add({
      severity: "warn",
      summary: "Связь",
      detail: "Ожидайте подключения к серверу...",
      life: 3000,
    });
    return;
  }

  try {
    await accountStore.upladAvatar(file);
  } catch (e: any) {
    const msg = e.response?.data?.message || "Ошибка загрузки";
    toast.add({ severity: "error", summary: "Ошибка", detail: msg, life: 5000 });
  }
};

const handleImageError = () => {
  imageError.value = true;
  toast.add({
    severity: "warn",
    summary: "Внимание",
    detail: "Не удалось загрузить изображение",
    life: 3000,
  });
};

async function uploadDone(data: { id: string; url: string }) {
  if (authStore.user && data.url) {
    authStore.user.avatars = data.url;
    imageError.value = false;

    toast.add({
      severity: "success",
      summary: "Успех",
      detail: "Аватар обновлен",
      life: 3000,
    });
  }
}

socketStore.on(NotificationEvent.PHOTO_EDIT, uploadDone);
</script>

<template>
  <div class="flex flex-column align-items-center gap-3">
    <div v-if="hasAvatar" class="avatar-wrapper">
      <img
        :src="authStore.user?.avatars"
        class="avatar-photo"
        :class="{ 'photo-blur': accountStore.isPending }"
        alt="Avatar"
        @error="handleImageError" />

      <div class="avatar-overlay">
        <FileUpload
          mode="basic"
          name="avatar"
          accept="image/*"
          :choose-icon="accountStore.isPending ? 'pi pi-spin pi-spinner' : 'pi pi-pencil'"
          :choose-label="accountStore.isPending ? 'Загрузка...' : 'Изменить'"
          custom-upload
          auto
          :disabled="accountStore.isPending"
          class="p-button-sm p-button-rounded shadow-2"
          @uploader="handleUpload" />
      </div>

      <div v-if="accountStore.isPending" class="loading-overlay">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
      </div>
    </div>

    <div v-else class="avatar-placeholder" :class="{ 'loading-state': accountStore.isPending }">
      <div class="placeholder-content">
        <div v-if="accountStore.isPending" class="spinner-container">
          <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: var(--primary-color)" />
          <p class="text-secondary">Загрузка...</p>
        </div>

        <template v-else>
          <i class="pi pi-user" style="font-size: 4rem; color: var(--surface-400)" />

          <p class="text-secondary">
            {{ imageError ? "Не удалось загрузить фото" : "Фото профиля отсутствует" }}
          </p>
        </template>

        <FileUpload
          v-if="!accountStore.isPending"
          mode="basic"
          name="avatar"
          accept="image/*"
          choose-icon="pi pi-plus"
          choose-label="Добавить фото"
          custom-upload
          auto
          class="p-button-sm p-button-rounded"
          :class="{ 'p-button-warning': imageError }"
          @uploader="handleUpload" />
      </div>
    </div>

    <small v-if="accountStore.error && !imageError" class="p-error">{{ accountStore.error }}</small>
  </div>
</template>

<style scoped>
.avatar-wrapper {
  position: relative;
  display: inline-flex;
  line-height: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.avatar-photo {
  max-width: 300px;
  height: auto;
  display: block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
}

.photo-blur {
  filter: blur(3px);
}

.avatar-placeholder {
  width: 300px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder.loading-state {
  border-color: var(--primary-color);
  background-color: var(--primary-50);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
</style>

<script setup lang="ts">
import FileUpload, { type FileUploadUploaderEvent } from 'primevue/fileupload';
import { useToast } from 'primevue/usetoast';
import { useSocketStore } from '../../stores/socket.store';
import { useAvatarUpload } from '../../composables/useAvatarUpload';
import { useAuthStore } from '../../stores/auth.store';
import { NotificationEvent } from '@noted/types';

const toast = useToast();
const socketStore = useSocketStore();
const authStore = useAuthStore()
const { uploadAvatar, isPending, error } = useAvatarUpload();

const handleUpload = async (event: FileUploadUploaderEvent) => {

  const files = event.files;
  const file = Array.isArray(files) ? files[0] : files;

  if (!socketStore.isConnected) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Связь', 
      detail: 'Ожидайте подключения к серверу...', 
      life: 3000 
    });
    return;
  }

  try {
    await uploadAvatar(file);
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Ошибка загрузки';
    toast.add({ severity: 'error', summary: 'Ошибка', detail: msg, life: 5000 });
  }
};
async function uploadDone(data: { id: string, url: string }) {
 
  if (authStore.user && data.url) {
 
    authStore.user.avatars = data.url;
    
    toast.add({ 
      severity: 'success', 
      summary: 'Успех', 
      detail: 'Аватар обновлен', 
      life: 3000 
    });
  }
}

socketStore.on(NotificationEvent.PHOTO_EDIT, uploadDone);
</script>

<template>
  <div class="flex flex-column align-items-center gap-3">
    <div class="avatar-wrapper">
      <img
        :src="authStore.user?.avatars"
        class="avatar-photo"
        :class="{ 'photo-blur': isPending }"
      >
  
      <div class="avatar-overlay">
        <FileUpload
          mode="basic"
          name="avatar"
          accept="image/*"
          choose-icon="pi pi-pencil"
          choose-label="Изменить"
          custom-upload
          auto
          :disabled="isPending" 
          class="p-button-sm p-button-rounded shadow-2"
          @uploader="handleUpload"
        />
      </div>

      <div
        v-if="isPending"
        class="loading-overlay"
      >
        <i
          class="pi pi-spin pi-spinner"
          style="font-size: 2rem"
        />
      </div>
    </div>

    <small
      v-if="error"
      class="p-error"
    >{{ error }}</small>
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
}

.photo-blur {
  filter: blur(3px);
}
</style>
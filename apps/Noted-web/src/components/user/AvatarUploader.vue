<template>
  <div class="flex flex-column align-items-center gap-3">
    <FileUpload
      mode="basic"
      name="avatar"
      accept="image/*"
      :max-file-size="10000000"
      custom-upload
      auto
      :disabled="isPending" 
      choose-label="Выбрать фото"
      class="p-button-rounded"
      @uploader="handleUpload"
    />

    <div
      v-if="!socketStore.isConnected"
      class="text-orange-500 text-xs"
    >
      Подключение к серверу уведомлений...
    </div>

    <small
      v-if="isPending"
      class="text-primary"
    >Загрузка и обработка...</small>
    <small
      v-if="error"
      class="p-error"
    >{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import FileUpload, { type FileUploadUploaderEvent } from 'primevue/fileupload';
import { useToast } from 'primevue/usetoast';
import { useSocketStore } from '../../stores/socket.store';
import { useAvatarUpload } from '../../composables/useAvatarUpload';

const toast = useToast();
const socketStore = useSocketStore();
const { uploadAvatar, isPending, error } = useAvatarUpload();

const handleUpload = async (event: FileUploadUploaderEvent) => {
  // PrimeVue передает файлы по-разному в зависимости от версии. 
  // В mode="basic" это обычно массив.
  const files = event.files;
  const file = Array.isArray(files) ? files[0] : files;
  
  if (!file) {
    console.error("Файл не найден в событии", event);
    return;
  }

  // Проверка сокета прямо перед отправкой
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
    toast.add({ 
      severity: 'success', 
      summary: 'Успех', 
      detail: 'Файл отправлен, ожидайте обновления', 
      life: 3000 
    });
  } catch (e: any) {
    // Выводим детальную ошибку из бэкенда если она есть
    const msg = e.response?.data?.message || 'Ошибка загрузки';
    toast.add({ severity: 'error', summary: 'Ошибка', detail: msg, life: 5000 });
  }
};
</script>
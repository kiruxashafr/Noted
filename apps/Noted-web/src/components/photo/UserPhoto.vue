<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();
const imageError = ref(false);
const imageLoading = ref(true); 



const handleImageLoad = () => {
  imageLoading.value = false;
  imageError.value = false;
};

const handleImageError = () => {
  imageError.value = true;
  imageLoading.value = false;
};

const handleImageSrcChange = () => {
  imageLoading.value = true;
  imageError.value = false;
};

const firstLetter = computed(() => {
  return authStore.user?.name?.charAt(0).toUpperCase() || '?';
});
</script>

<template>
  <div class="photo-container">
    <div
      v-if="authStore.user?.avatars"
      class="avatar-wrapper"
    >
      <div
        v-if="imageLoading"
        class="avatar-loading"
      >
        <i
          class="pi pi-spin pi-spinner"
          style="font-size: 1.2rem"
        />
      </div>
      
      <img 
        :src="authStore.user?.avatars"
        class="avatar-photo"
        :class="{ 'hidden': imageLoading }"
        alt="Avatar"
        @load="handleImageLoad"
        @error="handleImageError"
        @srcchange="handleImageSrcChange"
      >
      
      <div
        v-if="imageError"
        class="avatar-placeholder error-placeholder"
      >
        {{ firstLetter }}
      </div>
    </div>

    <div
      v-else
      class="avatar-placeholder"
    >
      {{ firstLetter }}
    </div>
  </div>
</template>

<style scoped>
.photo-container {
  height: 36px;
  width: 36px;
  display: flex;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  height: 36px;
  width: 36px;
  border-radius: 10px;
  overflow: hidden;
}

.avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s ease;
}

.avatar-photo.hidden {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
}

.avatar-placeholder {
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background-color: rgb(36 50 205);
  color: white;
  text-transform: uppercase;
}

.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.avatar-loading {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-ground);
  border-radius: 10px;
  z-index: 1;
}

/* Анимация для спиннера */
.pi-spinner {
  animation: spin 1s linear infinite;
  color: var(--primary-color);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
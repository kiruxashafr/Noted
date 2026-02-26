<script setup lang="ts">
import { watchEffect } from 'vue';
import { useAuthStore } from './stores/auth.store';

const authStore = useAuthStore()

watchEffect(() => {
  if (authStore.accessToken && !authStore.user) {
    authStore.fetchProfile()
  }
})
</script>

<template>
  <div>hello</div>
</template>

<style scoped lang="css">

</style>

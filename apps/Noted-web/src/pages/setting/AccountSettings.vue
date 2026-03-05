<script setup lang="ts">
import { useAccount } from '../../composables/useAccount';

const { deleteAccount } = useAccount()

</script>
<template>
  <section class="settings-section">
    account setting
    <Button
      label="Delete my account"
      @click="deleteAccount"
    />
  </section>
</template>
<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 1rem;
}
</style>
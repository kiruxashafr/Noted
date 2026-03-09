<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});
</script>

<template>
  <Card style="background-color: transparent; box-shadow: none; gap: 1px">
    <template #title>
      <i class="pi pi-file" />
      {{ title }}
    </template>
    <template #subtitle>
      <div>Обновлен: {{ updatedAt?.toLocaleString() }}</div>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-card-caption) {
  gap: 0px;
}
:deep(.p-card-body):hover {
  background-color: var(--neutral-active);
  cursor: pointer;
}
:deep(.p-card-body) {
  border-radius: 6px;
  padding: 5px;
  gap: 0px;
}
</style>

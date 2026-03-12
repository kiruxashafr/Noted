<script setup lang="ts">
import { CreateBlockRequest } from "@noted/types";
import { useBlockStore } from "../../stores/block.store";

const blockStore = useBlockStore();
const createData: CreateBlockRequest = {
  blockType: "CONTAINER",
  meta: {
    title: "Новая страница",
  },
  order: 0,
};
async function createContainer() {
  await blockStore.createContainer(createData);
}
</script>

<template>
  <Card style="background-color: transparent; box-shadow: none; gap: 1px" @click="createContainer">
    <template #title>
      <i class="pi pi-plus" />
      Новая страница
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

<script setup lang="ts">
import ContainerTitle from "../../components/blocks/ContainerTitle.vue";
import CreateContainerButton from "../../components/buttons/CreateContainerButton.vue";
import { useBlockStore } from "../../stores/block.store";

const blockStore = useBlockStore();

</script>
<template>
  <div class="pages">
    <h1>Домашняя страница</h1>

    <ContainerTitle
      v-for="page in blockStore.containersTitle"
      :id="page.id"
      :key="page.id"
      :title="page.title"
      :updated-at="page.updatedAt"
    />
    <CreateContainerButton />
  </div>
</template>
<style scoped>
.pages {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  gap: 5px;
}
</style>

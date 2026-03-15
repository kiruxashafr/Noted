<script setup lang="ts">
import { useI18n } from "vue-i18n";
import ContainerTitle from "../../components/blocks/ContainerTitle.vue";
import CreateContainerButton from "../../components/buttons/CreateContainerButton.vue";
import { useBlockStore } from "../../stores/block.store";

const { t } = useI18n();
const blockStore = useBlockStore();
</script>

<template>
  <div class="pages">
    <h1>{{ t("common.home") }}</h1>

    <ContainerTitle
      v-for="page in blockStore.containersTitle"
      :id="page.id"
      :key="page.id"
      :title="page.title"
      :updated-at="page.updatedAt" />
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

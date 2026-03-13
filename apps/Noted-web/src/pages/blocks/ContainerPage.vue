<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useBlockStore } from "../../stores/block.store";
import BlockRender from "../../components/blocks/BlockRender.vue";

const blockStore = useBlockStore();
const props = defineProps<{ id: string }>();

const load = (id: string) => {
  blockStore.getPage(id);
};

const addTextBlock = async () => {
  await blockStore.createBlock({
    blockType: "TEXT",
    parentId: props.id,
    meta: {
      payload: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    },
  });
};

onMounted(() => load(props.id));
watch(
  () => props.id,
  newId => load(newId),
);

const currentPage = computed(() => 
  blockStore.containersTitle.find(c => c.id === props.id)
);

const title = computed(() => 
  currentPage.value?.title || "Без названия"
);

const childBlocks = computed(() => {
  return [...blockStore.blocks]
    .filter(block => block.id !== props.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
});
</script>

<template>
  <div class="page">
    <div v-if="currentPage" class="container">
      <InputText
        v-model="title"
        placeholder="Введите название страницы"
        class="borderless-title"
        @change="blockStore.updateContainerTitle(props.id, title)"
      />
      <div class="block-container">
        <BlockRender
          v-for="block in childBlocks"
          :key="block.id"
          :block-id="block.id"
        />
      </div>

      <div style="cursor: pointer" @click="addTextBlock" class="add-button">
        <i class="pi pi-plus" />
        <span>Добавить текстовый блок</span>
      </div>
    </div>

    <div v-else class="flex align-items-center gap-2">
      <i class="pi pi-spin pi-spinner" />
      <span>Загрузка страницы...</span>
    </div>
  </div>
</template>

<style scoped>
.block-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.page {
  width: 100%;
  max-width: 800px;
}

.borderless-title {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;              
  outline: none !important;           
  box-shadow: none !important;
  border-radius: 0 !important;
  line-height: 1.2;    
  font-size: 2rem;
  font-weight: bold;                
}

.borderless-title:focus {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}
</style>
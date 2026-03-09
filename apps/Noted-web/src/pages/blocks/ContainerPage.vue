<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useContainerStore } from '../../stores/container.store';
import { useBlockStore } from '../../stores/block.store';
import BlockRender from '../../components/blocks/BlockRender.vue';

const containerStore = useContainerStore();
const blockStore = useBlockStore();
const props = defineProps<{ id: string }>();

const load = (id: string) => {
  containerStore.getContainers();
  blockStore.getChildBlocks(id);
};

const addTextBlock = async () => {
  await blockStore.createBlock({
    blockType: 'TEXT',
    parentId: props.id,
    order: childBlocks.value.length + 1,
    meta: {
      payload: { 
        type: 'doc', 
        content: [{ type: 'paragraph' }] 
      } 
    }
  });
};

onMounted(() => load(props.id));
watch(() => props.id, (newId) => load(newId));

const currentPage = computed(() => 
  containerStore.containersTitle.find(c => c.id === props.id)
);

const title = computed(() => {
  const containerName = currentPage.value?.title;
  return containerName || 'Без названия';
});

const childBlocks = computed(() => {
  return blockStore.blocks.filter(block => {
    if (!block.path) return false;
    
    const segments = block.path.split('.');
    const parentId = props.id;
    const parentIndex = segments.indexOf(parentId);
    
    return parentIndex !== -1 && segments.length === parentIndex + 2;
  });
});
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div v-if="currentPage">
      <h1
        class="text-4xl font-bold mb-6"
        style="margin-bottom: 30px;"
      >
        {{ title }}
      </h1>
      
      <div class="flex flex-column gap-4">
        <BlockRender
          v-for="block in childBlocks" 
          :key="block.id" 
          :block-id="block.id" 
        />
      </div>

      <div 
        class="mt-4 p-3 border-round border-dashed border-2 border-300 text-500 hover:text-primary hover:border-primary cursor-pointer transition-colors flex align-items-center justify-content-center gap-2"
        @click="addTextBlock"
      >
        <i class="pi pi-plus" />
        <span>Добавить текстовый блок</span>
      </div>
      
    </div>
    
    <div
      v-else
      class="flex align-items-center gap-2"
    >
      <i class="pi pi-spin pi-spinner" />
      <span>Загрузка страницы...</span>
    </div>
  </div>
</template>
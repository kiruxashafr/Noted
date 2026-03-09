<script setup lang="ts">
import { computed, watch } from 'vue';
import { useBlockStore } from '../../stores/block.store';
import { debounce } from 'lodash-es';
import TextBlock from './TextBlock.vue';
import { TextMetaContent } from '@noted/types';


const props = defineProps<{
  blockId: string;
}>();

const blockStore = useBlockStore();

const block = computed(() => 
  blockStore.blocks.find(b => b.id === props.blockId)
);

const debouncedUpdate = debounce(async (newMeta: any) => {
  if (!block.value) return;
  
  await blockStore.updateBlock({
    blockId: block.value.id,
    blockType: block.value.type,
    meta: newMeta
  });
}, 1000);

watch(
  () => block.value?.meta,
  (newMeta, oldMeta) => {
    if (!newMeta) return;

    if (JSON.stringify(newMeta) === JSON.stringify(oldMeta)) return;

    debouncedUpdate(newMeta);
  },
  { deep: true }
);
</script>

<template>
  <div v-if="block" class="block-item mb-2">
<template v-if="block.type === 'TEXT'">
  <TextBlock 
    v-model="(block.meta as unknown as TextMetaContent)" 
    :block="block" 
  />
</template>

    <template v-else-if="block.type === 'CONTAINER'">
      <router-link :to="`/container/${block.id}`" class="no-underline text-900">
        <div class="p-3 border-1 border-300 border-round hover:surface-100 transition-colors cursor-pointer flex align-items-center gap-3">
          <i class="pi pi-folder text-primary text-xl"></i>
          <span class="font-medium">
             {{ (block.meta as any)?.title || 'Без названия' }}
          </span>
        </div>
      </router-link>
    </template>
  </div>
</template>
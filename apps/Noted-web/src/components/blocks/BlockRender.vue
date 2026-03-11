<script setup lang="ts">
import { computed, watch } from 'vue';
import { useBlockStore } from '../../stores/block.store';
import { debounce } from 'lodash-es';
import TextBlock from './TextBlock.vue';
import { TextMetaContent } from '@noted/types';
import BlockAccordion from '../accordion/BlockAccordion.vue';


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
  <div
    v-if="block"
    class="block"
  >
    <template v-if="block.type === 'TEXT'">
      <div class="block-content">
        <TextBlock 
          v-model="(block.meta as unknown as TextMetaContent)" 
          :block="block" 
        />
      </div>
    </template>

    <BlockAccordion :block-id="props.blockId" />
  </div>

</template>
<style scoped>
.block {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--border-light);
  border-radius: 6px;
}

.block-content {
  width: 95%;
}
</style>
<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useBlockStore } from "../../stores/block.store";
import BlockRender from "../../components/blocks/BlockRender.vue";

const blockStore = useBlockStore();
const props = defineProps<{ id: string }>();

const load = (id: string) => {
  blockStore.getPage(id);
};

const onTitleBlur = (e: FocusEvent) => {
  const el = e.currentTarget as HTMLElement;
  const newTitle = el.innerText.trim();

  if (newTitle && newTitle !== title.value) {
    blockStore.updateContainerTitle(props.id, newTitle);
  } else if (!newTitle) {
    el.innerText = title.value;
  }
};

const onTitleEnter = (e: KeyboardEvent) => {
  (e.currentTarget as HTMLElement).blur();
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

const currentPage = computed(() => blockStore.containersTitle.find(c => c.id === props.id));

const title = computed(() => {
  return currentPage.value?.title || "Без названия";
});

const childBlocks = computed(() => {
  return [...blockStore.blocks].filter(block => block.id !== props.id).sort((a, b) => (a.order || 0) - (b.order || 0));
});
</script>

<template>
  <div class="page">
    <div v-if="currentPage" class="container">
      <h1
        class="text-4xl font-bold mb-6 outline-none"
        contenteditable="true"
        spellcheck="false"
        @blur="onTitleBlur"
        @keydown.enter.prevent="onTitleEnter">
        {{ title }}
      </h1>

      <div class="block-container">
        <BlockRender v-for="block in childBlocks" :key="block.id" :block-id="block.id" />
      </div>

      <div style="cursor: pointer" @click="addTextBlock">
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
h1[contenteditable]:focus {
  outline: none;
}

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
</style>

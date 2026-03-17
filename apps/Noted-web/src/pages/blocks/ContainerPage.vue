<script setup lang="ts">
import { computed, onMounted, watch, ref } from "vue";
import { useBlockStore } from "../../stores/block.store";
import BlockRender from "../../components/blocks/BlockRender.vue";
import CreateBlockAccordion from "../../components/accordion/CreateBlockAccordion.vue";
import { useI18n } from "vue-i18n";
import InputText from "primevue/inputtext";
import { debounce } from "lodash-es";

const blockStore = useBlockStore();
const props = defineProps<{ id: string }>();
const { t } = useI18n();

const localTitle = ref("");

const load = (id: string) => {
  blockStore.getPage(id);
};

onMounted(() => load(props.id));

watch(
  () => props.id,
  (newId) => {
    load(newId);
  }
);

const currentPage = computed(() => 
  blockStore.containersTitle.find(c => c.id === props.id)
);

watch(
  currentPage,
  (newVal) => {
    if (newVal && newVal.title !== localTitle.value) {
      localTitle.value = newVal.title || "";
    }
  },
  { immediate: true }
);

const debouncedSaveTitle = debounce((newTitle: string) => {
  blockStore.updateContainerTitle(props.id, newTitle);
}, 500);

const onTitleInput = (e: any) => {
  const value = e.target.value;
  localTitle.value = value;
  debouncedSaveTitle(value);
};

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
        :model-value="localTitle"
        :placeholder="t('common.new-page')"
        class="borderless-title"
        @input="onTitleInput"
      />
      
      <div class="block-container">
        <BlockRender
          v-for="block in childBlocks"
          :key="block.id"
          :block-id="block.id"
        />
      </div>
      
      <CreateBlockAccordion :parent-id="props.id" />
    </div>

    <div v-else class="flex align-items-center gap-2 loading-state">
      <i class="pi pi-spin pi-spinner" />
      <span>{{ t("common.loading") }} {{ t("common.page").toLowerCase() }}...</span>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.block-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
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

.loading-state {
  padding: 2rem;
  justify-content: center;
  color: var(--text-color-secondary);
}
</style>
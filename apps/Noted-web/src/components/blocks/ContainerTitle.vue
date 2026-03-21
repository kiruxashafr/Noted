<script setup lang="ts">
import { useRouter } from "vue-router";
import ContainerAccordion from "../accordion/ContainerAccordion.vue";
import { useI18n } from "vue-i18n";
import { useTimeAgo } from "../../composables/useTimeAgo";

const router = useRouter();
const { t } = useI18n();
const { format} = useTimeAgo();

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: [Date, String],
    required: true,
  },
});

const handlePageClick = (id: string) => {
  router.push({
    name: "note",
    params: { id },
  });
};

</script>

<template>
  <Card style="background-color: transparent; box-shadow: none; gap: 1px" @click="handlePageClick(id)">
    <template #title>
      <i class="pi pi-file" />
      {{ title }}
    </template>
    <template #subtitle>
      <div>
        {{ t('common.updated') }}: {{ format(props.updatedAt) }}
      </div>
    </template>
    <template #content>
      <ContainerAccordion :block-id="id" />
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
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
</style>

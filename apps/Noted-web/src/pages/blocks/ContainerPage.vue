<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useBlock } from '../../composables/useBlock';
import { PageTitle } from '@noted/types/block.types'
import ContainerTitle from '../../components/blocks/ContainerTitle.vue';

const { getPageTitle } = useBlock()
const pages = ref<PageTitle[]>([]);


onMounted(async () => {
    const pageResponse = await getPageTitle()
    pages.value = pageResponse?.data
    const rawData = pageResponse?.data || []
    pages.value = rawData.map((item: PageTitle) => ({
        id: item.id,
        title: item.title,
        updatedAt: new Date(item.updatedAt)
    }))
})

</script>
<template>
  <div class="pages">
    <h1>Домашняя страница</h1>

    <ContainerTitle
      v-for="page in pages"
      :id="page.id"
      :key="page.id"
      :title="page.title"
      :updated-at="page.updatedAt"
    />
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
import { defineStore } from "pinia";
import $api from "../api/instance";
import { PageTitle } from '@noted/types/block.types'
import { ref } from "vue";


export const useBlockStore = defineStore(
    "container",
    () => {
        const containers = ref<PageTitle[]>([]);

        async function getContainerTitle() {
            try {
                const { data } = await $api.get<PageTitle[]>("/api/blocks/page/title");
                containers.value = data.map((item: PageTitle) => ({
                    ...item,
                    updatedAt: new Date(item.updatedAt)
                }));
            } catch (error) {
                console.error("Ошибка при загрузке заголовков:", error);
            }
        }

        return { 
            containers, 
            getContainerTitle 
        };
    }
);
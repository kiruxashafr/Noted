import { defineStore } from "pinia";
import $api from "../api/instance";
import { BlockWithPath, CreateBlockRequest, PageTitle } from "@noted/types/block.types";
import { ref } from "vue";
import { useToast } from "primevue/usetoast";

export const useContainerStore = defineStore(
  "container",
  () => {
    const toast = useToast();
    
    const containersTitle = ref<PageTitle[]>([]);
    const containers = ref<BlockWithPath[]>([]);

    const upsertItems = (target: any[], items: any[]) => {
      items.forEach((newItem) => {
        const index = target.findIndex((b) => b.id === newItem.id);
        if (index !== -1) {
          target[index] = newItem;
        } else {
          target.push(newItem);
        }
      });
    };

    async function getContainerTitle() {
      try {
        const { data } = await $api.get<PageTitle[]>("/api/blocks/page/title");
        containersTitle.value = data.map((item) => ({
          ...item,
          updatedAt: new Date(item.updatedAt),
        }));
      } catch (error) {
        console.error("Ошибка при загрузке заголовков:", error);
      }
    }

    async function getContainers() {
      try {
        const { data } = await $api.get<BlockWithPath[]>("/api/blocks/page/title");
        upsertItems(containers.value, data);
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "Ошибка",
          detail: "Не удалось получить страницы",
          life: 3000,
        });
      }
    }

    return {
      containersTitle,
      containers,
      getContainerTitle,
      getContainers,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ["containersTitle", "containers"],
    },
  },
);
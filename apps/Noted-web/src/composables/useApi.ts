import { ref } from "vue";
import $api from "../api/instance";

export function useApi<T>(url: string, options: any = {}) {
  const data = ref<T | null>(null);
  const error = ref<any>(null);
  const isLoading = ref(false);

  const execute = async (payload?: any) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $api({
        url,
        method: options.method || "GET",
        data: payload || options.body,
        ...options,
      });
      data.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return { data, error, isLoading, execute };
}

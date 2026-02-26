// src/composables/useApi.ts
import { defu } from 'defu';
import { $fetch, type FetchOptions } from 'ofetch';

export async function useApi<T>(url: string, options: FetchOptions<'json'> = {}) {
  const token = localStorage.getItem('accessToken');

  const defaults: FetchOptions = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    credentials: 'include',

    onRequest({ options }) {
      if (token) {
        options.headers = defu(options.headers, {
          Authorization: `Bearer ${token}`
        });
      }
    },

    async onResponseError({ response, options }) {
      if (response.status === 401 && !url.includes('/auth/refresh')) {
        try {
          const { accessToken } = await $fetch<{ accessToken: string }>(
            '/auth/refresh', 
            { baseURL: defaults.baseURL, method: 'POST', credentials: 'include' }
          );

          localStorage.setItem('accessToken', accessToken);
          
          window.location.reload(); 
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          window.location.href = '/auth/login';
        }
      }
    }
  };

  return $fetch<T>(url, defu(options, defaults) as FetchOptions<'json'>);
}
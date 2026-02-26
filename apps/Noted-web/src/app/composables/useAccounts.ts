import { useApi } from './useApi';
import  { 

} from '@noted/types/auth.types'; 

// Если используешь vue-i18n и какую-то библиотеку для тостов
// import { useI18n } from 'vue-i18n';
// import { useToast } from 'some-toast-library';

export const useAccounts = () => {
  // const toast = useToast();
  // const { t } = useI18n();

  const fetchAccounts = async (params: FilterAccountRequest) => {
    // В ofetch параметры запроса передаются через 'query'
    return await useApi<Pageable<AccountResponse>>('/accounts', {
      method: 'GET',
      query: params
    });
  };

  const fetchAccount = async (id: string) => {
    return await useApi<AccountResponse>(`/accounts/${id}`, { 
      method: 'GET' 
    });
  };

  const createAccount = async (body: CreateAccountRequest) => {
    try {
      const data = await useApi<AccountResponse>('/accounts', {
        method: 'POST',
        body
      });
      // toast.success(t('toasts.accounts.created.title'));
      return data;
    } catch (error) {
      console.error(error);
      // toast.error(t('toasts.accounts.created.error'));
      throw error; // Пробрасываем ошибку для обработки в UI
    }
  };

  const updateAccount = async (id: string, body: UpdateAccountRequest) => {
    try {
      return await useApi<AccountResponse>(`/accounts/${id}`, {
        method: 'PATCH',
        body
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await useApi(`/accounts/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const changePassword = async (payload: ChangePasswordRequest) => {
    try {
      await useApi('/accounts/me/password', {
        method: 'PATCH',
        body: payload
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    fetchAccounts,
    fetchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    changePassword
  };
};
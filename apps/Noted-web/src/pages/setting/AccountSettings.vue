<script setup lang="ts">
import { computed, ref } from "vue";
import { useAccount } from "../../composables/useAccount";
import { useAuthStore } from "../../stores/auth.store";


const { deleteAccount, updateAccount } = useAccount();
const authStore = useAuthStore()

const oldName = ref(authStore.user?.name)
const newName = ref('')
const updateData = computed(() => ({ name: newName.value }));
const handleUpdate = async () => {
  await updateAccount(updateData.value)
  if (authStore.user) {
    authStore.user.name = newName.value;
    oldName.value = newName.value; 
    newName.value = '';
  }
}

</script>
<template>
  <section class="settings-section">
    <form style="display: flex; flex-direction: column; gap: 20px;" @submit.prevent="handleUpdate">
      <InputText
        v-model="newName"
        :default-value="oldName"
      />
      <Button
        type="submit"
        label="Изменить профиль"
      />
    </form>
    <Button
      label="Delete my account"
      @click="deleteAccount"
    />
  </section>
</template>
<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
</style>

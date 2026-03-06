<script setup lang="ts">
import { ref, watch } from 'vue';
import { z } from 'zod';

const passwordModel = defineModel<string>('password')

const confirmPassword = ref('');
const errors = ref<{ password?: string; confirm?: string }>({});

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/[a-z]/, 'Должна быть строчная буква')
    .regex(/[A-Z]/, 'Должна быть заглавная буква')
    .regex(/\d/, 'Должна быть цифра')
    .regex(/[\W_]/, 'Должен быть спецсимвол'),
  confirm: z.string()
}).refine(data => data.password === data.confirm, {
  message: 'Пароли не совпадают',
  path: ['confirm']
});

const validate = () => {
  const result = passwordSchema.safeParse({
    password: passwordModel.value,
    confirm: confirmPassword.value
  });
  
  if (!result.success) {
    const formatted = result.error.format();
    errors.value = {
      password: formatted.password?._errors[0],
      confirm: formatted.confirm?._errors[0]
    };
  } else {
    errors.value = {};
  }
};

watch(passwordModel, () => {
  validate();
});

watch(confirmPassword, () => {
  validate();
});


</script>

<template>
  <div class="password-form">
    <Password
      v-model="passwordModel"
      type="password"
      placeholder="Password"
      :feedback="false"
      @input="validate"
    />
    <span
      v-if="errors.password"
      class="error"
    >{{ errors.password }}</span>
    
    <Password
      v-model="confirmPassword"
      type="password"
      :feedback="false"
      placeholder="Confirm password"
    />
    <span
      v-if="errors.confirm"
      class="error"
    >{{ errors.confirm }}</span>
  </div>
</template>

<style scoped>
.password-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
  border: 1px var(--border-input) solid;
  border-radius: 6px;
}

.error {
  color: red;
  font-size: 12px;
  margin-top: -10px;
}
</style>
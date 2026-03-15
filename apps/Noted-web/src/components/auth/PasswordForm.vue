<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";

const passwordModel = defineModel<string>("password");
const isValid = defineModel<boolean>("isValid", { default: false });

const { t } = useI18n();
const confirmPassword = ref("");
const errors = ref<{ password?: string; confirm?: string }>({});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, t('auth.validation.password.min'))
      .regex(/[a-z]/, t('auth.validation.password.lowercase'))
      .regex(/[A-Z]/, t('auth.validation.password.uppercase'))
      .regex(/\d/, t('auth.validation.password.digit'))
      .regex(/[\W_]/, t('auth.validation.password.special')),
    confirm: z.string(),
  })
  .refine(data => data.password === data.confirm, {
    message: t('auth.validation.password.mismatch'),
    path: ["confirm"],
  });

const validate = () => {
  const result = passwordSchema.safeParse({
    password: passwordModel.value,
    confirm: confirmPassword.value,
  });

  if (!result.success) {
    const formatted = result.error.format();
    errors.value = {
      password: formatted.password?._errors[0],
      confirm: formatted.confirm?._errors[0],
    };
    isValid.value = false;
  } else {
    errors.value = {};
    isValid.value = true;
  }
};

watch(passwordModel, () => validate(), { immediate: true });
watch(confirmPassword, () => validate(), { immediate: true });
</script>

<template>
  <div class="password-form">
    <Password
      v-model="passwordModel"
      type="password"
      :placeholder="t('auth.password.placeholder')"
      :feedback="false"
      @input="validate"
    />
    <span v-if="errors.password" class="error">{{ errors.password }}</span>

    <Password
      v-model="confirmPassword"
      type="password"
      :placeholder="t('auth.password.confirm-placeholder')"
      :feedback="false"
    />
    <span v-if="errors.confirm" class="error">{{ errors.confirm }}</span>
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
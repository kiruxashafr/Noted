<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";

const { t } = useI18n();

const validationSchema = computed(() => {
  return toTypedSchema(
    z.object({
      password: z
        .string()
        .min(8, t('auth.password.validation.min'))
        .regex(/[a-z]/, t('auth.password.validation.lowercase'))
        .regex(/[A-Z]/, t('auth.password.validation.uppercase'))
        .regex(/\d/, t('auth.password.validation.digit'))
        .regex(/[\W_]/, t('auth.password.validation.special')),
      confirm: z.string().min(1, t('auth.password.validation.required')),
    })
    .refine(data => data.password === data.confirm, {
      message: t('auth.password.validation.mismatch'),
      path: ["confirm"],
    })
  );
});

const { errors, defineField, meta, values } = useForm({
  validationSchema,
  initialValues: {
    password: "",
    confirm: "",
  },
});

const [password] = defineField("password");
const [confirmPassword] = defineField("confirm");

const passwordModel = defineModel<string>("password");
const isValid = defineModel<boolean>("isValid", { default: false });

watch(() => values.password, (val) => {
  passwordModel.value = val;
});

watch(() => meta.value.valid, (valid) => {
  isValid.value = valid;
}, { immediate: true });
</script>

<template>
  <div class="password-form">
    <Password
      v-model="password"
      type="password"
      :placeholder="t('auth.password.placeholder')"
      :feedback="false"
      :class="{ 'p-invalid': errors.password }"
    />
    <span v-if="errors.password" class="error">{{ errors.password }}</span>

    <Password
      v-model="confirmPassword"
      type="password"
      :placeholder="t('auth.password.confirm-placeholder')"
      :feedback="false"
      :class="{ 'p-invalid': errors.confirm }"
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

.p-invalid {
  border-color: red !important;
}
</style>
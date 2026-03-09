<template>
  <div class="not-found-container">
    <Card class="not-found-card shadow-4">
      <template #header>
        <div class="flex justify-content-center pt-5">
          <img src="../../public/images/logo/noted-mid-light.png" alt="Noted Logo" class="w-5rem" />
        </div>
      </template>

      <template #title>
        <div class="text-center text-800 text-6xl font-bold mt-2">404</div>
      </template>

      <template #content>
        <div class="text-center">
          <h2 class="text-900 font-medium mb-3">Страница не найдена</h2>
          <p class="text-600 line-height-3 mb-5">Упс! Похоже, путь, по которому вы прошли, ведет в никуда.</p>
        </div>
      </template>

      <template #footer>
        <div class="buttons">
          <Button
            label="Вернуться на главную"
            icon="pi pi-home"
            class="w-full p-button-raised"
            @click="$router.push('/')" />
          <Button
            label="Вернуться назад"
            icon="pi pi-arrow-left"
            severity="secondary"
            variant="text"
            class="w-full"
            @click="$router.back()" />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--surface-ground);
  padding: 20px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.not-found-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  text-align: center;
}

:deep(.p-button) {
  padding: 12px;
}

:deep(.p-card-body) {
  padding: 2rem;
}

img {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style>

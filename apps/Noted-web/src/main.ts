import "./styles.css";
import router from "./router";
import { createApp } from "vue";
import App from "./pages/App.vue";
import { createPinia } from "pinia";
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'


const app = createApp(App);
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router);
app.use(ToastService)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.mount("#root");

import "./styles.css";
import router from "./router";
import { createApp } from "vue";
import App from "./pages/App.vue";
import { createPinia } from "pinia";
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Card from "primevue/card";
import Password from "primevue/password";
import Divider from "primevue/divider";
import Toast from "primevue/toast";


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
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Card', Card)
app.component('Password', Password)
app.component('Divider', Divider)
app.component('Toast', Toast)
app.mount("#root");

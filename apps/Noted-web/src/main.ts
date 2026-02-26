import "./styles.css";
import router from "./router";
import { createApp } from "vue";
import App from "./app/App.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'


const app = createApp(App);
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)
app.use(router);
app.mount("#root");

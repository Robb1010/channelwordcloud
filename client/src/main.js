import Vue from 'vue'
import App from './App.vue'
import VueWordCloud from 'vuewordcloud';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';
import '@fortawesome/fontawesome-free/css/all.css';

Vue.use(Vuetify)

Vue.component(VueWordCloud.name, VueWordCloud);

Vue.config.productionTip = false


new Vue({
  render: h => h(App),
  icons: {
    iconfont: 'fa',
  },
}).$mount('#app')

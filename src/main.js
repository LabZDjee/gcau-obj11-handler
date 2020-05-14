/* jshint esversion: 9 */
import "vue-resize/dist/vue-resize.css";

import Vue from "vue";
import App from "./App.vue";
import Buefy from "buefy";
import Vuex from "vuex";
import VueResize from "vue-resize";

import { library } from "@fortawesome/fontawesome-svg-core";
// internal icons
import { faFolder, faPlus, faMinus, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import cfg11Defaults from "./store/cfg11Defaults";

import { ipcRenderer } from "electron";

import cfg11 from "./store/cfg11";

library.add(faFolder, faPlus, faMinus, faExclamationCircle);

Vue.component("vue-fontawesome", FontAwesomeIcon);

Vue.use(Buefy, {
  defaultIconComponent: "vue-fontawesome",
  defaultIconPack: "fas",
});

Vue.use(VueResize);

Vue.use(Vuex);

for (let objectName in cfg11Defaults) {
  cfg11.state[objectName] = { ...cfg11Defaults[objectName] };
}

const store = new Vuex.Store({
  modules: {
    cfg11,
  },
});

Vue.config.productionTip = false;

const v = new Vue({
  render: (h) => h(App),
  store,
}).$mount("#app");

ipcRenderer.on("store-mutation", function(e, what, value) {
  if (what === "setDefault") {
    const captures = /^\/(.+)\/(.*)$/.exec(value);
    if (captures !== null) {
      value = new RegExp(captures[1], captures[2]);
    }
  }
  v.$store.commit(what, value);
});

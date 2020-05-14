/* jshint esversion: 9 */

import objectDefaults from "./cfg11Defaults";

export default {
  mutations: {
    storeValues(state, payload) {
      const { objectName, values } = payload;
      for (let k in values) {
        if (state[objectName][k] !== undefined) {
          state[objectName][k] = values[k];
        }
      }
    },
    setDefault(state, objectName) {
      let objects = [];
      console.log(objectName);
      if (objectName instanceof RegExp) {
        for (let curObjectName in state) {
          if (objectName.test(curObjectName)) {
            objects.push(curObjectName);
          }
        }
      } else {
        objects.push(objectName);
      }
      objects.forEach((object) => {
        for (let attr in state[object]) {
          state[object][attr] = objectDefaults[object][attr];
        }
      });
    },
  },
  getters: {
    getAnix: (state) => (instanceNum) => {
      return state[`ANIX_${instanceNum}`];
    },
    getCommun2: (state) => {
      return state.COMMUN2;
    },
    getEq: (state) => (instanceNum) => {
      return state[`EQ_${instanceNum}`];
    },
    getEqctrl: (state) => {
      return state.EQCTRL;
    },
    getEvt: (state) => (instanceNum) => {
      return state[`EVT_${instanceNum}`];
    },
    getSystex: (state) => {
      return state.SYSTEX;
    },
    getSingleAttribute: (state) => (object, attribute) => {
      return state[object][attribute];
    },
  },
  state: {},
};

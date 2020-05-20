/* jshint esversion: 9 */

import objectDefaults from "./cfg11Defaults";
import { notifyOfNewValues } from "../main";

export default {
  mutations: {
    storeValues(state, payload) {
      const { objectName, values } = payload;
      for (let k in values) {
        if (state[objectName][k] !== undefined) {
          state[objectName][k] = values[k];
        }
      }
      notifyOfNewValues([{ objectName, objectValue: values }]);
    },
    setDefault(state, objectName) {
      let objects = [];
      if (objectName instanceof RegExp) {
        for (let curObjectName in state) {
          if (objectName.test(curObjectName)) {
            objects.push(curObjectName);
          }
        }
      } else {
        objects.push(objectName);
      }
      const notifyArray = [];
      objects.forEach((objectName) => {
        notifyArray.push({ objectName, objectValue: objectDefaults[objectName] });
        for (let attr in state[objectName]) {
          state[objectName][attr] = objectDefaults[objectName][attr];
        }
      });
      notifyOfNewValues(notifyArray);
    },
    storeFullConfig(state, objects) {
      for (let objectName in objects) {
        for (let attributeName in objects[objectName]) {
          state[objectName][attributeName] = objects[objectName][attributeName];
          console.log(objectName, attributeName, objects[objectName][attributeName]);
        }
      }
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
    getRegistry: (state) => {
      return state.REGISTRY;
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

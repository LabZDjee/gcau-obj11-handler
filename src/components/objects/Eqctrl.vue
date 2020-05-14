<template>
  <div class="box">
    <div class="panel">
      <div class="panel-heading">
        <div class="columns">
          <div class="column is-vertical-center is-1">
            <b-icon type="is-info" pack="fas" icon="folder" size="is-small"></b-icon>
          </div>
          <div class="column is-2">
            <b-tag type="is-info">{{ objectName }}</b-tag>
          </div>
          <div class="column is-2">
            <b-button @click="setDefault">default</b-button>
          </div>
        </div>
      </div>
      <div v-for="attr in attributeList" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column min-width-number-input has-text-left">{{ attr }}</div>
          <div class="column">
            <b-field>
              <b-numberinput
                class="min-width-number-input"
                size="is-small"
                :min="limits.min"
                :max="limits.max"
                v-model="attributes[attr]"
                @input="gotInput(attr, $event)"
              ></b-numberinput>
            </b-field>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { makeObjectFrom } from "../../util";

export default {
  props: {},
  computed: {
    objectName() {
      return `EQCTRL`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getEqctrl;
      const computedAttributes = {};
      for (let attr in rawAttributes) {
        computedAttributes[attr] = Number(rawAttributes[attr]);
      }
      return computedAttributes;
    },
    attributeList: () => [
      "OnDiox1",
      "OnDiox2",
      "OnLoadCurrent",
      "OnAmbientTemperature",
      "OnBatteryTemperature",
      "OnSC5",
      "OnSC6",
    ],
    limits: () => {
      return { min: 0, max: 48 };
    },
  },
  methods: {
    gotInput(from, value) {
      if (typeof value !== "number") {
        return;
      }
      this.$store.commit("storeValues", {
        objectName: this.objectName,
        values: makeObjectFrom(from, value.toString(10)),
      });
    },
    setDefault() {
      this.$store.commit("setDefault", this.objectName);
    },
  },
};
</script>

<style scoped></style>

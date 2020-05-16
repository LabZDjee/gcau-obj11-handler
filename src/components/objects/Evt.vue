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
      <div class="panel-block">
        <div class="columns">
          <div class="column">Function</div>
          <div class="column">
            <b-select v-model="attributes.Function" @input="gotInput(`Function`, $event)">
              <option v-for="(p, k) in functions" :key="k">{{ p }}</option>
            </b-select>
          </div>
        </div>
      </div>
      <div v-for="attr in assertionAttributes" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column">
            <b-checkbox v-model="attributes[attr]" @input="gotInput(attr, $event)">
              {{ attr }}
            </b-checkbox>
          </div>
        </div>
      </div>
      <div v-for="(attr, attrIndex) in integerAttributes" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column min-width-number-input has-text-left">{{ attr }}</div>
          <div class="column">
            <b-field>
              <b-numberinput
                class="min-width-number-input"
                size="is-small"
                :min="integerRanges[attrIndex].min"
                :max="integerRanges[attrIndex].max"
                v-model="attributes[attr]"
                @input="gotInput(attr, $event)"
              ></b-numberinput>
            </b-field>
          </div>
        </div>
      </div>
      <div v-for="attr in textAttributes" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column min-width-number-input has-text-left">{{ attr }}</div>
          <div class="column">
            <b-field>
              <b-input v-model="attributes[attr]" @input="gotInput(attr, $event)" maxlength="16"></b-input>
            </b-field>
          </div>
          <p class="columns"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { extract, makeObjectFrom, arrayContainsELement } from "../../util";

export default {
  props: {
    instance: {
      type: String,
      required: true,
      validator: function(value) {
        const valueAsNum = Number(value);
        return valueAsNum >= 49 && valueAsNum <= 56;
      },
    },
  },
  computed: {
    objectName() {
      return `EVT_${this.instance}`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getEvt(this.instance);
      const computedAttributes = {};
      for (let prop in rawAttributes) {
        const value = rawAttributes[prop];
        const valueWithColumn = `${value}:`;
        if (prop === "Function") {
          computedAttributes[prop] = extract.startsWithInArray(valueWithColumn, this.functions);
        } else if (arrayContainsELement(this.assertionAttributes, prop)) {
          computedAttributes[prop] = value !== "0";
        } else if (arrayContainsELement(this.integerAttributes, prop)) {
          computedAttributes[prop] = Number(value);
        } else if (arrayContainsELement(this.textAttributes, prop)) {
          computedAttributes[prop] = value;
        }
      }
      return computedAttributes;
    },
    functions: () => [
      "OF: disabled",
      "AL: alarm",
      "EV: event",
      "FF: forced float",
      "HC: high-rate charge",
      "CC: commissioning charge",
      "AA: alarm acknowlegdment",
      "AM: automatic/manual mode",
    ],
    assertionAttributes: () => ["LCDLatch", "RelayLatch", "Shutdown", "CommonAlarm"],
    integerAttributes: () => ["RelayNumber", "NumberOfRelays", "LedNumber", "Delay", "Value"],
    integerRanges: () => [
      { min: 0, max: 64 },
      { min: 1, max: 4 },
      { min: 0, max: 64 },
      { min: 0, max: 14400 },
      { min: 0, max: 65535 },
    ],
    textAttributes: () => ["Text", "LocalText"],
  },
  methods: {
    gotInput(from, value) {
      let transformedValue;
      if (from === "Function") {
        transformedValue = extract.leftToColumn(value);
      } else if (arrayContainsELement(this.assertionAttributes, from)) {
        transformedValue = value ? "1" : "0";
      } else if (arrayContainsELement(this.integerAttributes, from)) {
        if (typeof value !== "number") {
          return;
        }
        transformedValue = value.toString(10);
      } else if (arrayContainsELement(this.textAttributes, from)) {
        transformedValue = value.substring(0, 15);
      }
      this.$store.commit("storeValues", {
        objectName: this.objectName,
        values: makeObjectFrom(from, transformedValue),
      });
    },
    setDefault() {
      this.$store.commit("setDefault", this.objectName);
    },
  },
};
</script>

<style scoped></style>

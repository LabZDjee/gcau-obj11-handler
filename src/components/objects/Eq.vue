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
          <div class="column min-width-number-input has-text-left">RpnExpression</div>
          <div class="column">
            <b-field>
              <b-input v-model="attributes.RpnExpression" @input="gotInput('RpnExpression', $event)"></b-input>
            </b-field>
          </div>
        </div>
      </div>
      <div class="panel-block">
        <div class="columns">
          <div class="column min-width-number-input has-text-left">Label</div>
          <div class="column">
            <b-field>
              <b-input v-model="attributes.Label" @input="gotInput('Label', $event)" maxlength="5"></b-input>
            </b-field>
          </div>
          <p class="columns"></p>
        </div>
      </div>
      <div class="panel-block">
        <div class="columns">
          <div class="column min-width-number-input has-text-left">Unit</div>
          <div class="column">
            <b-field>
              <b-input v-model="attributes.Unit" @input="gotInput('Unit', $event)" maxlength="3"></b-input>
            </b-field>
          </div>
          <p class="columns"></p>
        </div>
      </div>
      <div class="panel-block">
        <div class="columns">
          <div class="column">ModbusMultiplier</div>
          <div class="column">
            <b-select v-model="attributes.ModbusMultiplier" @input="gotInput(`ModbusMultiplier`, $event)">
              <option v-for="(p, k) in modbusMultipliers" :key="k">{{ p }}</option>
            </b-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { makeObjectFrom } from "../../util";

export default {
  props: {
    instance: {
      type: String,
      required: true,
      validator: function(value) {
        const valueAsNum = Number(value);
        return valueAsNum >= 17 && valueAsNum <= 24;
      },
    },
  },
  computed: {
    objectName() {
      return `EQ_${this.instance}`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getEq(this.instance);
      const computedAttributes = { ...rawAttributes };
      return computedAttributes;
    },
    modbusMultipliers: () => [".001", ".01", ".1", "1", "10", "100", "1000"],
  },
  methods: {
    gotInput(from, value) {
      this.$store.commit("storeValues", { objectName: this.objectName, values: makeObjectFrom(from, value) });
    },
    setDefault() {
      this.$store.commit("setDefault", this.objectName);
    },
  },
};
</script>

<style scoped></style>

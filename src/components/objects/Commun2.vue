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
          <div class="column min-width-number-input has-text-left">AltAsciiModbusParity</div>
          <div class="column">
            <b-select v-model="attributes.AltAsciiModbusParity" @input="gotInput(`AltAsciiModbusParity`, $event)">
              <option v-for="(p, k) in altAsciiModbusParityValues" :key="k">{{ p }}</option>
            </b-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { extract, makeObjectFrom } from "../../util";

export default {
  props: {},
  computed: {
    objectName() {
      return `COMMUN2`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getCommun2;
      const valueWithColumn = `${rawAttributes.AltAsciiModbusParity}:`;
      return { AltAsciiModbusParity: extract.startsWithInArray(valueWithColumn, this.altAsciiModbusParityValues) };
    },
    altAsciiModbusParityValues: () => ["0: disabled", "1: odd parity", "2: even parity"],
  },
  methods: {
    gotInput(from, value) {
      this.$store.commit("storeValues", {
        objectName: this.objectName,
        values: makeObjectFrom(from, extract.leftToColumn(value)),
      });
    },
    setDefault() {
      this.$store.commit("setDefault", this.objectName);
    },
  },
};
</script>

<style scoped></style>

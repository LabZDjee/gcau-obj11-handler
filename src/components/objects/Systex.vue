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
          <div class="column">RelayRevPol = 0x{{ attributes.RelayRevPol.toLowerCase() }}</div>
        </div>
      </div>
      <hex-byte
        v-for="board in 8"
        :key="`relay-board${board}`"
        :object="objectName"
        attribute="RelayRevPol"
        :bitfieldDef="relayNumberArray"
        :offset="(Number(board) - 1) * 2"
        :displayResult="false"
        :title="`.RB${board}`"
      ></hex-byte>
      <hex-byte :object="objectName" attribute="ParallelControl" :bitfieldDef="parallelBitDefs"></hex-byte>
      <div class="panel-block">
        <div class="columns">
          <div class="column">
            <b-checkbox v-model="attributes.IrigB" @input="gotInput('IrigB', $event)">Irigb</b-checkbox>
          </div>
        </div>
      </div>
      <div v-for="attr in inputPeriodAttributes" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column">{{ attr }}</div>
          <div class="column">
            <b-select v-model="attributes[attr]" @input="gotInput(attr, $event)">
              <option v-for="(p, k) in dioxInputPeriods" :key="k">{{ p }}</option>
            </b-select>
          </div>
        </div>
      </div>
      <hex-byte :object="objectName" attribute="DioxPwm" :bitfieldDef="dioxPwmBitDefs"></hex-byte>
      <div v-for="attr in dioxMaxPeriodattributes" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column">{{ attr }}</div>
          <div class="column">
            <b-field>
              <b-numberinput
                class="min-width-number-input"
                size="is-small"
                min="0"
                max="507904"
                v-model="attributes[attr]"
                @input="gotInput(attr, $event)"
              ></b-numberinput>
            </b-field>
          </div>
          <div class="column">ms (0 => 50 ms)</div>
        </div>
      </div>
      <div class="panel-block">
        <div class="columns">
          <div class="column">
            <b-checkbox
              v-model="attributes.HumiditySensor"
              @input="gotInput('HumiditySensor', $event)"
            >HumiditySensor</b-checkbox>
          </div>
        </div>
      </div>
      <div v-for="attr in batteryDeadZoneAttributes" :key="attr" class="panel-block">
        <div class="columns">
          <div class="column">{{ attr }}</div>
          <div class="column">
            <b-field>
              <b-numberinput
                class="min-width-number-input"
                size="is-small"
                min="0"
                max="100"
                v-model="attributes[attr]"
                @input="gotInput(attr, $event)"
              ></b-numberinput>
            </b-field>
          </div>
          <div class="column">ADC steps</div>
          <div class="column min-width-number-input">7 is recommended</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HexByte from "../basic/HexByte";
import { extract, makeObjectFrom, arrayContainsELement } from "../../util";

export default {
  components: {
    HexByte,
  },
  computed: {
    objectName() {
      return `SYSTEX`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getSystex;
      const computedAttributes = {};
      for (let prop in rawAttributes) {
        const value = rawAttributes[prop];
        if (arrayContainsELement(this.inputPeriodAttributes, prop)) {
          computedAttributes[prop] = extract.startsWithInArray(`${value}:`, this.dioxInputPeriods);
        } else if (arrayContainsELement(["Irigb", "HumiditySensor"], prop)) {
          computedAttributes[prop] = value !== "0";
        } else if (
          arrayContainsELement(this.dioxMaxPeriodattributes, prop) ||
          arrayContainsELement(this.batteryDeadZoneAttributes, prop)
        ) {
          computedAttributes[prop] = Number(value);
        } else if (arrayContainsELement(["RelayRevPol", "ParallelControl", "DioxPwm"], prop)) {
          computedAttributes[prop] = value;
        }
      }

      return computedAttributes;
    },
    inputPeriodAttributes: () => ["Diox1InputPeriod", "Diox2InputPeriod"],
    dioxMaxPeriodattributes: () => ["DioxMaxPeriod1", "DioxMaxPeriod2", "DioxMaxPeriod3"],
    batteryDeadZoneAttributes: () => ["BatteryPosDeadZone", "BatteryNegDeadZone"],
    dioxInputPeriods: () => [
      ".5: half a second",
      "1: one second",
      "5: five seconds",
      "10: ten seconds",
      "30: half a minute",
      "60: one minute",
      "N: never",
    ],
    relayNumberArray() {
      return Array(8)
        .fill(null)
        .map((_, i) => `${i + 1}`);
    },
    parallelBitDefs: () => [
      "dual comm",
      "current sharing",
      "battery not common",
      "display total current",
      "max temp compensation",
      "min battery voltage",
    ],
    dioxPwmBitDefs: () => [
      "ch 1 (OUT2) of DIOX 1",
      "ch 2 (OUT3) of DIOX 1",
      "ch 1 (OUT2) of DIOX 2",
      "ch 2 (OUT3) of DIOX 2",
    ],
  },
  methods: {
    gotInput(from, value) {
      let transformedValue;
      if (arrayContainsELement(["Irigb", "HumiditySensor"], from)) {
        transformedValue = value ? "1" : "0";
      } else if (arrayContainsELement(this.inputPeriodAttributes, from)) {
        transformedValue = extract.leftToColumn(value);
      } else if (
        arrayContainsELement(this.dioxMaxPeriodattributes, from) ||
        arrayContainsELement(this.batteryDeadZoneAttributes, from)
      ) {
        transformedValue = value.toString();
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

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
          <div class="column">Profile</div>
          <div class="column">
            <b-select v-model="attributes.Profile" @input="gotInput(`Profile`, $event)">
              <option v-for="(p, k) in profiles" :key="k">{{ p }}</option>
            </b-select>
          </div>
        </div>
      </div>
      <div v-for="i in 4" :key="`Gain${i}`" class="panel-block">
        <div class="columns">
          <div class="column">Gain{{ i }}</div>
          <div class="column">
            <b-select v-model="attributes[`Gain${i}`]" @input="gotInput(`Gain${i}`, $event)">
              <option v-for="(g, k) in gains" :key="k">{{ g }}</option>
            </b-select>
          </div>
        </div>
      </div>
      <div v-for="i in 4" :key="`IIRTakeIn${i}`" class="panel-block">
        <div class="columns">
          <div class="column">IIRTakeIn{{ i }}</div>
          <div class="column">
            <b-field>
              <b-numberinput
                class="min-width-number-input"
                size="is-small"
                min="1"
                max="16"
                v-model="attributes[`IIRTakeIn${i}`]"
                @input="gotInput(`IIRTakeIn${i}`, $event)"
              ></b-numberinput>
            </b-field>
          </div>
        </div>
      </div>
      <div v-for="i in 4" :key="`Pol${i}`" class="panel-block">
        <div class="columns">
          <div class="column">Pol{{ i }}</div>
          <div class="column">
            <b-select v-model="attributes[`Pol${i}`]" @input="gotInput(`Pol${i}`, $event)">
              <option v-for="(p, k) in polarities" :key="k">{{ p }}</option>
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
  props: {
    instance: {
      type: String,
      required: true,
      validator: function(value) {
        return ["1", "2", "3", "4"].indexOf(value) >= 0;
      },
    },
  },
  computed: {
    objectName() {
      return `ANIX_${this.instance}`;
    },
    attributes() {
      const rawAttributes = this.$store.getters.getAnix(this.instance);
      const computedAttributes = {};
      for (let prop in rawAttributes) {
        const value = rawAttributes[prop];
        const valueWithColumn = `${value}:`;
        if (prop === "Profile") {
          computedAttributes[prop] = extract.startsWithInArray(valueWithColumn, this.profiles);
        } else if (/^Gain[1-4]$/.test(prop)) {
          computedAttributes[prop] = extract.startsWithInArray(valueWithColumn, this.gains);
        } else if (/^IIRTakeIn[1-4]$/.test(prop)) {
          computedAttributes[prop] = Number(value);
        } else if (/^Pol[1-4]$/.test(prop)) {
          computedAttributes[prop] = extract.startsWithInArray(valueWithColumn, this.polarities);
        }
      }
      return computedAttributes;
    },
    profiles: () => [
      "0: disabled",
      "2: two differential",
      "3: one differential, two single-ended",
      "4: four single-ended",
    ],
    gains: () => ["4096: 4.096 V", "2048: 2.048 V", "1024: 1.024 V", "512: 512 mV", "256: 256 mV"],
    polarities: () => ["1: unipolar", "2: bipolar"],
  },
  methods: {
    gotInput(from, value) {
      let transformedValue;
      if (/^IIRTakeIn[1-4]$/.test(from)) {
        transformedValue = value.toString(10);
      } else {
        transformedValue = extract.leftToColumn(value);
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

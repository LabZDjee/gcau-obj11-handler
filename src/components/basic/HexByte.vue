<template>
  <div class="panel-block">
    <div class="columns is-multiline">
      <div v-if="title !== ''" class="column">
        {{ title }}<span v-if="displayResult"> = 0X{{ numericValueInHex }}</span>
      </div>
      <div v-else class="column">
        {{ attribute }}<span v-if="displayResult"> = 0X{{ numericValueInHex }}</span>
      </div>
      <div v-for="(def, k) in bitfieldDef" :key="k" class="column">
        <b-checkbox v-model="bitfieldArray[k]" @input="gotInput(k, $event)">
          {{ def }}
        </b-checkbox>
      </div>
    </div>
  </div>
</template>

<script>
import { toHex, makeObjectFrom } from "../../util";

export default {
  props: {
    bitfieldDef: {
      // strings defining each bits from bit 0
      type: Array,
      required: true,
      validator: function(value) {
        let ok = value.length !== undefined;
        if (ok) {
          ok = value.length > 0 && value.length <= 8;
        }
        return ok;
      },
    },
    object: { type: String, required: true },
    attribute: { type: String, required: true },
    displayResult: { type: Boolean, default: true }, // display current byte value in hex
    title: { type: String, default: "" }, // default: display attribute instead
    offset: {
      // zero-bsed offset from least significant digit (not byte) in hex string of attribute
      type: Number,
      default: 0, // treats first byte
      validator: function(value) {
        return value >= 0 && value < 30;
      },
    },
  },
  computed: {
    nbBits() {
      return this.bitfieldDef.length;
    },
    bitfieldArray() {
      const value = this.numericValue;
      let mask = 1;
      let valueArray = [];
      for (let i = 0; i < this.nbBits; i++, mask <<= 1) {
        valueArray.push(value & mask ? true : false);
      }
      return valueArray;
    },
    hexString() {
      return this.$store.getters.getSingleAttribute(this.object, this.attribute);
    },
    numericValue() {
      const pos0 = this.hexString.length - this.offset - 2;
      const v = parseInt(this.hexString.substring(pos0, pos0 + 2), 16);
      return isNaN(v) ? 0 : v;
    },
    numericValueInHex() {
      return toHex(this.numericValue, 2);
    },
  },
  methods: {
    gotInput(from, value) {
      let byte = this.numericValue;
      const mask = 1 << from;
      if (value) {
        byte |= mask;
      } else {
        byte &= ~mask;
      }
      const pos0 = this.hexString.length - this.offset - 2;
      const newHexString = `${this.hexString.substring(0, pos0)}${toHex(byte, 2)}${this.hexString.substring(pos0 + 2)}`;
      this.$store.commit("storeValues", {
        objectName: this.object,
        values: makeObjectFrom(this.attribute, newHexString),
      });
    },
  },
};
</script>

<style scoped></style>
